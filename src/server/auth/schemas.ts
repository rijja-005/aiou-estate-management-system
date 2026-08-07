import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const passwordResetRequestSchema = z.object({ email: z.string().trim().toLowerCase().email() });
export const passwordResetConfirmSchema = z.object({
  token: z.string().length(64),
  password: z.string().min(12).max(128)
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
});
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
