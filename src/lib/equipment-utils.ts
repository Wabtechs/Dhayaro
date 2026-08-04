import { NextRequest, NextResponse } from 'next/server'
import { sql } from 'drizzle-orm'
import { getDb } from './db'
import { equipmentLogs, auditLogs, notifications, users } from './schema'
import { requireAuth } from './auth'
import type { AuthUser } from './auth'
import { apiError } from './api-errors'

export type EquipmentPermission =
  | 'equipment:view' | 'equipment:create' | 'equipment:update' | 'equipment:delete' | 'equipment:assign'
  | 'equipment:transfer' | 'equipment:maintenance' | 'equipment:audit' | 'equipment:report'
  | 'supplies:view' | 'supplies:manage' | 'stock:view' | 'stock:manage'
  | 'supplier:view' | 'supplier:manage'

const STAFF_ROLES = ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST']

const PERMISSION_ROLES: Record<EquipmentPermission, string[]> = {
  'equipment:view': STAFF_ROLES,
  'equipment:create': ['SUPER_ADMIN', 'ADMIN'],
  'equipment:update': ['SUPER_ADMIN', 'ADMIN'],
  'equipment:delete': ['SUPER_ADMIN', 'ADMIN'],
  'equipment:assign': ['SUPER_ADMIN', 'ADMIN'],
  'equipment:transfer': ['SUPER_ADMIN', 'ADMIN'],
  'equipment:maintenance': ['SUPER_ADMIN', 'ADMIN', 'NURSE'],
  'equipment:audit': ['SUPER_ADMIN', 'ADMIN'],
  'equipment:report': ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  'supplies:view': STAFF_ROLES,
  'supplies:manage': ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
  'stock:view': STAFF_ROLES,
  'stock:manage': ['SUPER_ADMIN', 'ADMIN', 'PHARMACIST'],
  'supplier:view': STAFF_ROLES,
  'supplier:manage': ['SUPER_ADMIN', 'ADMIN'],
}

export async function requireEquipmentPermission(
  request: NextRequest,
  permission: EquipmentPermission,
): Promise<{ user: AuthUser } | { error: NextResponse }> {
  const auth = await requireAuth(request)
  if ('error' in auth) return auth
  const allowed = PERMISSION_ROLES[permission] ?? []
  if (!allowed.includes(auth.user.role)) {
    return { error: apiError(403, 'Insufficient permissions') }
  }
  return auth
}

export function canWriteEquipment(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN'
}

export function canManageSupplies(role: string): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'PHARMACIST'
}

export function generateCode(prefix: string): string {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const rand = crypto.randomUUID().slice(0, 6).toUpperCase()
  return `${prefix}-${stamp}-${rand}`
}

export function generateEquipmentCode(): string {
  return generateCode('EQ')
}

export function generateQrCode(equipmentCode: string, equipmentId: string): string {
  return JSON.stringify({
    type: 'dhayaro-equipment',
    code: equipmentCode,
    id: equipmentId,
  })
}

export async function logEquipmentEvent(params: {
  equipmentId: string
  action: string
  user: AuthUser
  details?: Record<string, unknown>
  facilityId?: string | null
}) {
  try {
    await getDb().insert(equipmentLogs).values({
      id: crypto.randomUUID(),
      facilityId: params.facilityId ?? params.user.facilityId ?? null,
      equipmentId: params.equipmentId,
      action: params.action,
      details: params.details ?? {},
      userId: params.user.sub,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  } catch {
    // never break the main operation
  }
}

export async function logEquipmentAudit(params: {
  user: AuthUser
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT'
  resource: string
  resourceId: string
  details?: Record<string, unknown>
}) {
  try {
    await getDb().insert(auditLogs).values({
      userId: params.user.sub,
      facilityId: params.user.facilityId || undefined,
      action: params.action,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details || {},
      timestamp: new Date(),
    })
  } catch {
    // never break the main operation
  }
}

export async function notifyStaff(params: {
  facilityId?: string | null
  title: string
  message: string
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  link?: string
  roles?: string[]
}) {
  try {
    const targetRoles = params.roles && params.roles.length > 0 ? params.roles : ['SUPER_ADMIN', 'ADMIN']
    const rows = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(sql`${users.role} = ANY(${targetRoles}) AND ${users.isActive} = true`)
    await Promise.all(rows.map(u =>
      insertNotification(u.id, params.facilityId, params.title, params.message, params.type, params.link)
    ))
  } catch {
    // notifications must never break the main operation
  }
}

async function insertNotification(
  userId: string,
  facilityId: string | null | undefined,
  title: string,
  message: string,
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' = 'INFO',
  link?: string,
) {
  try {
    await getDb().insert(notifications).values({
      id: crypto.randomUUID(),
      userId,
      facilityId: facilityId || undefined,
      title,
      message,
      type,
      isRead: false,
      link: link || null,
      metadata: {},
      createdAt: new Date(),
    })
  } catch {
    // ignore
  }
}

export function stockStatus(quantity: number, minStock: number, criticalStock: number, expiryDate?: string | null): 'ok' | 'low' | 'critical' | 'expired' {
  if (expiryDate) {
    const d = new Date(expiryDate)
    if (!Number.isNaN(d.getTime()) && d.getTime() < Date.now()) return 'expired'
  }
  if (quantity <= criticalStock) return 'critical'
  if (quantity <= minStock) return 'low'
  return 'ok'
}
