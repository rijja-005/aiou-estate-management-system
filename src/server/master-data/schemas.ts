import { z } from 'zod';

export const buildingSchema = z.object({
  code: z.string().trim().min(2).max(30),
  name: z.string().trim().min(2).max(120),
  notes: z.string().trim().max(1000).optional(),
  isEnabled: z.boolean().optional().default(true),
});

export const floorSchema = z.object({
  buildingId: z.string().uuid(),
  code: z.string().trim().min(1).max(20),
  name: z.string().trim().min(1).max(120),
  sortOrder: z.number().int().min(0).max(1000).optional().default(0),
  notes: z.string().trim().max(1000).optional(),
  isEnabled: z.boolean().optional().default(true),
});

export const departmentSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(150),
  notes: z.string().trim().max(1000).optional(),
  isEnabled: z.boolean().optional().default(true),
});

export const propertyTypeSchema = z.object({
  code: z.string().trim().min(2).max(40),
  name: z.string().trim().min(2).max(150),
  category: z.string().trim().min(2).max(60),
  notes: z.string().trim().max(1000).optional(),
  isEnabled: z.boolean().optional().default(true),
});

export const roomTypeSchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(100),
  notes: z.string().trim().max(1000).optional(),
  isEnabled: z.boolean().optional().default(true),
});

export const facilitySchema = z.object({
  code: z.string().trim().min(1).max(40),
  name: z.string().trim().min(1).max(120),
  notes: z.string().trim().max(1000).optional(),
  isEnabled: z.boolean().optional().default(true),
});

export type BuildingInput = z.infer<typeof buildingSchema>;
export type FloorInput = z.infer<typeof floorSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
export type PropertyTypeInput = z.infer<typeof propertyTypeSchema>;
export type RoomTypeInput = z.infer<typeof roomTypeSchema>;
export type FacilityInput = z.infer<typeof facilitySchema>;

export const masterDataUpdateSchemas = {
  buildings: buildingSchema.partial(),
  floors: floorSchema.partial(),
  departments: departmentSchema.partial(),
  'property-types': propertyTypeSchema.partial(),
  'room-types': roomTypeSchema.partial(),
  facilities: facilitySchema.partial(),
} as const;

export type MasterDataResource = keyof typeof masterDataUpdateSchemas;
