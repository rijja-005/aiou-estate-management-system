import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_NAME: z.string().default('AIOU Estate Management System'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  PASSWORD_RESET_DELIVERY_URL: z.string().url().optional(),
  PASSWORD_RESET_DELIVERY_TOKEN: z.string().min(16).optional(),
  BOOKING_BLOCK_PENDING_OVERLAPS: z.enum(['true', 'false']).default('true').transform((value) => value === 'true'),
  CRON_SECRET: z.string().min(32).optional(),
  SENTRY_DSN: z.string().url().optional(),
  OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(overrides: NodeJS.ProcessEnv = process.env): AppEnv {
  return envSchema.parse({
    NODE_ENV: overrides.NODE_ENV,
    DATABASE_URL: overrides.DATABASE_URL,
    DIRECT_DATABASE_URL: overrides.DIRECT_DATABASE_URL,
    AUTH_SECRET: overrides.AUTH_SECRET,
    NEXT_PUBLIC_APP_NAME: overrides.NEXT_PUBLIC_APP_NAME,
    APP_URL: overrides.APP_URL,
    PASSWORD_RESET_DELIVERY_URL: overrides.PASSWORD_RESET_DELIVERY_URL,
    PASSWORD_RESET_DELIVERY_TOKEN: overrides.PASSWORD_RESET_DELIVERY_TOKEN,
    BOOKING_BLOCK_PENDING_OVERLAPS: overrides.BOOKING_BLOCK_PENDING_OVERLAPS,
    CRON_SECRET: overrides.CRON_SECRET,
    SENTRY_DSN: overrides.SENTRY_DSN,
    OBJECT_STORAGE_ENDPOINT: overrides.OBJECT_STORAGE_ENDPOINT,
    OBJECT_STORAGE_BUCKET: overrides.OBJECT_STORAGE_BUCKET,
  });
}

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  cachedEnv ??= loadEnv();
  return cachedEnv;
}
