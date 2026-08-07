import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAMES } from '../../../../../server/auth/constants';
import { accessTokenCookie, csrfTokenCookie, refreshTokenCookie } from '../../../../../server/auth/cookies';
import { rotateRefreshToken } from '../../../../../server/auth/service';

export async function POST(): Promise<NextResponse> {
  const refreshToken = (await cookies()).get(AUTH_COOKIE_NAMES.refreshToken)?.value;

  if (!refreshToken) {
    return NextResponse.json({ success: false, error: { code: 'AUTH_SESSION_MISSING', message: 'No active session' } }, { status: 401 });
  }

  try {
    const result = await rotateRefreshToken(refreshToken);
    const response = NextResponse.json({ success: true, data: { user: result.user } });
    response.cookies.set(accessTokenCookie(result.accessToken));
    response.cookies.set(refreshTokenCookie(result.refreshToken));
    response.cookies.set(csrfTokenCookie(result.csrfToken));
    return response;
  } catch {
    const response = NextResponse.json({ success: false, error: { code: 'AUTH_REFRESH_INVALID', message: 'Session expired. Please sign in again.' } }, { status: 401 });
    response.cookies.set(AUTH_COOKIE_NAMES.accessToken, '', { path: '/', maxAge: 0 });
    response.cookies.set(AUTH_COOKIE_NAMES.refreshToken, '', { path: '/', maxAge: 0 });
    response.cookies.set(AUTH_COOKIE_NAMES.csrfToken, '', { path: '/', maxAge: 0 });
    return response;
  }
}
