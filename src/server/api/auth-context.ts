import { cookies, headers } from 'next/headers';
import { AUTH_COOKIE_NAMES } from '../auth/constants';
import { getUserFromAccessToken, type AuthenticatedUser } from '../auth/service';
import { assertPermission, type PermissionCode } from '../auth/authorization';

export type RequestContext = {
  user: AuthenticatedUser;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export async function requireRequestContext(permission: PermissionCode): Promise<RequestContext> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const user = await getUserFromAccessToken(accessToken);

  if (!user) {
    throw new Error('AUTH_UNAUTHORIZED');
  }

  assertPermission(user.permissions, permission);

  const headerStore = await headers();
  return {
    user,
    requestId: headerStore.get('x-request-id') ?? undefined,
    ipAddress: headerStore.get('x-forwarded-for') ?? undefined,
    userAgent: headerStore.get('user-agent') ?? undefined,
  };
}
