import { describe, expect, it } from 'vitest';
import { bookingCreateSchema } from './schemas';
describe('booking request validation', () => {
  const valid = { resourceIds: ['11111111-1111-4111-8111-111111111111'], requesterName: 'Estate Staff', purpose: 'Workshop session', startAt: '2026-09-01T09:00:00.000Z', endAt: '2026-09-01T12:00:00.000Z', attendeeCount: 25, isPaid: false, submit: true };
  it('accepts a valid three-hour booking', () => expect(bookingCreateSchema.parse(valid).resourceIds).toHaveLength(1));
  it('rejects reversed and excessive time ranges', () => { expect(() => bookingCreateSchema.parse({ ...valid, endAt: '2026-09-01T08:00:00.000Z' })).toThrow(); expect(() => bookingCreateSchema.parse({ ...valid, endAt: '2026-09-03T09:00:00.000Z' })).toThrow(); });
  it('requires at least one resource', () => expect(() => bookingCreateSchema.parse({ ...valid, resourceIds: [] })).toThrow());
});
