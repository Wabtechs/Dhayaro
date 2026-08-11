import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createToken } from '@/lib/auth'
import { apiErrorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('dhayaro_refresh_token')?.value

    if (!refreshToken) {
      return apiErrorResponse('TOKEN_REFRESH_FAILED', 401)
    }

    const payload = await verifyToken(refreshToken)
    if (!payload) {
      return apiErrorResponse('TOKEN_REFRESH_FAILED', 401)
    }

    const access_token = await createToken({ sub: payload.sub, email: payload.email, role: payload.role, facilityId: payload.facilityId, firstname: payload.firstname, lastname: payload.lastname })

    const response = NextResponse.json({ access_token })
    response.cookies.set('dhayaro_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    })

    return response
  } catch {
    return apiErrorResponse('SERVER_ERROR', 500)
  }
}
