import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { payments, invoices, patients, users } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiErrorResponse, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'
import { sanitizeUuid } from '@/lib/validation'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiErrorResponse('VALIDATION_ERROR', 422, { paymentId: "L'identifiant du paiement est invalide." })

    const [row] = await getDb()
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
        invoicePaid: invoices.paidAmount,
        patientFirstname: patients.firstname,
        patientLastname: patients.lastname,
        pharmacistName: users.firstname,
      })
      .from(payments)
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(patients, eq(payments.patientId, patients.id))
      .leftJoin(users, eq(payments.recordedBy, users.id))
      .where(eq(payments.id, validId))
      .limit(1)

    if (!row) {
      return apiErrorResponse('RESOURCE_NOT_FOUND', 404)
    }

    return NextResponse.json(row)
  } catch (e) {
    return handleEndpointError(e, 'GET /payments/[id]')
  }
}
