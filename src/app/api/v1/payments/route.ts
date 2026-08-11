import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { payments, invoices, patients } from '@/lib/schema'
import { eq, desc, and, count } from 'drizzle-orm'
import { apiError, logError, parsePagination, addFacilityFilter, enforceFacilityAccess } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit, sendNotification } from '@/lib/audit'
import { logPatientEvent, EVENT_TITLES } from '@/lib/patient-history'
import { parseJsonBody, paymentCreateSchema } from '@/lib/api-schemas'
import { sanitizeUuid } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const { page, size, offset } = parsePagination(searchParams)

    const conditions = []

    const invoiceId = sanitizeUuid(searchParams.get('invoiceId'))
    if (invoiceId) conditions.push(eq(payments.invoiceId, invoiceId))

    const patientId = sanitizeUuid(searchParams.get('patientId'))
    if (patientId) conditions.push(eq(payments.patientId, patientId))

    const method = searchParams.get('method')
    if (method) conditions.push(eq(payments.method, method as 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'INSURANCE'))

    const facilityFilter = addFacilityFilter(payments.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [[countResult], items] = await Promise.all([
      getDb().select({ value: count() }).from(payments).where(whereClause),
      getDb()
        .select({
          id: payments.id,
          facilityId: payments.facilityId,
          invoiceId: payments.invoiceId,
          patientId: payments.patientId,
          amount: payments.amount,
          currency: payments.currency,
          method: payments.method,
          reference: payments.reference,
          status: payments.status,
          recordedBy: payments.recordedBy,
          paidAt: payments.paidAt,
          createdAt: payments.createdAt,
          invoiceNumber: invoices.invoiceNumber,
          invoiceStatus: invoices.status,
          invoiceTotal: invoices.totalAmount,
          patientFirstname: patients.firstname,
          patientLastname: patients.lastname,
        })
        .from(payments)
        .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
        .leftJoin(patients, eq(payments.patientId, patients.id))
        .where(whereClause)
        .orderBy(desc(payments.paidAt))
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
    logError('GET /payments', e)
    return apiError(500, 'Internal server error')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'])
    if ('error' in auth) return auth.error

    const parsed = await parseJsonBody(request, paymentCreateSchema)
    if (parsed.ok === false) return parsed.error
    const body = parsed.body

    const invoiceId = sanitizeUuid(body.invoiceId)
    if (!invoiceId) return apiError(400, 'InvoiceId invalide')

    const db = getDb()
    const now = new Date()

    const invoice = await db.select({
      id: invoices.id,
      facilityId: invoices.facilityId,
      patientId: invoices.patientId,
      status: invoices.status,
      totalAmount: invoices.totalAmount,
      paidAmount: invoices.paidAmount,
      currency: invoices.currency,
      doctorId: invoices.doctorId,
    }).from(invoices).where(eq(invoices.id, invoiceId)).limit(1)

    if (invoice.length === 0) return apiError(404, 'Invoice not found')
    const inv = invoice[0]
    if (inv.status === 'PAID') return apiError(400, 'Invoice already paid')
    if (inv.status === 'CANCELLED') return apiError(400, 'Cannot record payment on a cancelled invoice')

    const { facilityId } = enforceFacilityAccess(inv, auth)
    if (auth.user.role !== 'SUPER_ADMIN' && inv.facilityId && inv.facilityId !== facilityId) {
      return apiError(403, 'This invoice does not belong to your facility')
    }

    const payment = await db.transaction(async (tx) => {
      const [row] = await tx.insert(payments).values({
        id: crypto.randomUUID(),
        facilityId: inv.facilityId,
        invoiceId,
        patientId: inv.patientId,
        amount: body.amount,
        currency: body.currency || inv.currency,
        method: body.method,
        reference: body.reference || null,
        status: body.status ?? 'COMPLETED',
        recordedBy: body.recordedById ? sanitizeUuid(body.recordedById) : null,
        paidAt: body.paidAt || now.toISOString(),
        createdAt: now,
      }).returning()

      const newPaidAmount = inv.paidAmount + (body.amount > 0 ? body.amount : 0)
      const newStatus = newPaidAmount >= inv.totalAmount ? 'PAID' : inv.status
      await tx.update(invoices).set({
        paidAmount: newPaidAmount,
        status: newStatus,
        paidAt: newStatus === 'PAID' ? now : inv.status === 'PAID' ? inv.paidAt : null,
        updatedAt: now,
      }).where(eq(invoices.id, invoiceId))

      return { payment: row, inv: { ...inv, paidAmount: newPaidAmount, status: newStatus } }
    })

    await logAudit(auth.user, 'CREATE', 'payment', payment.payment.id, {
      invoiceId,
      amount: payment.payment.amount,
      method: payment.payment.method,
      reference: payment.payment.reference,
    })

    await logPatientEvent({
      facilityId: inv.facilityId,
      patientId: inv.patientId,
      eventType: 'DOCUMENT_CREATED',
      title: EVENT_TITLES.DOCUMENT_CREATED,
      description: `Paiement ${payment.payment.amount} ${payment.payment.currency} (${payment.payment.method}) enregistré - Facture ${(await db.select({ number: invoices.invoiceNumber }).from(invoices).where(eq(invoices.id, invoiceId)).limit(1))[0]?.number || invoiceId}`,
      performedBy: auth.user.sub,
      performedByName: `${auth.user.firstname ?? ''} ${auth.user.lastname ?? ''}`.trim(),
      metadata: { paymentId: payment.payment.id, invoiceId, amount: payment.payment.amount, method: payment.payment.method, newStatus: payment.inv.status },
    })

    const { invoiceNumber } = await db.select({ number: invoices.invoiceNumber }).from(invoices).where(eq(invoices.id, invoiceId)).limit(1)

    if (inv.doctorId && inv.doctorId !== auth.user.sub) {
      await sendNotification({
        userId: inv.doctorId,
        facilityId: inv.facilityId,
        title: 'Paiement enregistré',
        message: `Un paiement de ${payment.payment.amount} a été enregistré.` + (invoiceNumber ? ` (Facture ${invoiceNumber})` : ''),
        type: 'SUCCESS',
        link: `/invoices/${invoiceId}`,
        metadata: { invoiceId, paymentId: payment.payment.id },
      })
    }

    return NextResponse.json(payment.payment, { status: 201 })
  } catch (e) {
    logError('POST /payments', e)
    return apiError(500, 'Internal server error')
  }
}
