import { timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from './constants';
import { hashSecret } from './crypto';
import { getUserFromAccessToken } from './service';
import { prisma } from '../db/prisma';

function secretsMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function validateCsrf(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const headerToken = request.headers.get('x-csrf-token');
  const cookieToken = cookieStore.get(AUTH_COOKIE_NAMES.csrfToken)?.value;
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  if (!headerToken || !cookieToken || !accessToken || !secretsMatch(headerToken, cookieToken)) return false;

  const user = await getUserFromAccessToken(accessToken);
  if (!user) return false;
  const session = await prisma.session.findUnique({ where: { id: user.sessionId }, select: { csrfTokenHash: true } });
  return Boolean(session && secretsMatch(session.csrfTokenHash, hashSecret(headerToken)));
}
