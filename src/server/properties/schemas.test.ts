import { describe, expect, it } from 'vitest';
import { propertyCreateSchema } from './schemas';

describe('propertyCreateSchema', () => {
  it('accepts valid payload', () => {
    const parsed = propertyCreateSchema.parse({
      propertyCode: 'RM-101',
      displayName: 'Room 101',
      buildingId: '11111111-1111-4111-8111-111111111111',
      floorId: '22222222-2222-4222-8222-222222222222',
      propertyTypeId: '33333333-3333-4333-8333-333333333333',
      operationalStatus: 'ACTIVE',
      availabilityStatus: 'AVAILABLE',
      occupancyStatus: 'VACANT',
      facilityIds: [],
    });

    expect(parsed.propertyCode).toBe('RM-101');
  });

  it('rejects invalid status payload', () => {
    expect(() =>
      propertyCreateSchema.parse({
        propertyCode: 'RM-101',
        displayName: 'Room 101',
        buildingId: '11111111-1111-4111-8111-111111111111',
        floorId: '22222222-2222-4222-8222-222222222222',
        propertyTypeId: '33333333-3333-4333-8333-333333333333',
        operationalStatus: 'BROKEN',
        availabilityStatus: 'AVAILABLE',
        occupancyStatus: 'VACANT',
        facilityIds: [],
      }),
    ).toThrow();
  });
});
