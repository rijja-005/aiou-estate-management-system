import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password helpers', () => {
  it('hashes and verifies a password', async () => {
    const passwordHash = await hashPassword('Str0ng!Passw0rd');

    expect(passwordHash).not.toBe('Str0ng!Passw0rd');
    await expect(verifyPassword('Str0ng!Passw0rd', passwordHash)).resolves.toBe(true);
    await expect(verifyPassword('wrong-password', passwordHash)).resolves.toBe(false);
  });
});
