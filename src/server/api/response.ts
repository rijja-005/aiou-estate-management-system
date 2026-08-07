export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: ApiError;
};

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiSuccess<T> {
  return {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
}

export function errorResponse(code: string, message: string, details?: unknown): ApiFailure {
  return {
    success: false,
    error: { code, message, ...(details !== undefined ? { details } : {}) },
  };
}
