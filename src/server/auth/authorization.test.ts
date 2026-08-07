import { describe, expect, it } from 'vitest';
import { assertPermission, hasPermission, AuthorizationError } from './authorization';

describe('authorization helpers', () => {
  it('checks permissions', () => {
    expect(hasPermission(['booking.read', 'property.read'], 'booking.read')).toBe(true);
    expect(hasPermission(['booking.read'], 'booking.approve')).toBe(false);
  });

  it('throws on missing permissions', () => {
    expect(() => assertPermission(['booking.read'], 'booking.approve')).toThrow(AuthorizationError);
  });
});
