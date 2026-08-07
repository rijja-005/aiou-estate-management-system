import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { validateCsrf } from '../../../../../server/auth/csrf';
import { AUTH_COOKIE_NAMES } from '../../../../../server/auth/constants';
import { getUserFromAccessToken, revokeAllUserSessions } from '../../../../../server/auth/service';
import { writeAuditLog } from '../../../../../server/audit/service';

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ success: false, error: { code: 'CSRF_INVALID', message: 'Invalid CSRF token' } }, { status: 403 });
  }
  const accessToken = (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const user = await getUserFromAccessToken(accessToken);
  if (!user) {
    return NextResponse.json({ success: false, error: { code: 'AUTH_UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
  }
  await revokeAllUserSessions(user.id);
  await writeAuditLog({ actorUserId: user.id, action: 'AUTH_LOGOUT_ALL', entityType: 'User', entityId: user.id, ipAddress: request.headers.get('x-forwarded-for') ?? undefined, userAgent: request.headers.get('user-agent') ?? undefined }).catch(() => undefined);
  const response = NextResponse.json({ success: true, data: { loggedOutAllDevices: true } });
  response.cookies.set(AUTH_COOKIE_NAMES.accessToken, '', { path: '/', maxAge: 0 });
  response.cookies.set(AUTH_COOKIE_NAMES.refreshToken, '', { path: '/', maxAge: 0 });
  response.cookies.set(AUTH_COOKIE_NAMES.csrfToken, '', { path: '/', maxAge: 0 });
  return response;
}
