import { randomUUID } from 'crypto';
import { prisma } from '../db/prisma';
import { hashSecret, createOpaqueToken } from './crypto';
import { ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './constants';
import { signAccessToken, verifyAccessToken } from './jwt';
import { verifyPassword } from './password';
import { loginSchema, type LoginInput } from './schemas';

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  permissions: string[];
  sessionId: string;
};

export type LoginResult = {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
};

type UserWithPermissions = NonNullable<Awaited<ReturnType<typeof findActiveUserWithPermissions>>>;

function findActiveUserWithPermissions(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, isActive: true, disabledAt: null },
    include: {
      roles: {
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      },
      permissionOverrides: { include: { permission: true } },
    },
  });
}

function resolvePermissions(user: UserWithPermissions): string[] {
  const permissions = new Set<string>();
  for (const assignment of user.roles) {
    if (!assignment.role.isActive) continue;
    for (const grant of assignment.role.permissions) {
      if (grant.permission.isActive) permissions.add(grant.permission.code);
    }
  }
  for (const override of user.permissionOverrides) {
    if (!override.permission.isActive) continue;
    if (override.effect === 'ALLOW') permissions.add(override.permission.code);
    else permissions.delete(override.permission.code);
  }
  return [...permissions].sort();
}

async function issueAccessToken(user: UserWithPermissions, sessionId: string): Promise<string> {
  return signAccessToken({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    permissions: resolvePermissions(user),
    sessionId,
  }, ACCESS_TOKEN_TTL_SECONDS);
}

export async function authenticateLogin(input: LoginInput): Promise<LoginResult> {
  const { email, password } = loginSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      },
      permissionOverrides: {
        include: { permission: true },
      },
    },
  });

  if (!user || !user.isActive || user.disabledAt) {
    throw new Error('Invalid credentials');
  }

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  const permissions = resolvePermissions(user);

  const sessionId = randomUUID();
  const refreshTokenFamilyId = randomUUID();
  const csrfToken = createOpaqueToken();
  const accessToken = await issueAccessToken(user, sessionId);

  const refreshToken = createOpaqueToken();
  const tokenHash = hashSecret(refreshToken);
  const csrfTokenHash = hashSecret(csrfToken);

  await prisma.$transaction([
    prisma.refreshTokenFamily.create({
      data: {
        id: refreshTokenFamilyId,
        userId: user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    }),
    prisma.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        refreshTokenFamilyId,
        csrfTokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    }),
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        familyId: refreshTokenFamilyId,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
      },
    }),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      permissions,
      sessionId,
    },
    accessToken,
    refreshToken,
    csrfToken,
  };
}

export async function getUserFromAccessToken(token: string | undefined): Promise<AuthenticatedUser | null> {
  if (!token) {
    return null;
  }

  const claims = await verifyAccessToken(token);
  if (!claims?.sub) {
    return null;
  }

  const session = await prisma.session.findFirst({
    where: { id: claims.sessionId, userId: claims.sub, revokedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!session) return null;

  const user = await findActiveUserWithPermissions(claims.sub);
  if (!user) return null;

  return { id: user.id, email: user.email, displayName: user.displayName, permissions: resolvePermissions(user), sessionId: session.id };
}

export async function rotateRefreshToken(rawToken: string): Promise<LoginResult> {
  const now = new Date();
  const tokenHash = hashSecret(rawToken);
  const existing = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!existing) throw new Error('Invalid refresh token');

  const family = await prisma.refreshTokenFamily.findUnique({ where: { id: existing.familyId } });
  const session = await prisma.session.findFirst({ where: { refreshTokenFamilyId: existing.familyId } });
  if (!family || !session) throw new Error('Invalid refresh token');

  if (existing.usedAt || existing.revokedAt) {
    await prisma.$transaction([
      prisma.refreshTokenFamily.update({ where: { id: family.id }, data: { revokedAt: now } }),
      prisma.session.update({ where: { id: session.id }, data: { revokedAt: now, revokedReason: 'REFRESH_TOKEN_REUSE' } }),
      prisma.refreshToken.updateMany({ where: { familyId: family.id, revokedAt: null }, data: { revokedAt: now } }),
    ]);
    throw new Error('Refresh token reuse detected');
  }

  if (existing.expiresAt <= now || family.expiresAt <= now || session.expiresAt <= now || family.revokedAt || session.revokedAt) {
    throw new Error('Refresh token expired or revoked');
  }

  const user = await findActiveUserWithPermissions(existing.userId);
  if (!user) throw new Error('Account unavailable');

  const refreshToken = createOpaqueToken();
  const replacementHash = hashSecret(refreshToken);
  const csrfToken = createOpaqueToken();
  const replacement = await prisma.refreshToken.create({
    data: { userId: user.id, familyId: family.id, tokenHash: replacementHash, expiresAt: family.expiresAt },
  });

  const consumed = await prisma.refreshToken.updateMany({
    where: { id: existing.id, usedAt: null, revokedAt: null },
    data: { usedAt: now, revokedAt: now, replacedById: replacement.id },
  });
  if (consumed.count !== 1) {
    await prisma.refreshToken.delete({ where: { id: replacement.id } });
    throw new Error('Refresh token already consumed');
  }

  await prisma.$transaction([
    prisma.refreshTokenFamily.update({ where: { id: family.id }, data: { lastUsedAt: now } }),
    prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: now, csrfTokenHash: hashSecret(csrfToken) } }),
  ]);

  return {
    user: { id: user.id, email: user.email, displayName: user.displayName, permissions: resolvePermissions(user), sessionId: session.id },
    accessToken: await issueAccessToken(user, session.id),
    refreshToken,
    csrfToken,
  };
}

export async function revokeSession(sessionId: string, reason = 'USER_LOGOUT'): Promise<void> {
  const now = new Date();
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session || session.revokedAt) return;
  await prisma.$transaction([
    prisma.session.update({ where: { id: session.id }, data: { revokedAt: now, revokedReason: reason } }),
    prisma.refreshTokenFamily.update({ where: { id: session.refreshTokenFamilyId }, data: { revokedAt: now } }),
    prisma.refreshToken.updateMany({ where: { familyId: session.refreshTokenFamilyId, revokedAt: null }, data: { revokedAt: now } }),
  ]);
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  const now = new Date();
  const families = await prisma.refreshTokenFamily.findMany({ where: { userId, revokedAt: null }, select: { id: true } });
  const familyIds = families.map(({ id }) => id);
  await prisma.$transaction([
    prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now, revokedReason: 'LOGOUT_ALL_DEVICES' } }),
    prisma.refreshTokenFamily.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: now } }),
    prisma.refreshToken.updateMany({ where: { familyId: { in: familyIds }, revokedAt: null }, data: { revokedAt: now } }),
  ]);
}
