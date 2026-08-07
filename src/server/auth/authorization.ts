import { PERMISSIONS, type PermissionCode } from './permissions';
export type { PermissionCode } from './permissions';

export class AuthorizationError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export function hasPermission(permissions: ReadonlyArray<string>, permission: PermissionCode): boolean {
  return permissions.includes(permission);
}

export function assertPermission(permissions: ReadonlyArray<string>, permission: PermissionCode): void {
  if (!PERMISSIONS.includes(permission)) {
    throw new AuthorizationError('Unknown permission');
  }

  if (!hasPermission(permissions, permission)) {
    throw new AuthorizationError();
  }
}
