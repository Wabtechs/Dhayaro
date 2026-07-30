import { getDb } from './db'
import { auditLogs, notifications } from './schema'
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

export async function sendNotification(params: {
  userId: string
  facilityId?: string | null
  title: string
  message: string
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  link?: string
  metadata?: Record<string, unknown>
}) {
  try {
    await getDb().insert(notifications).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      facilityId: params.facilityId || undefined,
      title: params.title,
      message: params.message,
      type: params.type || 'INFO',
      isRead: false,
      link: params.link || null,
      metadata: params.metadata || {},
      createdAt: new Date(),
    })
  } catch (e) {
    console.error('sendNotification error:', e instanceof Error ? e.message : e)
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
