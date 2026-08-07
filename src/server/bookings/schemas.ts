import { z } from 'zod';

export const bookingCreateSchema = z.object({
  resourceIds: z.array(z.string().uuid()).min(1).max(10),
  requestingDepartmentId: z.string().uuid().optional(),
  requesterName: z.string().trim().min(2).max(150),
  requesterEmail: z.string().trim().toLowerCase().email().optional(),
  requesterPhone: z.string().trim().max(30).optional(),
  purpose: z.string().trim().min(3).max(300),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  attendeeCount: z.number().int().min(0).max(100000).default(0),
  isPaid: z.boolean().default(false),
  chargeAmount: z.number().min(0).max(999999999).optional(),
  notes: z.string().trim().max(2000).optional(),
  submit: z.boolean().default(false),
  idempotencyKey: z.string().trim().min(8).max(100).optional(),
}).refine((value) => value.endAt > value.startAt, { path: ['endAt'], message: 'End time must be after start time' })
  .refine((value) => value.endAt.getTime() - value.startAt.getTime() <= 24 * 60 * 60 * 1000, { path: ['endAt'], message: 'Booking duration cannot exceed 24 hours' });

export const bookingDecisionSchema = z.object({ remarks: z.string().trim().min(2).max(1000).optional() });
export const bookingRejectionSchema = z.object({ reason: z.string().trim().min(3).max(1000) });
export const bookingCancellationSchema = z.object({ reason: z.string().trim().min(3).max(1000) });
export type BookingCreateInput = z.infer<typeof bookingCreateSchema>;
