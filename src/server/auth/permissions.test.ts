import { describe, expect, it } from 'vitest';
import { PERMISSIONS } from './permissions';

describe('permissions catalog', () => {
  it('contains the core estate permissions', () => {
    expect(PERMISSIONS).toContain('booking.approve');
    expect(PERMISSIONS).toContain('property.manage');
    expect(PERMISSIONS).toContain('system.manage');
    expect(PERMISSIONS).toContain('report.read');
    expect(PERMISSIONS).toContain('search.read');
  });
});
