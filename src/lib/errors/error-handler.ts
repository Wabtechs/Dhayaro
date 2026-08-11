import { NextResponse } from 'next/server'
import { ErrorCode, type ErrorCodeType } from './error-codes'
import { getErrorMessage } from './error-messages'
import { mapErrorToCode } from './error-mapper'

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function createErrorResponse(
  code: ErrorCodeType,
  status: number,
  fieldErrors?: Record<string, string>,
): NextResponse {
  const errorInfo = getErrorMessage(code)
  const body = {
    success: false,
    message: errorInfo.message,
    code,
    errors: fieldErrors || {},
    data: null,
  }

  return NextResponse.json(body, { status })
}

export function createValidationError(fieldErrors: Record<string, string>): NextResponse {
  return createErrorResponse(ErrorCode.VALIDATION_ERROR, 422, fieldErrors)
}

export function createZodValidationError(zodErrorString: string): NextResponse {
  const fieldErrors: Record<string, string> = {}
  const parts = zodErrorString.split(';')

  for (const part of parts) {
    const trimmed = part.trim()
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx > -1) {
      const field = trimmed.slice(0, colonIdx).trim()
      const message = trimmed.slice(colonIdx + 1).trim()
      if (field) {
        fieldErrors[field] = message
      }
    }
  }

  return Object.keys(fieldErrors).length > 0
    ? createValidationError(fieldErrors)
    : createErrorResponse(ErrorCode.VALIDATION_ERROR, 422)
}

export function handleApiError(
  error: unknown,
  endpoint: string,
  requestId?: string,
): NextResponse {
  const code = mapErrorToCode(error)
  const status = getHttpStatus(code)
  const reqId = requestId || generateRequestId()

  const technicalMsg = error instanceof Error ? error.message : String(error)
  console.error(`[${reqId}] ${endpoint}:`, technicalMsg, error instanceof Error ? error.stack : '')

  return createErrorResponse(code, status)
}

export function getHttpStatus(code: ErrorCodeType): number {
  switch (code) {
    case ErrorCode.VALIDATION_ERROR:
    case ErrorCode.INVALID_JSON:
      return 422
    case ErrorCode.AUTHENTICATION_FAILED:
      return 401
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
    case ErrorCode.SERVER_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.NETWORK_ERROR:
      return 500
    case ErrorCode.RESOURCE_CREATE_FAILED:
    case ErrorCode.RESOURCE_UPDATE_FAILED:
    case ErrorCode.RESOURCE_DELETE_FAILED:
      return 500
    default:
      return 500
  }
}
