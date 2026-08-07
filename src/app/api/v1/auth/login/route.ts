import { NextResponse } from 'next/server';
import { authenticateLogin } from '../../../../../server/auth/service';
import { accessTokenCookie, refreshTokenCookie, csrfTokenCookie } from '../../../../../server/auth/cookies';
import { loginSchema } from '../../../../../server/auth/schemas';
import { checkLoginRateLimit, clearLoginRateLimit, RateLimitError, recordFailedLogin } from '../../../../../server/auth/rate-limit';
import { hashSecret } from '../../../../../server/auth/crypto';
import { writeAuditLog } from '../../../../../server/audit/service';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid login request' } }, { status: 400 });
  }

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rateLimitIdentifier = `${forwardedFor}:${parsed.data.email}`;

  try {
    await checkLoginRateLimit(rateLimitIdentifier);
    const result = await authenticateLogin(parsed.data);
    await clearLoginRateLimit(rateLimitIdentifier);
    await writeAuditLog({
      actorUserId: result.user.id,
      action: 'AUTH_LOGIN_SUCCEEDED',
      entityType: 'Session',
      entityId: result.user.sessionId,
      ipAddress: forwardedFor,
      userAgent: request.headers.get('user-agent') ?? undefined,
    }).catch(() => undefined);
    const response = NextResponse.json({
      success: true,
      data: {
        user: result.user,
      },
    });

    response.cookies.set(accessTokenCookie(result.accessToken));
    response.cookies.set(refreshTokenCookie(result.refreshToken));
    response.cookies.set(csrfTokenCookie(result.csrfToken));
    return response;
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' } },
        { status: 429, headers: { 'Retry-After': String(error.retryAfterSeconds) } },
      );
    }
    await recordFailedLogin(rateLimitIdentifier);
    await writeAuditLog({
      action: 'AUTH_LOGIN_FAILED',
      entityType: 'LoginAttempt',
      entityId: hashSecret(parsed.data.email),
      ipAddress: forwardedFor,
      userAgent: request.headers.get('user-agent') ?? undefined,
    }).catch(() => undefined);
    return NextResponse.json({ success: false, error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'Invalid email or password' } }, { status: 401 });
  }
}
