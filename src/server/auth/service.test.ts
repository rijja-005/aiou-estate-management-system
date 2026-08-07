import { describe, expect, it } from 'vitest';
import { loginSchema, passwordResetConfirmSchema, passwordResetRequestSchema } from './schemas';

describe('login schema', () => {
  it('accepts valid login input', () => {
    const parsed = loginSchema.parse({
      email: 'admin@aiou.edu.pk',
      password: 'Str0ng!Passw0rd',
    });

    expect(parsed.email).toBe('admin@aiou.edu.pk');
  });

  it('rejects invalid login input', () => {
    expect(() => loginSchema.parse({ email: 'invalid', password: 'short' })).toThrow();
  });
});

describe('password reset schemas', () => {
  it('accepts a valid request and strong replacement password', () => {
    expect(passwordResetRequestSchema.parse({ email: 'ADMIN@AIOU.EDU.PK' }).email).toBe('admin@aiou.edu.pk');
    const parsed = passwordResetConfirmSchema.parse({ token: 'a'.repeat(64), password: 'NewSecurePass123' });
    expect(parsed.token).toHaveLength(64);
  });

  it('rejects weak passwords and malformed reset tokens', () => {
    expect(() => passwordResetConfirmSchema.parse({ token: 'short', password: 'weakpassword' })).toThrow();
  });
});
