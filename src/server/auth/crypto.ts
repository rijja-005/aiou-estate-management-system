import { createHash, randomBytes } from 'crypto';

export function createOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function hashSecret(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
