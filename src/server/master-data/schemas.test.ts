import { describe, expect, it } from 'vitest';
import {
  buildingSchema,
  floorSchema,
  departmentSchema,
  propertyTypeSchema,
  roomTypeSchema,
  facilitySchema,
} from './schemas';

describe('master-data schemas', () => {
  it('validates building payload', () => {
    const parsed = buildingSchema.parse({ code: 'BLK-A', name: 'Block A' });
    expect(parsed.code).toBe('BLK-A');
  });

  it('rejects invalid floor payload', () => {
    expect(() => floorSchema.parse({ buildingId: 'bad', code: '1', name: 'First Floor' })).toThrow();
  });

  it('validates department and property-type payloads', () => {
    expect(
      departmentSchema.parse({
        code: 'ESTATE',
        name: 'Estate Office',
      }).name,
    ).toBe('Estate Office');

    expect(
      propertyTypeSchema.parse({
        code: 'CLASSROOM',
        name: 'Classroom',
        category: 'Academic',
      }).category,
    ).toBe('Academic');
  });

  it('validates room type and facility payloads', () => {
    expect(roomTypeSchema.parse({ code: 'TYPE-A', name: 'Type A' }).code).toBe('TYPE-A');
    expect(facilitySchema.parse({ code: 'PROJECTOR', name: 'Projector' }).name).toBe('Projector');
  });
});
