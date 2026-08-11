import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { invoices, invoiceItems, patients, users, careCoverages } from '@/lib/schema'
import { eq, desc, ilike, and, or, count } from 'drizzle-orm'
import { apiError, logError, parsePagination, addFacilityFilter, enforceFacilityAccess } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { parseJsonBody, invoiceCreateSchema } from '@/lib/api-schemas'
import { sanitizeUuid, sanitizeSearch } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, search: rawSearch, offset } = parsePagination(searchParams)
    const search = sanitizeSearch(rawSearch)

    const conditions = []

    const status = searchParams.get('status')
    if (status) {
      conditions.push(eq(invoices.status, status as 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'REFUNDED'))
    }

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    if (patientId) conditions.push(eq(invoices.patientId, patientId))

    const facilityFilter = addFacilityFilter(invoices.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    if (search) {
      conditions.push(or(
        ilike(invoices.invoiceNumber, `%${search}%`),
        ilike(patients.firstname, `%${search}%`),
        ilike(patients.lastname, `%${search}%`),
      )!)
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(invoices).where(whereClause),
      getDb()
        .select({
          id: invoices.id,
          facilityId: invoices.facilityId,
          patientId: invoices.patientId,
          careCoverageId: invoices.careCoverageId,
          doctorId: invoices.doctorId,
          episodeId: invoices.episodeId,
          invoiceNumber: invoices.invoiceNumber,
          status: invoices.status,
          totalAmount: invoices.totalAmount,
          paidAmount: invoices.paidAmount,
          currency: invoices.currency,
          coverageRate: invoices.coverageRate,
          coverageCeiling: invoices.coverageCeiling,
          patientShare: invoices.patientShare,
          insuranceShare: invoices.insuranceShare,
          issueDate: invoices.issueDate,
          dueDate: invoices.dueDate,
          paidAt: invoices.paidAt,
          notes: invoices.notes,
          isActive: invoices.isActive,
          createdAt: invoices.createdAt,
          updatedAt: invoices.updatedAt,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
          doctorFirstname: users.firstname,
          doctorLastname: users.lastname,
        })
        .from(invoices)
        .leftJoin(patients, eq(invoices.patientId, patients.id))
        .leftJoin(users, eq(invoices.doctorId, users.id))
        .where(whereClause)
        .orderBy(desc(invoices.createdAt))
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
    logError('GET /invoices', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'SPECIALIST', 'ACCOUNTANT'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, invoiceCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const patientId = sanitizeUuid(body.patientId)
    if (!patientId) return apiError(400, 'PatientId invalide')

    const { facilityId } = enforceFacilityAccess(body, auth)
    const db = getDb()
    const now = new Date()

    const invoiceNumber = 'FACT-' + now.getFullYear().toString().slice(-2) + '-' + Date.now().toString().slice(-6)

    await db.transaction(async (tx) => {
      const [invoice] = await tx.insert(invoices).values({
        id: crypto.randomUUID(),
        facilityId: facilityId || null,
        patientId,
        careCoverageId: body.careCoverageId ? sanitizeUuid(body.careCoverageId) : null,
        doctorId: body.doctorId ? sanitizeUuid(body.doctorId) : null,
        episodeId: body.episodeId ? sanitizeUuid(body.episodeId) : null,
        invoiceNumber,
        status: 'ISSUED',
        totalAmount: body.items.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0),
        paidAmount: 0,
        currency: 'CDF',
        coverageRate: 0,
        coverageCeiling: 0,
        patientShare: body.items.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0),
        insuranceShare: 0,
        issueDate: body.issueDate || now.toISOString().split('T')[0],
        dueDate: body.dueDate || null,
        paidAt: null,
        notes: body.notes || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }).returning()

      const itemRows = body.items.map((i) => ({
        id: crypto.randomUUID(),
        facilityId: facilityId || null,
        invoiceId: invoice.id,
        billingCodeId: i.billingCodeId ? sanitizeUuid(i.billingCodeId) : null,
        description: i.description,
        serviceType: i.serviceType,
        quantity: i.quantity ?? 1,
        unitPrice: i.unitPrice ?? 0,
        totalPrice: i.totalPrice ?? 0,
        notes: i.notes || null,
        createdAt: now,
      }))

      if (itemRows.length > 0) {
        await tx.insert(invoiceItems).values(itemRows)
      }

      await tx.update(invoices).set({ totalAmount: itemRows.reduce((sum, i) => sum + i.totalPrice, 0) }).where(eq(invoices.id, invoice.id))

      return invoice
    })

    await logAudit(auth.user, 'CREATE', 'invoice', invoiceNumber, { patientId, invoiceNumber })

    await logPatientEvent({
      facilityId,
      patientId,
      eventType: 'DOCUMENT_CREATED',
      title: EVENT_TITLES.DOCUMENT_CREATED,
      description: `Facture ${invoiceNumber} créée pour ${body.items.length} prestation(s)`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname ?? ''} ${auth.user.lastname ?? ''}`.trim(),
      metadata: { invoiceNumber, totalAmount: body.items.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0), itemCount: body.items.length },
    })

    if (body.doctorId && body.doctorId !== auth.user.sub) {
      await sendNotification({
        userId: body.doctorId,
        facilityId: facilityId || null,
        title: 'Nouvelle facture',
        message: `Une facture a été créée pour l'un de vos patients.`,
        type: 'INFO',
        link: `/invoices/${invoiceNumber}`,
        metadata: { invoiceNumber, patientId },
      })
    }

    return NextResponse.json({ invoiceNumber, status: 'ISSUED', totalAmount: body.items.reduce((sum, i) => sum + (i.totalPrice ?? 0), 0) }, { status: 201 })
  } catch (e) {
    logError('POST /invoices', e)
    return apiError(500, 'Internal server error')
  }
}
