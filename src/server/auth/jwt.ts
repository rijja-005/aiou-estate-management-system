import { SignJWT, jwtVerify } from 'jose';
import { getEnv } from '../../lib/env';

export type AccessTokenClaims = {
  sub: string;
  email: string;
  displayName: string;
  permissions: string[];
  sessionId: string;
};

const encoder = new TextEncoder();

function secretKey(): Uint8Array {
  return encoder.encode(getEnv().AUTH_SECRET);
}

export async function signAccessToken(claims: AccessTokenClaims, expiresInSeconds: number): Promise<string> {
  return new SignJWT({
    email: claims.email,
    displayName: claims.displayName,
    permissions: claims.permissions,
    sessionId: claims.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(secretKey());
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const result = await jwtVerify(token, secretKey());
    const permissions = Array.isArray(result.payload.permissions) ? result.payload.permissions.map(String) : [];

    return {
      sub: result.payload.sub ?? '',
      email: String(result.payload.email ?? ''),
      displayName: String(result.payload.displayName ?? ''),
      permissions,
      sessionId: String(result.payload.sessionId ?? ''),
    };
  } catch {
    return null;
  }
}
