'use client'

import { useAuthStore } from '@/store/auth-store'
import {
  hasPermission,
  hasAnyPermission,
  hasMinimumRole,
  ROLE_LABELS,
} from '@/lib/permissions'
import type { Permission } from '@/lib/permissions'
import type { UserRole } from '@/types'

export function usePermissions() {
  const { user } = useAuthStore()
  const role = user?.role as UserRole | undefined

  return {
    role,
    user,

    can: (permission: Permission): boolean => {
      if (!role) return false
      return hasPermission(role, permission)
    },

    canAny: (permissions: Permission[]): boolean => {
      if (!role) return false
      return hasAnyPermission(role, permissions)
    },

    hasMinRole: (requiredRole: UserRole): boolean => {
      if (!role) return false
      return hasMinimumRole(role, requiredRole)
    },

    getRoleLabel: (): string => {
      if (!role) return ''
      return ROLE_LABELS[role] ?? role
    },

    isAdmin: () => role === 'admin' || role === 'super_admin',
    isDoctor: () => role === 'doctor' || role === 'specialist',
    isNurse: () => role === 'nurse',
    isLab: () => role === 'laboratory',
    isPharmacist: () => role === 'pharmacist',
  }
}
