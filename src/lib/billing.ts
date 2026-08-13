import { getDb } from '@/lib/db'
import { careCoverages, invoices, invoiceItems } from '@/lib/schema'
import { and, eq, gte, lte, or, isNull, desc } from 'drizzle-orm'

export interface CoverageSplit {
  coverageRate: number
  coverageCeiling: number
  insuranceShare: number
  patientShare: number
  coverageApplied: boolean
}

export interface CoverageLike {
  id?: string
  coverageRate?: number | null
  coverageCeiling?: number | null
  remainingAmount?: number | null
}

export function computeCoverageSplit(totalAmount: number, coverage: CoverageLike): CoverageSplit {
  const rate = coverage.coverageRate ?? 0
  const rawInsurance = Math.round((totalAmount * rate) / 100)
  const ceiling = coverage.coverageCeiling ?? rawInsurance
  const remaining = coverage.remainingAmount ?? rawInsurance
  const insuranceShare = Math.max(0, Math.min(rawInsurance, ceiling, remaining, totalAmount))
  return {
    coverageRate: rate,
    coverageCeiling: coverage.coverageCeiling ?? 0,
    insuranceShare,
    patientShare: totalAmount - insuranceShare,
    coverageApplied: insuranceShare > 0,
  }
}

export async function getActiveCareCoverage(patientId: string, facilityId?: string | null): Promise<CoverageLike | null> {
  const today = new Date().toISOString().split('T')[0]
  const db = getDb()
  const [row] = await db
    .select({
      id: careCoverages.id,
      coverageType: careCoverages.coverageType,
      coverageRate: careCoverages.coverageRate,
      coverageCeiling: careCoverages.coverageCeiling,
      remainingAmount: careCoverages.remainingAmount,
      validFrom: careCoverages.validFrom,
      validUntil: careCoverages.validUntil,
    })
    .from(careCoverages)
    .where(and(
      eq(careCoverages.patientId, patientId),
      eq(careCoverages.isActive, true),
      eq(careCoverages.status, 'ACTIVE'),
      facilityId ? eq(careCoverages.facilityId, facilityId) : undefined,
      or(isNull(careCoverages.validFrom), lte(careCoverages.validFrom, today)),
      or(isNull(careCoverages.validUntil), gte(careCoverages.validUntil, today)),
    ))
    .orderBy(desc(careCoverages.remainingAmount))
    .limit(1)

  return row || null
}

export interface AutoInvoiceInput {
  facilityId: string | null
  patientId: string
  episodeId?: string | null
  doctorId?: string | null
  careCoverageId?: string | null
  billingCodeId?: string | null
  serviceType: string
  description: string
  amount: number
  quantity?: number
  notes?: string | null
}

export interface AutoInvoiceResult {
  invoiceId: string
  invoiceNumber: string
  totalAmount: number
  insuranceShare: number
  patientShare: number
  coverageRate: number
  coverageApplied: boolean
}

export async function createAutoInvoice(input: AutoInvoiceInput): Promise<AutoInvoiceResult> {
  const db = getDb()
  const now = new Date()

  let coverage: CoverageLike | null = null
  if (input.careCoverageId) {
    const [row] = await db
      .select({
        id: careCoverages.id,
        coverageType: careCoverages.coverageType,
        coverageRate: careCoverages.coverageRate,
        coverageCeiling: careCoverages.coverageCeiling,
        remainingAmount: careCoverages.remainingAmount,
        validFrom: careCoverages.validFrom,
        validUntil: careCoverages.validUntil,
      })
      .from(careCoverages)
      .where(eq(careCoverages.id, input.careCoverageId))
      .limit(1)
    coverage = row || null
  } else {
    coverage = await getActiveCareCoverage(input.patientId, input.facilityId)
  }

  const split = computeCoverageSplit(input.amount, coverage ?? {})
  const quantity = input.quantity ?? 1
  const unitPrice = Math.round(input.amount / Math.max(1, quantity))
  const invoiceNumber =
    'FACT-' + now.getFullYear().toString().slice(-2) + '-' + Date.now().toString().slice(-6) + '-' + crypto.randomUUID().slice(0, 4).toUpperCase()

  const invoice = await db.transaction(async (tx) => {
    const [created] = await tx.insert(invoices).values({
      id: crypto.randomUUID(),
      facilityId: input.facilityId,
      patientId: input.patientId,
      careCoverageId: coverage?.id ?? null,
      doctorId: input.doctorId || null,
      episodeId: input.episodeId || null,
      invoiceNumber,
      status: 'ISSUED',
      totalAmount: input.amount,
      paidAmount: 0,
      currency: 'CDF',
      coverageRate: split.coverageRate,
      coverageCeiling: split.coverageCeiling,
      patientShare: split.patientShare,
      insuranceShare: split.insuranceShare,
      issueDate: now.toISOString().split('T')[0],
      dueDate: null,
      paidAt: null,
      notes: input.notes || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }).returning()

    await tx.insert(invoiceItems).values({
      id: crypto.randomUUID(),
      facilityId: input.facilityId,
      invoiceId: created.id,
      billingCodeId: input.billingCodeId || null,
      description: input.description,
      serviceType: input.serviceType,
      quantity,
      unitPrice,
      totalPrice: input.amount,
      notes: input.notes || null,
      createdAt: now,
    })

    if (coverage?.id && split.insuranceShare > 0) {
      const current = coverage.remainingAmount ?? 0
      const newRemaining = Math.max(0, current - split.insuranceShare)
      await tx.update(careCoverages)
        .set({ remainingAmount: newRemaining, updatedAt: now })
        .where(eq(careCoverages.id, coverage.id))
    }

    return created
  })

  return {
    invoiceId: invoice.id,
    invoiceNumber,
    totalAmount: input.amount,
    insuranceShare: split.insuranceShare,
    patientShare: split.patientShare,
    coverageRate: split.coverageRate,
    coverageApplied: split.coverageApplied,
  }
}
