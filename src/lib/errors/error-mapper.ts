import { ErrorCode, type ErrorCodeType } from './error-codes'

const PG_UNIQUE_VIOLATION = '23505'
const PG_FOREIGN_KEY_VIOLATION = '23503'
const PG_NOT_NULL_VIOLATION = '23502'
const PG_CHECK_VIOLATION = '23514'

interface PgError {
  code?: string
  message?: string
  detail?: string
  constraint?: string
}

function isPgError(e: unknown): e is PgError {
  return typeof e === 'object' && e !== null && 'code' in e && typeof (e as PgError).code === 'string'
}

export function mapErrorToCode(error: unknown): ErrorCodeType {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return ErrorCode.NETWORK_ERROR
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return ErrorCode.REQUEST_TIMEOUT
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()

    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connexion')) {
      return ErrorCode.NETWORK_ERROR
    }

    if (msg.includes('timeout') || msg.includes('abort')) {
      return ErrorCode.REQUEST_TIMEOUT
    }

    if (msg.includes('401') || msg.includes('authentif')) {
      return ErrorCode.AUTHENTICATION_FAILED
    }

    if (msg.includes('403') || msg.includes('permission') || msg.includes('autoris')) {
      return ErrorCode.ACCESS_DENIED
    }

    if (msg.includes('404') || msg.includes('not found') || msg.includes('introuvable')) {
      return ErrorCode.RESOURCE_NOT_FOUND
    }

    if (msg.includes('409') || msg.includes('conflict') || msg.includes('conflit')) {
      return ErrorCode.CONFLICT
    }

    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('trop de')) {
      return ErrorCode.RATE_LIMIT_EXCEEDED
    }

    if (msg.includes('422') || msg.includes('validation')) {
      return ErrorCode.VALIDATION_ERROR
    }

    if (msg.includes('refresh')) {
      return ErrorCode.TOKEN_REFRESH_FAILED
    }

    if (msg.includes('session') || msg.includes('token')) {
      return ErrorCode.SESSION_EXPIRED
    }
  }

  if (isPgError(error)) {
    switch (error.code) {
      case PG_UNIQUE_VIOLATION:
        return ErrorCode.RESOURCE_ALREADY_EXISTS
      case PG_FOREIGN_KEY_VIOLATION:
        return ErrorCode.RESOURCE_DELETE_FAILED
      case PG_NOT_NULL_VIOLATION:
      case PG_CHECK_VIOLATION:
        return ErrorCode.VALIDATION_ERROR
      default:
        return ErrorCode.DATABASE_ERROR
    }
  }

  return ErrorCode.SERVER_ERROR
}

export function isNetworkError(error: unknown): boolean {
  return mapErrorToCode(error) === ErrorCode.NETWORK_ERROR
}

export function isAuthError(error: unknown): boolean {
  const code = mapErrorToCode(error)
  return code === ErrorCode.AUTHENTICATION_FAILED || code === ErrorCode.SESSION_EXPIRED
}
