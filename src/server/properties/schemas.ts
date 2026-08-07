import { z } from 'zod';

export const propertyCreateSchema = z.object({
  propertyCode: z.string().trim().min(2).max(50),
  displayName: z.string().trim().min(2).max(150),
  buildingId: z.string().uuid(),
  floorId: z.string().uuid(),
  propertyTypeId: z.string().uuid(),
  roomTypeId: z.string().uuid().optional(),
  capacity: z.number().int().min(0).max(10000).optional(),
  isPaid: z.boolean().default(false),
  operationalStatus: z.enum(['ACTIVE', 'MAINTENANCE', 'INACTIVE', 'ARCHIVED']),
  availabilityStatus: z.enum(['AVAILABLE', 'BLOCKED', 'RESERVED']),
  occupancyStatus: z.enum(['VACANT', 'OCCUPIED', 'PARTIAL']),
  notes: z.string().trim().max(1000).optional(),
  description: z.string().trim().max(2000).optional(),
  facilityIds: z.array(z.string().uuid()).default([]),
});

export type PropertyCreateInput = z.infer<typeof propertyCreateSchema>;

export const propertyUpdateSchema = propertyCreateSchema.partial().refine((value) => Object.keys(value).length > 0, {
  message: 'At least one property field is required',
});

export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
