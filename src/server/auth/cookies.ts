import { AUTH_COOKIE_NAMES, ACCESS_TOKEN_TTL_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from './constants';

const sharedCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export function accessTokenCookie(value: string) {
  return {
    name: AUTH_COOKIE_NAMES.accessToken,
    value,
    options: {
      ...sharedCookieOptions,
      maxAge: ACCESS_TOKEN_TTL_SECONDS,
    },
  };
}

export function refreshTokenCookie(value: string) {
  return {
    name: AUTH_COOKIE_NAMES.refreshToken,
    value,
    options: {
      ...sharedCookieOptions,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    },
  };
}

export function csrfTokenCookie(value: string) {
  return {
    name: AUTH_COOKIE_NAMES.csrfToken,
    value,
    options: {
      ...sharedCookieOptions,
      httpOnly: false,
      sameSite: 'strict' as const,
      maxAge: REFRESH_TOKEN_TTL_SECONDS,
    },
  };
}
