import { getEnv } from '../../lib/env';
import { prisma } from '../db/prisma';
import { createOpaqueToken, hashSecret } from './crypto';
import { hashPassword } from './password';
import { passwordResetConfirmSchema, type PasswordResetConfirmInput } from './schemas';

const RESET_TTL_MS = 30 * 60 * 1000;

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { email: email.trim().toLowerCase(), isActive: true, disabledAt: null } });
  if (!user) return;
  const token = createOpaqueToken();
  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashSecret(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } }),
  ]);
  const env = getEnv();
  if (!env.PASSWORD_RESET_DELIVERY_URL || !env.PASSWORD_RESET_DELIVERY_TOKEN) return;
  const resetUrl = new URL('/reset-password', env.APP_URL);
  resetUrl.searchParams.set('token', token);
  const response = await fetch(env.PASSWORD_RESET_DELIVERY_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${env.PASSWORD_RESET_DELIVERY_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify({ type: 'password-reset', recipient: user.email, displayName: user.displayName, resetUrl: resetUrl.toString(), expiresInMinutes: 30 }),
  });
  if (!response.ok) throw new Error('Password reset delivery failed');
}

export async function confirmPasswordReset(input: PasswordResetConfirmInput): Promise<void> {
  const parsed = passwordResetConfirmSchema.parse(input);
  const now = new Date();
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashSecret(parsed.token) } });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= now) throw new Error('Invalid or expired reset token');
  const consumed = await prisma.passwordResetToken.updateMany({ where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } });
  if (consumed.count !== 1) throw new Error('Invalid or expired reset token');
  const passwordHash = await hashPassword(parsed.password);
  const families = await prisma.refreshTokenFamily.findMany({ where: { userId: resetToken.userId, revokedAt: null }, select: { id: true } });
  const familyIds = families.map(({ id }) => id);
  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } }),
    prisma.session.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: now, revokedReason: 'PASSWORD_RESET' } }),
    prisma.refreshTokenFamily.updateMany({ where: { userId: resetToken.userId, revokedAt: null }, data: { revokedAt: now } }),
    prisma.refreshToken.updateMany({ where: { familyId: { in: familyIds }, revokedAt: null }, data: { revokedAt: now } }),
  ]);
}
