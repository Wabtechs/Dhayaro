import { NextResponse } from 'next/server'
import { eq, and, SQL } from 'drizzle-orm'
import type { AnyPgColumn } from 'drizzle-orm/pg-core'
import { ErrorCode, type ErrorCodeType } from './errors/error-codes'
import { getErrorMessage } from './errors/error-messages'
import { mapErrorToCode } from './errors/error-mapper'

export function apiError(status: number, detail: string) {
  return NextResponse.json({ detail }, { status })
}

export function apiErrorResponse(code: ErrorCodeType, status: number, fieldErrors?: Record<string, string>) {
  const errorInfo = getErrorMessage(code)
  return NextResponse.json(
    {
      success: false,
      message: errorInfo.message,
      code,
      errors: fieldErrors || {},
      data: null,
    },
    { status },
  )
}

export function handleEndpointError(error: unknown, endpoint: string): NextResponse {
  const code = mapErrorToCode(error)
  const status = getErrorStatus(code)
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`${endpoint}:`, msg)
  return apiErrorResponse(code, status)
}

function getErrorStatus(code: ErrorCodeType): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_JSON:
      return 422
    case ErrorCode.AUTHENTICATION_FAILED:
    case ErrorCode.SESSION_EXPIRED:
    case ErrorCode.TOKEN_REFRESH_FAILED:
      return 401
    case ErrorCode.ACCESS_DENIED:
      return 403
    case ErrorCode.RESOURCE_NOT_FOUND:
      return 404
    case ErrorCode.RESOURCE_ALREADY_EXISTS:
    case ErrorCode.CONFLICT:
      return 409
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 429
    case ErrorCode.REQUEST_TIMEOUT:
      return 408
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503
    default:
      return 500
  }
}

const FACILITY_ROLES = ['DOCTOR', 'SPECIALIST', 'LABORATORY', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'ACCOUNTANT', 'ARCHIVIST']

export function addFacilityFilter(
  facilityColumn: AnyPgColumn,
  auth: { user: { role: string; facilityId?: string | null } },
  searchParams?: URLSearchParams,
): SQL | undefined {
  if (auth.user.role === 'SUPER_ADMIN') {
    const override = searchParams?.get('facilityId')
    if (override) {
      return eq(facilityColumn, override)
    }
    return undefined
  }
  if (!auth.user.facilityId) {
    return undefined
  }
  return eq(facilityColumn, auth.user.facilityId)
}

export function enforceFacilityAccess(
  body: Record<string, unknown>,
  auth: { user: { role: string; facilityId?: string | null } },
  searchParams?: URLSearchParams,
): { facilityId: string | null } {
  if (auth.user.role === 'SUPER_ADMIN') {
    const facilityId = (body.facilityId as string) || searchParams?.get('facilityId') || null
    return { facilityId }
  }
  return { facilityId: auth.user.facilityId || null }
}

export function addDoctorFilter(
  doctorColumn: AnyPgColumn,
  auth: { user: { role: string; sub: string } },
): SQL | undefined {
  if (auth.user.role === 'DOCTOR') {
    return eq(doctorColumn, auth.user.sub)
  }
  return undefined
}

export function logError(endpoint: string, error: unknown) {
  const msg = error instanceof Error ? error.message : String(error)
  console.error(`${endpoint}:`, msg)
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const size = Math.min(100, Math.max(1, parseInt(searchParams.get('size') || '20', 10)))
  const search = searchParams.get('search') || ''
  const offset = (page - 1) * size
  return { page, size, search, offset }
}

export function pickAllowedKeys(body: Record<string, unknown>, allowedKeys: readonly string[]) {
  const fields: Record<string, unknown> = {}
  for (const key of allowedKeys) {
    if (key in body && body[key] !== null && body[key] !== undefined && body[key] !== '') {
      fields[key] = body[key]
    }
  }
  fields.updatedAt = new Date()
  return fields
}

const MAX_JSON_BYTES = 512 * 1024

export async function validateJsonBody<T>(request: Request): Promise<{ body: T } | { ok: false }> {
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_JSON_BYTES) {
    return { ok: false }
  }

  try {
    const text = await request.text()
    if (text.length > MAX_JSON_BYTES) {
      return { ok: false }
    }
    return { body: JSON.parse(text) as T }
  } catch {
    return { ok: false }
  }
}
