export type PermissionCode =
  | 'system.read'
  | 'system.manage'
  | 'booking.read'
  | 'booking.create'
  | 'booking.approve'
  | 'booking.reject'
  | 'property.read'
  | 'property.manage'
  | 'allocation.read'
  | 'allocation.create'
  | 'allocation.approve'
  | 'allocation.manage'
  | 'shop.read'
  | 'shop.manage'
  | 'finance.read'
  | 'finance.manage'
  | 'payment.reverse'
  | 'flat.read'
  | 'flat.manage'
  | 'flat.approve'
  | 'report.read'
  | 'report.manage'
  | 'search.read';

export const PERMISSIONS: ReadonlyArray<PermissionCode> = [
  'system.read',
  'system.manage',
  'booking.read',
  'booking.create',
  'booking.approve',
  'booking.reject',
  'property.read',
  'property.manage',
  'allocation.read',
  'allocation.create',
  'allocation.approve',
  'allocation.manage',
  'shop.read',
  'shop.manage',
  'finance.read',
  'finance.manage',
  'payment.reverse',
  'flat.read',
  'flat.manage',
  'flat.approve',
  'report.read',
  'report.manage',
  'search.read',
];
