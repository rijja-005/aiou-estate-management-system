import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAMES } from './constants';
import { getUserFromAccessToken } from './service';

export type AuthSession = {
  sessionId: string;
  userId: string;
  email: string;
  permissions: string[];
};

export async function getCurrentSession(): Promise<AuthSession | null> {
  const token = (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const user = await getUserFromAccessToken(token);
  if (!user) return null;
  return { sessionId: user.sessionId, userId: user.id, email: user.email, permissions: user.permissions };
}
