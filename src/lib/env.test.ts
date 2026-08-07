import { describe, expect, it } from 'vitest';
import { loadEnv } from './env';

describe('loadEnv', () => {
  it('parses the required environment variables', () => {
    const env = loadEnv({
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/estate',
      AUTH_SECRET: '0123456789abcdef0123456789abcdef',
      NEXT_PUBLIC_APP_NAME: 'AIOU Estate Management System',
    });

    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/estate');
    expect(env.AUTH_SECRET).toHaveLength(32);
  });

  it('rejects invalid database urls', () => {
    expect(() =>
      loadEnv({
        DATABASE_URL: 'not-a-url',
        AUTH_SECRET: '0123456789abcdef0123456789abcdef',
      }),
    ).toThrow();
  });
});
