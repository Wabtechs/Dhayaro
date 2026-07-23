import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, createToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { refresh_token } = body

    if (!refresh_token) {
      return NextResponse.json({ detail: 'Refresh token is required' }, { status: 400 })
    }

    const payload = await verifyToken(refresh_token)
    if (!payload) {
      return NextResponse.json({ detail: 'Invalid or expired refresh token' }, { status: 401 })
    }

    const access_token = await createToken({ sub: payload.sub, email: payload.email, role: payload.role, facilityId: payload.facilityId })

    return NextResponse.json({ access_token })
  } catch {
    return NextResponse.json({ detail: 'Internal server error' }, { status: 500 })
  }
}
