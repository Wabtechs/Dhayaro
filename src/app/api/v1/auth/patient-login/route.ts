import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, patients } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { createToken, createRefreshToken, verifyPassword } from '@/lib/auth'
import { parseJsonBody, authLoginSchema } from '@/lib/api-schemas'
import { apiErrorResponse } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request, authLoginSchema)
    if (parsed.ok === false) return parsed.error
    const { email, password } = parsed.body

    const rows = await getDb()
      .select({
        id: users.id,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
        role: users.role,
        passwordHash: users.passwordHash,
        facilityId: users.facilityId,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (rows.length === 0) {
      return apiErrorResponse('AUTHENTICATION_FAILED', 401)
    }

    const user = rows[0]

    if (user.role !== 'PATIENT') {
      return apiErrorResponse('ACCESS_DENIED', 403)
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return apiErrorResponse('AUTHENTICATION_FAILED', 401)
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1)

    if (!patient) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    const token = await createToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId || null,
      firstname: user.firstname,
      lastname: user.lastname,
    })

    const refreshToken = await createRefreshToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      facilityId: user.facilityId || null,
      firstname: user.firstname,
      lastname: user.lastname,
    })

    const response = NextResponse.json({
      access_token: token,
      refresh_token: refreshToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
      patient: {
        id: patient.id,
        patientUuid: patient.patientUuid,
        firstname: patient.firstname,
        lastname: patient.lastname,
        facilityId: patient.facilityId,
        sex: patient.sex,
        dateOfBirth: patient.dateOfBirth,
        bloodGroup: patient.bloodGroup,
        phone: patient.phone,
        email: patient.email,
        address: patient.address,
        city: patient.city,
        photo: patient.photo,
        emergencyContactName: patient.emergencyContactName,
        emergencyContactPhone: patient.emergencyContactPhone,
        emergencyContactRelation: patient.emergencyContactRelation,
        insuranceName: patient.insuranceName,
        insuranceNumber: patient.insuranceNumber,
        allergies: patient.allergies,
        antecedents: patient.antecedents,
      },
    })

    response.cookies.set('dhayaro_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 86400,
    })
    response.cookies.set('dhayaro_refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 604800,
    })

    return response
  } catch {
    return apiErrorResponse('SERVER_ERROR', 500)
  }
}
