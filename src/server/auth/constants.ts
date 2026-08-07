export const AUTH_COOKIE_NAMES = {
  accessToken: 'ems_access_token',
  refreshToken: 'ems_refresh_token',
  csrfToken: 'ems_csrf_token',
} as const;

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60;
