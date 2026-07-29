import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('dhayaro_refresh_token')?.value

    if (!refreshToken) {
      return NextResponse.json({ detail: 'Refresh token is required' }, { status: 401 })
    }

    const payload = await verifyToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ detail: 'Invalid or expired refresh token' }, { status: 401 })
    }

    const access_token = await createToken({ sub: payload.sub, email: payload.email, role: payload.role, facilityId: payload.facilityId })

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
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
