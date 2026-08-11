import type { UserRole } from '@/types'

export type Permission =
  | 'DASHBOARD_VIEW'
  | 'users:list' | 'users:create' | 'users:edit' | 'users:delete'
  | 'facilities:list' | 'facilities:create' | 'facilities:edit' | 'facilities:delete'
  | 'patients:list' | 'patients:create' | 'patients:edit' | 'patients:delete' | 'patients:archive'
  | 'consultations:list' | 'consultations:create' | 'consultations:edit' | 'consultations:delete'
  | 'clinical-cases:list' | 'clinical-cases:create' | 'clinical-cases:edit' | 'clinical-cases:delete'
  | 'diagnostics:list' | 'diagnostics:create' | 'diagnostics:edit' | 'diagnostics:validate'
  | 'diseases:list' | 'diseases:create' | 'diseases:edit' | 'diseases:delete'
  | 'treatments:list' | 'treatments:create' | 'treatments:edit' | 'treatments:delete'
  | 'prescriptions:list' | 'prescriptions:create' | 'prescriptions:edit'
  | 'lab:list' | 'lab:create' | 'lab:edit' | 'lab:validate' | 'lab:delete'
  | 'queue:list' | 'queue:manage' | 'queue:assign'
  | 'documents:list' | 'documents:create' | 'documents:edit' | 'documents:delete' | 'documents:print' | 'documents:export'
  | 'archives:list' | 'archives:manage'
  | 'notifications:list' | 'notifications:manage'
  | 'reports:read' | 'reports:export'
  | 'analytics:read'
  | 'audit:read'
  | 'settings:read' | 'settings:edit'
  | 'episodes:list' | 'episodes:create' | 'episodes:edit' | 'episodes:archive'
  | 'protocols:list' | 'protocols:create' | 'protocols:edit' | 'protocols:delete'
  | 'knowledge-base:list' | 'knowledge-base:search'
  | 'clinical-decision:read'
  | 'triage:list' | 'triage:manage'
  | 'pharmacy:list' | 'pharmacy:dispense'
  | 'equipment:view' | 'equipment:create' | 'equipment:update' | 'equipment:delete'
  | 'equipment:assign' | 'equipment:transfer' | 'equipment:maintenance' | 'equipment:audit' | 'equipment:report'
  | 'supplies:view' | 'supplies:manage'
  | 'stock:view' | 'stock:manage'
  | 'care-coverages:list' | 'care-coverages:create' | 'care-coverages:edit' | 'care-coverages:delete'
  | 'partner-companies:list' | 'partner-companies:create' | 'partner-companies:edit' | 'partner-companies:delete'
  | 'partner-patients:list' | 'partner-patients:create' | 'partner-patients:edit' | 'partner-patients:delete'
  | 'patient-history:list' | 'patient-history:create' | 'patient-history:edit' | 'patient-history:delete'
  | 'billing:list' | 'billing:create' | 'billing:edit' | 'billing:delete' | 'billing:pay'
  | 'notification-preferences:list' | 'notification-preferences:manage'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'DASHBOARD_VIEW',
    'users:list', 'users:create', 'users:edit', 'users:delete',
    'facilities:list', 'facilities:create', 'facilities:edit', 'facilities:delete',
    'patients:list', 'patients:create', 'patients:edit', 'patients:delete', 'patients:archive',
    'consultations:list', 'consultations:create', 'consultations:edit', 'consultations:delete',
    'clinical-cases:list', 'clinical-cases:create', 'clinical-cases:edit', 'clinical-cases:delete',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit', 'diagnostics:validate',
    'diseases:list', 'diseases:create', 'diseases:edit', 'diseases:delete',
    'treatments:list', 'treatments:create', 'treatments:edit', 'treatments:delete',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create', 'lab:edit', 'lab:validate', 'lab:delete',
    'queue:list', 'queue:manage', 'queue:assign',
    'documents:list', 'documents:create', 'documents:edit', 'documents:delete', 'documents:print', 'documents:export',
    'archives:list', 'archives:manage',
    'notifications:list', 'notifications:manage',
    'reports:read', 'reports:export',
    'analytics:read', 'audit:read',
    'settings:read', 'settings:edit',
    'episodes:list', 'episodes:create', 'episodes:edit', 'episodes:archive',
    'protocols:list', 'protocols:create', 'protocols:edit', 'protocols:delete',
    'knowledge-base:list', 'knowledge-base:search',
    'clinical-decision:read',
    'triage:list', 'triage:manage',
    'pharmacy:list', 'pharmacy:dispense',
    'equipment:view', 'equipment:create', 'equipment:update', 'equipment:delete',
    'equipment:assign', 'equipment:transfer', 'equipment:maintenance', 'equipment:audit', 'equipment:report',
    'supplies:view', 'supplies:manage',
    'stock:view', 'stock:manage',
    'billing:list', 'billing:create', 'billing:edit', 'billing:delete', 'billing:pay',
    'supplies:view', 'supplies:manage',
  ],
  admin: [
    'DASHBOARD_VIEW',
    'users:list', 'users:create', 'users:edit', 'users:delete',
    'facilities:list', 'facilities:create', 'facilities:edit', 'facilities:delete',
    'patients:list', 'patients:create', 'patients:edit', 'patients:delete', 'patients:archive',
    'consultations:list', 'consultations:create', 'consultations:edit', 'consultations:delete',
    'clinical-cases:list', 'clinical-cases:create', 'clinical-cases:edit', 'clinical-cases:delete',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit', 'diagnostics:validate',
    'diseases:list', 'diseases:create', 'diseases:edit', 'diseases:delete',
    'treatments:list', 'treatments:create', 'treatments:edit', 'treatments:delete',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create', 'lab:edit', 'lab:validate', 'lab:delete',
    'queue:list', 'queue:manage', 'queue:assign',
    'documents:list', 'documents:create', 'documents:edit', 'documents:delete', 'documents:print', 'documents:export',
    'archives:list', 'archives:manage',
    'notifications:list', 'notifications:manage',
    'reports:read', 'reports:export',
    'analytics:read', 'audit:read',
    'settings:read', 'settings:edit',
    'episodes:list', 'episodes:create', 'episodes:edit', 'episodes:archive',
    'protocols:list', 'protocols:create', 'protocols:edit', 'protocols:delete',
    'knowledge-base:list', 'knowledge-base:search',
    'clinical-decision:read',
    'triage:list', 'triage:manage',
    'billing:list', 'billing:create', 'billing:edit', 'billing:delete', 'billing:pay',
  ],
  receptionist: [
    'DASHBOARD_VIEW',
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list',
    'clinical-cases:list',
    'queue:list', 'queue:manage',
    'documents:list', 'documents:create',
    'notifications:list',
    'settings:read',
    'episodes:list', 'episodes:create', 'episodes:edit',
    'equipment:view',
    'supplies:view', 'stock:view',
  ],
  doctor: [
    'DASHBOARD_VIEW',
    'triage:list', 'triage:manage',
    'pharmacy:list',
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list', 'consultations:create', 'consultations:edit',
    'clinical-cases:list', 'clinical-cases:create', 'clinical-cases:edit',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit',
    'treatments:list', 'treatments:create', 'treatments:edit',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create',
    'queue:list', 'queue:assign',
    'documents:list', 'documents:create', 'documents:edit', 'documents:print',
    'archives:list',
    'notifications:list',
    'analytics:read',
    'settings:read',
    'episodes:list', 'episodes:create', 'episodes:edit', 'episodes:archive',
    'protocols:list', 'protocols:create', 'protocols:edit',
    'knowledge-base:list', 'knowledge-base:search',
    'clinical-decision:read',
    'equipment:view', 'supplies:view',
  ],
  specialist: [
    'DASHBOARD_VIEW',
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list', 'consultations:create', 'consultations:edit',
    'clinical-cases:list', 'clinical-cases:create', 'clinical-cases:edit',
    'diagnostics:list', 'diagnostics:create', 'diagnostics:edit', 'diagnostics:validate',
    'treatments:list', 'treatments:create', 'treatments:edit',
    'prescriptions:list', 'prescriptions:create', 'prescriptions:edit',
    'lab:list', 'lab:create', 'lab:validate',
    'queue:list', 'queue:assign',
    'documents:list', 'documents:create', 'documents:edit', 'documents:print',
    'archives:list',
    'notifications:list',
    'analytics:read',
    'settings:read',
    'episodes:list', 'episodes:create', 'episodes:edit', 'episodes:archive',
    'protocols:list', 'protocols:create', 'protocols:edit', 'protocols:delete',
    'knowledge-base:list', 'knowledge-base:search',
    'clinical-decision:read',
    'triage:list', 'triage:manage',
  ],
  laboratory: [
    'DASHBOARD_VIEW',
    'patients:list',
    'consultations:list',
    'lab:list', 'lab:create', 'lab:edit', 'lab:validate',
    'queue:list',
    'documents:list', 'documents:create', 'documents:edit',
    'notifications:list',
    'settings:read',
    'equipment:view', 'supplies:view', 'stock:view',
  ],
  pharmacist: [
    'DASHBOARD_VIEW',
    'patients:list',
    'treatments:list',
    'prescriptions:list', 'prescriptions:edit',
    'diseases:list',
    'lab:list',
    'queue:list',
    'documents:list',
    'notifications:list',
    'settings:read',
    'pharmacy:list', 'pharmacy:dispense',
  ],
  nurse: [
    'DASHBOARD_VIEW',
    'patients:list', 'patients:create', 'patients:edit',
    'consultations:list', 'consultations:create',
    'clinical-cases:list',
    'treatments:list',
    'lab:list',
    'queue:list', 'queue:manage',
    'documents:list',
    'notifications:list',
    'settings:read',
    'episodes:list', 'episodes:create', 'episodes:edit',
    'triage:list', 'triage:manage',
    'equipment:view', 'supplies:view', 'stock:view',
  ],
  accountant: [
    'DASHBOARD_VIEW',
    'patients:list',
    'consultations:list',
    'lab:list',
    'reports:read', 'reports:export',
    'analytics:read',
    'notifications:list',
    'settings:read',
     'equipment:view', 'equipment:report',
    'supplies:view', 'stock:view',
    'billing:list', 'billing:create', 'billing:edit', 'billing:delete', 'billing:pay',
  ],
  archivist: [
    'DASHBOARD_VIEW',
    'patients:list',
    'archives:list', 'archives:manage',
    'documents:list', 'documents:export',
    'consultations:list',
    'clinical-cases:list',
    'diagnostics:list',
    'treatments:list',
    'lab:list',
    'notifications:list',
    'settings:read',
    'episodes:list', 'episodes:archive',
    'equipment:view',
  ],
  patient: [
    'DASHBOARD_VIEW',
    'notifications:list',
    'documents:list', 'documents:export',
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
  patient: 'Patient',
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
  PATIENT: 'Patient',
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
  patient: 10,
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0)
}

export function isMultiFacilityRole(role: UserRole): boolean {
  return role === 'super_admin' || role === 'admin'
}
