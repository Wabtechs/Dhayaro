import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { queue, treatments, patients, users } from '@/lib/schema'
import { eq, and, ilike, desc, or, count } from 'drizzle-orm'
import { handleEndpointError, parsePagination, addFacilityFilter } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { sanitizeSearch } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search: rawSearch, offset } = parsePagination(searchParams)
    const search = sanitizeSearch(rawSearch)

    const conditions = [eq(queue.status, 'WITH_PHARMACY')]

    if (search) {
      conditions.push(or(
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
        ilike(treatments.description, `%${search}%`),
      )!)
    }

    const facilityFilter = addFacilityFilter(queue.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(queue).where(whereClause),
      getDb()
        .select({
          id: queue.id,
          facilityId: queue.facilityId,
          patientId: queue.patientId,
          consultationId: queue.consultationId,
          ticketNumber: queue.ticketNumber,
          priority: queue.priority,
          status: queue.status,
          arrivedAt: queue.arrivedAt,
          completedAt: queue.completedAt,
          notes: queue.notes,
          createdAt: queue.createdAt,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
          patientSex: patients.sex,
          patientDateOfBirth: patients.dateOfBirth,
          treatmentId: treatments.id,
          treatmentDescription: treatments.description,
          treatmentStatus: treatments.status,
          treatmentStartDate: treatments.startDate,
          doctorFirstname: users.firstname,
          doctorLastname: users.lastname,
        })
        .from(queue)
        .leftJoin(patients, eq(queue.patientId, patients.id))
        .leftJoin(treatments, and(eq(treatments.patientId, patients.id), eq(treatments.consultationId, queue.consultationId)))
        .leftJoin(users, eq(treatments.doctorId, users.id))
        .where(whereClause)
        .orderBy(desc(queue.arrivedAt))
        .limit(size)
        .offset(offset),
    ])

    return NextResponse.json({
      items,
      total: countResult?.value ?? 0,
      page,
      size,
    })
  } catch (e) {
    return handleEndpointError(e, 'GET /pharmacy')
  }
}
