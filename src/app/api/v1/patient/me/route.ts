import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { users, patients, facilities } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { apiError } from '@/lib/api-errors'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error
    if (auth.user.role !== 'PATIENT') {
      return apiError(403, 'Accès réservé aux patients')
    }

    const [user] = await getDb()
      .select({
        id: users.id,
        email: users.email,
        firstname: users.firstname,
        lastname: users.lastname,
        role: users.role,
        facilityId: users.facilityId,
      })
      .from(users)
      .where(eq(users.id, auth.user.sub))
      .limit(1)

    if (!user) {
      return apiError(404, 'Utilisateur introuvable')
    }

    const [patient] = await getDb()
      .select()
      .from(patients)
      .where(eq(patients.userId, user.id))
      .limit(1)

    if (!patient) {
      return apiError(404, 'Profil patient introuvable')
    }

    let facilityName = null
    if (patient.facilityId) {
      const [facility] = await getDb()
        .select({ name: facilities.name })
        .from(facilities)
        .where(eq(facilities.id, patient.facilityId))
        .limit(1)
      if (facility) facilityName = facility.name
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
      patient: {
        id: patient.id,
        patientUuid: patient.patientUuid,
        firstname: patient.firstname,
        lastname: patient.lastname,
        facilityId: patient.facilityId,
        facilityName,
        sex: patient.sex,
        dateOfBirth: patient.dateOfBirth,
        age: patient.age,
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
  } catch {
    return apiError(500, 'Erreur interne')
  }
}
