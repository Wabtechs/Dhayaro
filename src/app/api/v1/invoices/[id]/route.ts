import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { invoices, invoiceItems, patients, users, careCoverages, billingCodes } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { apiError, handleEndpointError } from '@/lib/api-errors'
import { requireAuth, requireRole } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
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
    if (!validId) return apiError(400, 'ID invalide')

    const [row] = await getDb()
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
        coverageOrganization: careCoverages.organization,
        coverageOrgRate: careCoverages.coverageRate,
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(users, eq(invoices.doctorId, users.id))
      .leftJoin(careCoverages, eq(invoices.careCoverageId, careCoverages.id))
      .where(eq(invoices.id, validId))
      .limit(1)

    if (!row) {
      return apiError(404, 'Invoice not found')
    }

    const items = await getDb()
      .select({
        id: invoiceItems.id,
        billingCodeId: invoiceItems.billingCodeId,
        description: invoiceItems.description,
        serviceType: invoiceItems.serviceType,
        quantity: invoiceItems.quantity,
        unitPrice: invoiceItems.unitPrice,
        totalPrice: invoiceItems.totalPrice,
        notes: invoiceItems.notes,
        billingCode: billingCodes.code,
        billingLabel: billingCodes.label,
      })
      .from(invoiceItems)
      .leftJoin(billingCodes, eq(invoiceItems.billingCodeId, billingCodes.id))
      .where(eq(invoiceItems.invoiceId, validId))

    return NextResponse.json({ ...row, items })
  } catch (e) {
    return handleEndpointError(e, 'GET /invoices/[id]')
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(request, ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'])
    if ('error' in auth) return auth.error

    const { id } = await params
    const validId = sanitizeUuid(id)
    if (!validId) return apiError(400, 'ID invalide')

    const [row] = await getDb().select({ id: invoices.id }).from(invoices).where(eq(invoices.id, validId)).limit(1)
    if (!row) return apiError(404, 'Invoice not found')

    await logAudit(auth.user, 'UPDATE', 'invoice', validId)
    return NextResponse.json({ success: true })
  } catch (e) {
    return handleEndpointError(e, 'PUT /invoices/[id]')
  }
}
