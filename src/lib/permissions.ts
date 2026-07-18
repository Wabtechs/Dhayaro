import type { UserRole } from '@/types'

export type Permission =
  | 'users:list' | 'users:create' | 'users:edit' | 'users:delete'
  | 'facilities:list' | 'facilities:create' | 'facilities:edit' | 'facilities:delete'
  | 'patients:list' | 'patients:create' | 'patients:edit' | 'patients:delete' | 'patients:archive'
  | 'consultations:list' | 'consultations:create' | 'consultations:edit' | 'consultations:delete'
  | 'diagnostics:list' | 'diagnostics:create' | 'diagnostics:edit' | 'diagnostics:validate'
  | 'diseases:list' | 'diseases:create' | 'diseases:edit' | 'diseases:delete'
  | 'treatments:list' | 'treatments:create' | 'treatments:edit' | 'treatments:delete'
  | 'prescriptions:list' | 'prescriptions:create' | 'prescriptions:edit'
  | 'lab:list' | 'lab:create' | 'lab:edit' | 'lab:validate' | 'lab:delete'
  | 'queue:list' | 'queue:manage' | 'queue:assign'
  | 'documents:list' | 'documents:create' | 'documents:print' | 'documents:export'
  | 'archives:list' | 'archives:manage'
  | 'notifications:list' | 'notifications:manage'
  | 'reports:read' | 'reports:export'
  | 'analytics:read'
  | 'audit:read'
  | 'settings:read' | 'settings:edit'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users:list', 'users:create', 'users:edit', 'users:delete',
    'facilities:list', 'facilities:create', 'facilities:edit', 'facilities:delete',
    'patients:list', 'patients:create', 'patients:edit', 'patients:delete', 'patients:archive',
    'consultations:list', 'consultations:create', 'consultations:edit', 'consultations:delete',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit', 'diagnostics:validate',
    'diseases:list', 'diseases:create', 'diseases:edit', 'diseases:delete',
    'treatments:list', 'treatments:create', 'treatments:edit', 'treatments:delete',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create', 'lab:edit', 'lab:validate', 'lab:delete',
    'queue:list', 'queue:manage', 'queue:assign',
    'documents:list', 'documents:create', 'documents:print', 'documents:export',
    'archives:list', 'archives:manage',
    'notifications:list', 'notifications:manage',
    'reports:read', 'reports:export',
    'analytics:read', 'audit:read',
    'settings:read', 'settings:edit',
  ],
  admin: [
    'users:list', 'users:create', 'users:edit', 'users:delete',
    'facilities:list', 'facilities:create', 'facilities:edit', 'facilities:delete',
    'patients:list', 'patients:create', 'patients:edit', 'patients:delete', 'patients:archive',
    'consultations:list', 'consultations:create', 'consultations:edit', 'consultations:delete',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit', 'diagnostics:validate',
    'diseases:list', 'diseases:create', 'diseases:edit', 'diseases:delete',
    'treatments:list', 'treatments:create', 'treatments:edit', 'treatments:delete',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create', 'lab:edit', 'lab:validate', 'lab:delete',
    'queue:list', 'queue:manage', 'queue:assign',
    'documents:list', 'documents:create', 'documents:print', 'documents:export',
    'archives:list', 'archives:manage',
    'notifications:list', 'notifications:manage',
    'reports:read', 'reports:export',
    'analytics:read', 'audit:read',
    'settings:read', 'settings:edit',
  ],
  receptionist: [
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list', 'consultations:create',
    'queue:list', 'queue:manage',
    'documents:list', 'documents:create',
    'notifications:list',
    'settings:read',
  ],
  doctor: [
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list', 'consultations:create', 'consultations:edit',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit',
    'treatments:list', 'treatments:create', 'treatments:edit',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create',
    'queue:list', 'queue:assign',
    'documents:list', 'documents:create', 'documents:print',
    'archives:list',
    'notifications:list',
    'analytics:read',
    'settings:read',
  ],
  specialist: [
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list', 'consultations:create', 'consultations:edit',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit', 'diagnostics:validate',
    'treatments:list', 'treatments:create', 'treatments:edit',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create', 'lab:validate',
    'queue:list', 'queue:assign',
    'documents:list', 'documents:create', 'documents:print',
    'archives:list',
    'notifications:list',
    'analytics:read',
    'settings:read',
  ],
  laboratory: [
    'patients:list',
    'consultations:list',
    'lab:list', 'lab:create', 'lab:edit', 'lab:validate',
    'queue:list',
    'documents:list', 'documents:create',
    'notifications:list',
    'settings:read',
  ],
  pharmacist: [
    'patients:list',
    'treatments:list',
    'prescriptions:list', 'prescriptions:edit',
    'diseases:list',
    'lab:list',
    'queue:list',
    'documents:list',
    'notifications:list',
    'settings:read',
  ],
  nurse: [
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list', 'consultations:create',
    'treatments:list',
    'lab:list',
    'queue:list', 'queue:manage',
    'documents:list',
    'notifications:list',
    'settings:read',
  ],
  accountant: [
    'patients:list',
    'consultations:list',
    'lab:list',
    'reports:read', 'reports:export',
    'analytics:read',
    'notifications:list',
    'settings:read',
  ],
  archivist: [
    'patients:list',
    'archives:list', 'archives:manage',
    'documents:list', 'documents:export',
    'consultations:list',
    'diagnostics:list',
    'treatments:list',
    'lab:list',
    'notifications:list',
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
  super_admin: 'Super Administrateur',
  admin: 'Administrateur',
  receptionist: 'Réceptionniste',
  doctor: 'Médecin Généraliste',
  specialist: 'Médecin Spécialiste',
  laboratory: 'Laborantin',
  pharmacist: 'Pharmacien',
  nurse: 'Infirmier(ère)',
  accountant: 'Comptable',
  archivist: 'Archiviste',
}

export const ROLE_LABELS_UPPER: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrateur',
  ADMIN: 'Administrateur',
  RECEPTIONIST: 'Réceptionniste',
  DOCTOR: 'Médecin Généraliste',
  SPECIALIST: 'Médecin Spécialiste',
  LABORATORY: 'Laborantin',
  PHARMACIST: 'Pharmacien',
  NURSE: 'Infirmier(ère)',
  ACCOUNTANT: 'Comptable',
  ARCHIVIST: 'Archiviste',
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  admin: 80,
  specialist: 70,
  doctor: 60,
  pharmacist: 50,
  laboratory: 50,
  nurse: 40,
  accountant: 35,
  archivist: 30,
  receptionist: 25,
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}
