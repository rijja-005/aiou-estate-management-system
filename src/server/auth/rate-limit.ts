import { hashSecret } from './crypto';
import { prisma } from '../db/prisma';

const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super('Too many authentication attempts');
  }
}

export async function checkLoginRateLimit(identifier: string): Promise<void> {
  const now = new Date();
  const identifierHash = hashSecret(identifier.trim().toLowerCase());
  const key = `login:${identifierHash}`;
  const record = await prisma.authRateLimit.findUnique({ where: { key } });
  if (record?.blockedUntil && record.blockedUntil > now) {
    throw new RateLimitError(Math.ceil((record.blockedUntil.getTime() - now.getTime()) / 1000));
  }
}

export async function recordFailedLogin(identifier: string): Promise<void> {
  const now = new Date();
  const identifierHash = hashSecret(identifier.trim().toLowerCase());
  const key = `login:${identifierHash}`;
  await prisma.$transaction(async (tx) => {
    const record = await tx.authRateLimit.findUnique({ where: { key } });
    const windowExpired = !record || now.getTime() - record.windowStartedAt.getTime() >= WINDOW_MS;
    const attemptCount = windowExpired ? 1 : record.attemptCount + 1;
    await tx.authRateLimit.upsert({
      where: { key },
      create: { key, action: 'login', identifierHash, windowStartedAt: now, attemptCount },
      update: {
        windowStartedAt: windowExpired ? now : record.windowStartedAt,
        attemptCount,
        blockedUntil: attemptCount >= MAX_ATTEMPTS ? new Date(now.getTime() + BLOCK_MS) : null,
      },
    });
  }, { isolationLevel: 'Serializable' });
}

export async function clearLoginRateLimit(identifier: string): Promise<void> {
  const identifierHash = hashSecret(identifier.trim().toLowerCase());
  await prisma.authRateLimit.deleteMany({ where: { key: `login:${identifierHash}` } });
}
