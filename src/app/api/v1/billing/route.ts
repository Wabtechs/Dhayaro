import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { invoices, payments } from '@/lib/schema'
import { count, sum } from 'drizzle-orm'
import { addFacilityFilter, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const invoiceFilter = addFacilityFilter(invoices.facilityId, auth, searchParams)
    const paymentFilter = addFacilityFilter(payments.facilityId, auth, searchParams)

    const [invoiceRows, totalPaidRows, paymentCountRows] = await Promise.all([
      getDb()
        .select({ status: invoices.status, value: count() })
        .from(invoices)
        .where(invoiceFilter)
        .groupBy(invoices.status),
      getDb()
        .select({ value: sum(payments.amount) })
        .from(payments)
        .where(paymentFilter),
      getDb()
        .select({ value: count() })
        .from(payments)
        .where(paymentFilter),
    ])

    return NextResponse.json({
      service: 'billing',
      endpoints: ['/invoices', '/payments', '/billing-codes'],
      summary: {
        invoices: invoiceRows.reduce((total, row) => total + Number(row.value), 0),
        byStatus: Object.fromEntries(invoiceRows.map((row) => [row.status, Number(row.value)])),
        payments: Number(paymentCountRows[0]?.value ?? 0),
        totalPaid: Number(totalPaidRows[0]?.value ?? 0),
      },
    })
  } catch (e) {
    return handleEndpointError(e, 'GET /billing')
  }
}
