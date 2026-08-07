import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAMES } from '../../../../../server/auth/constants';
import { getUserFromAccessToken, revokeSession } from '../../../../../server/auth/service';
import { validateCsrf } from '../../../../../server/auth/csrf';
import { writeAuditLog } from '../../../../../server/audit/service';

export async function POST(request: Request): Promise<NextResponse> {
  if (!(await validateCsrf(request))) {
    return NextResponse.json({ success: false, error: { code: 'CSRF_INVALID', message: 'Invalid CSRF token' } }, { status: 403 });
  }

  const accessToken = (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value;
  const user = await getUserFromAccessToken(accessToken);
  if (user) {
    await revokeSession(user.sessionId);
    await writeAuditLog({ actorUserId: user.id, action: 'AUTH_LOGOUT', entityType: 'Session', entityId: user.sessionId, ipAddress: request.headers.get('x-forwarded-for') ?? undefined, userAgent: request.headers.get('user-agent') ?? undefined }).catch(() => undefined);
  }

  const response = NextResponse.json({ success: true, data: { loggedOut: true } });
  response.cookies.set(AUTH_COOKIE_NAMES.accessToken, '', { path: '/', maxAge: 0 });
  response.cookies.set(AUTH_COOKIE_NAMES.refreshToken, '', { path: '/', maxAge: 0 });
  response.cookies.set(AUTH_COOKIE_NAMES.csrfToken, '', { path: '/', maxAge: 0 });
  return response;
}
