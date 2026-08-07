import 'dotenv/config';
import { describe, expect, it } from 'vitest';
import { prisma } from '../db/prisma';
import { authenticateLogin, getUserFromAccessToken, revokeSession, rotateRefreshToken } from './service';

const runDatabaseTests = process.env.RUN_DATABASE_TESTS === 'true';

describe.skipIf(!runDatabaseTests)('authentication database integration', () => {
  it('creates, validates, rotates, and revokes a session', async () => {
    const email = process.env.SEED_SUPERADMIN_EMAIL;
    const password = process.env.SEED_SUPERADMIN_PASSWORD;
    if (!email || !password) throw new Error('Seed credentials are required for database integration tests');

    const login = await authenticateLogin({ email, password });
    expect((await getUserFromAccessToken(login.accessToken))?.id).toBe(login.user.id);

    const rotated = await rotateRefreshToken(login.refreshToken);
    expect(rotated.refreshToken).not.toBe(login.refreshToken);
    expect((await getUserFromAccessToken(rotated.accessToken))?.sessionId).toBe(login.user.sessionId);

    await revokeSession(login.user.sessionId, 'INTEGRATION_TEST');
    expect(await getUserFromAccessToken(rotated.accessToken)).toBeNull();
  });
});
