import { getDb } from './db'
import { auditLogs } from './schema'
import type { AuthUser } from './auth'

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'VIEW'

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
