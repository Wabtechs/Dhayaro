import { getDb } from './db'
import { auditLogs } from './schema'
import type { AuthUser } from './auth'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'VIEW'

type AuditInput = {
  action: AuditAction
  entityType: string
  entityId: string
  userId: string
  facilityId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
}

export async function logAudit(
  user: AuthUser,
  action: AuditAction,
  resource: string,
  resourceId: string,
  details?: Record<string, unknown>,
) {
  try {
    await getDb().insert(auditLogs).values({
      userId: user.sub,
      facilityId: user.facilityId || undefined,
      action,
      resource,
      resourceId,
      details: details || {},
    })
  } catch {
    // Audit failures should never break the main operation
  }
}

export async function createAuditEntry(input: AuditInput) {
  try {
    await getDb().insert(auditLogs).values({
      userId: input.userId,
      facilityId: input.facilityId || undefined,
      action: input.action,
      resource: input.entityType,
      resourceId: input.entityId,
      details: {
        ...(input.oldValues ? { old: input.oldValues } : {}),
        ...(input.newValues ? { new: input.newValues } : {}),
      },
    })
  } catch {
    // Audit failures should never break the main operation
  }
}
