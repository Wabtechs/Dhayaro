import type { UserRole } from '@/types'

export type Permission =
  | 'users:list'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'facilities:list'
  | 'facilities:create'
  | 'facilities:edit'
  | 'facilities:delete'
  | 'patients:list'
  | 'patients:create'
  | 'patients:edit'
  | 'patients:delete'
  | 'clinical_cases:list'
  | 'clinical_cases:create'
  | 'clinical_cases:edit'
  | 'clinical_cases:delete'
  | 'analytics:read'
  | 'audit:read'
  | 'settings:read'
  | 'settings:edit'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'users:list', 'users:create', 'users:edit', 'users:delete',
    'facilities:list', 'facilities:create', 'facilities:edit', 'facilities:delete',
    'patients:list', 'patients:create', 'patients:edit', 'patients:delete',
    'clinical_cases:list', 'clinical_cases:create', 'clinical_cases:edit', 'clinical_cases:delete',
    'analytics:read', 'audit:read', 'settings:read', 'settings:edit',
  ],
  doctor: [
    'facilities:list',
    'patients:list', 'patients:create', 'patients:edit',
    'clinical_cases:list', 'clinical_cases:create', 'clinical_cases:edit',
    'analytics:read',
    'settings:read',
  ],
  nurse: [
    'facilities:list',
    'patients:list', 'patients:create', 'patients:edit',
    'clinical_cases:list',
    'settings:read',
  ],
  researcher: [
    'facilities:list',
    'patients:list',
    'clinical_cases:list',
    'analytics:read',
    'settings:read',
  ],
  viewer: [
    'facilities:list',
    'patients:list',
    'clinical_cases:list',
    'settings:read',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  doctor: 'Médecin',
  nurse: 'Infirmier(ère)',
  researcher: 'Chercheur',
  viewer: 'Observateur',
}

export const ROLE_LABELS_UPPER: Record<string, string> = {
  ADMIN: 'Administrateur',
  DOCTOR: 'Médecin',
  NURSE: 'Infirmier(ère)',
  RESEARCHER: 'Chercheur',
  VIEWER: 'Observateur',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 100,
  doctor: 60,
  nurse: 40,
  researcher: 30,
  viewer: 10,
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}
