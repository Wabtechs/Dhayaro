import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { treatments, diagnostics, diseases, patients, users, prescriptions, medications } from '@/lib/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { sanitizeUuid } from '@/lib/validation'
import { addFacilityFilter, parsePagination, handleEndpointError } from '@/lib/api-errors'
import { requireAuth } from '@/lib/auth'

const TREATMENT_STATUSES = ['PRESCRIBED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUSPENDED']

interface TimelineMedication {
  name: string
  category?: string
  dosage?: string
  frequency?: string
  duration?: string
  instructions?: string
}

interface TimelineItem {
  treatmentId: string
  startDate: string
  endDate?: string
  createdAt: string
  description: string
  status: string
  outcome?: string
  notes?: string
  patientId?: string
  patientName?: string
  patientDossier?: string
  doctorId?: string
  doctorName?: string
  diseaseId?: string
  diseaseCode?: string
  diseaseName?: string
  medications: TimelineMedication[]
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request)
    if ('error' in auth) return auth.error

    const { searchParams } = new URL(request.url)
    const diseaseId = sanitizeUuid(searchParams.get('diseaseId'))
    const doctorId = sanitizeUuid(searchParams.get('doctorId'))
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const { page, size } = parsePagination(searchParams)

    const conditions = []
    if (diseaseId) conditions.push(eq(diagnostics.diseaseId, diseaseId))
    if (doctorId) conditions.push(eq(treatments.doctorId, doctorId))
    if (dateFrom) conditions.push(gte(treatments.startDate, dateFrom))
    if (dateTo) conditions.push(lte(treatments.startDate, dateTo))

    const facilityFilter = addFacilityFilter(treatments.facilityId, auth, searchParams)
    if (facilityFilter) conditions.push(facilityFilter)

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const rows = await getDb().select({
      treatmentId: treatments.id,
      startDate: treatments.startDate,
      endDate: treatments.endDate,
      createdAt: treatments.createdAt,
      description: treatments.description,
      status: treatments.status,
      outcome: treatments.outcome,
      notes: treatments.notes,
      patientId: patients.id,
      patientFirstname: patients.firstname,
      patientLastname: patients.lastname,
      patientDossier: patients.dossierNumber,
      doctorId: users.id,
      doctorFirstname: users.firstname,
      doctorLastname: users.lastname,
      diseaseId: diseases.id,
      diseaseCode: diseases.code,
      diseaseName: diseases.name,
      diseaseCategory: diseases.category,
      medicationId: medications.id,
      medicationName: medications.name,
      medicationCategory: medications.category,
      dosage: prescriptions.dosage,
      frequency: prescriptions.frequency,
      duration: prescriptions.duration,
      prescriptionInstructions: prescriptions.instructions,
    })
      .from(treatments)
      .leftJoin(diagnostics, eq(treatments.diagnosisId, diagnostics.id))
      .leftJoin(diseases, eq(diagnostics.diseaseId, diseases.id))
      .leftJoin(patients, eq(treatments.patientId, patients.id))
      .leftJoin(users, eq(treatments.doctorId, users.id))
      .leftJoin(prescriptions, eq(prescriptions.treatmentId, treatments.id))
      .leftJoin(medications, eq(prescriptions.medicationId, medications.id))
      .where(whereClause)
      .orderBy(desc(treatments.createdAt))

    const treatmentMap = new Map<string, TimelineItem>()
    for (const row of rows) {
      let item = treatmentMap.get(row.treatmentId)
      if (!item) {
        item = {
          treatmentId: row.treatmentId,
          startDate: row.startDate,
          endDate: row.endDate ?? undefined,
          createdAt: String(row.createdAt),
          description: row.description,
          status: row.status,
          outcome: row.outcome ?? undefined,
          notes: row.notes ?? undefined,
          patientId: row.patientId ?? undefined,
          patientName: [row.patientFirstname, row.patientLastname].filter(Boolean).join(' ') || undefined,
          patientDossier: row.patientDossier ?? undefined,
          doctorId: row.doctorId ?? undefined,
          doctorName: [row.doctorFirstname, row.doctorLastname].filter(Boolean).join(' ') || undefined,
          diseaseId: row.diseaseId ?? undefined,
          diseaseCode: row.diseaseCode ?? undefined,
          diseaseName: row.diseaseName ?? undefined,
          medications: [],
        }
        treatmentMap.set(row.treatmentId, item)
      }
      if (row.medicationName) {
        item.medications.push({
          name: row.medicationName,
          category: row.medicationCategory ?? undefined,
          dosage: row.dosage ?? undefined,
          frequency: row.frequency ?? undefined,
          duration: row.duration ?? undefined,
          instructions: row.prescriptionInstructions ?? undefined,
        })
      }
    }

    const timeline = Array.from(treatmentMap.values()).sort((a, b) =>
      b.startDate.localeCompare(a.startDate) || b.createdAt.localeCompare(a.createdAt)
    )

    const total = timeline.length
    const stats = buildStats(timeline)

    const disease =
      diseaseId && timeline.length > 0
        ? (() => {
            const first = timeline[0]
            return {
              id: first.diseaseId ?? null,
              code: first.diseaseCode ?? null,
              name: first.diseaseName ?? 'Maladie non précisée',
              category: null,
              severity: null,
            }
          })()
        : null

    const byDisease = diseaseId
      ? []
      : Array.from(
          timeline.reduce((map, item) => {
            const key = item.diseaseId ?? ''
            let entry = map.get(key)
            if (!entry) {
              entry = {
                diseaseId: item.diseaseId ?? null,
                diseaseCode: item.diseaseCode ?? null,
                diseaseName: item.diseaseName ?? 'Maladie non précisée',
                treatments: 0,
                patients: new Set<string>(),
              }
              map.set(key, entry)
            }
            entry.treatments += 1
            if (item.patientId) entry.patients.add(item.patientId)
            return map
          }, new Map<string, { diseaseId: string | null; diseaseCode: string | null; diseaseName: string; treatments: number; patients: Set<string> }>())
        )
          .map(([_diseaseKey, entry]) => ({ ...entry, patients: entry.patients.size }))
          .sort((a, b) => b.treatments - a.treatments)

    const byDoctor = Array.from(
      timeline.reduce((map, item) => {
        const key = item.doctorId ?? 'unknown'
        let entry = map.get(key)
        if (!entry) {
          entry = {
            doctorId: item.doctorId ?? null,
            doctorName: item.doctorName ?? 'Médecin non précisé',
            treatments: 0,
            patients: new Set<string>(),
            methods: new Map<string, number>(),
            medications: new Map<string, number>(),
            statusDistribution: initStatusDistribution(),
            outcomeDistribution: new Map<string, number>(),
          }
          map.set(key, entry)
        }
        entry.treatments += 1
        if (item.patientId) entry.patients.add(item.patientId)
        entry.methods.set(item.description, (entry.methods.get(item.description) ?? 0) + 1)
        entry.statusDistribution[item.status] = (entry.statusDistribution[item.status] ?? 0) + 1
        if (item.outcome) entry.outcomeDistribution.set(item.outcome, (entry.outcomeDistribution.get(item.outcome) ?? 0) + 1)
        for (const med of item.medications) {
          entry.medications.set(med.name, (entry.medications.get(med.name) ?? 0) + 1)
        }
        return map
      }, new Map<string, {
        doctorId: string | null
        doctorName: string
        treatments: number
        patients: Set<string>
        methods: Map<string, number>
        medications: Map<string, number>
        statusDistribution: Record<string, number>
        outcomeDistribution: Map<string, number>
      }>())
    )
      .map(([_doctorKey, entry]) => ({
        doctorId: entry.doctorId,
        doctorName: entry.doctorName,
        treatments: entry.treatments,
        patients: entry.patients.size,
        methods: Array.from(entry.methods, ([description, count]) => ({ description, count })).sort((a, b) => b.count - a.count),
        medications: Array.from(entry.medications, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
        statusDistribution: entry.statusDistribution,
        outcomeDistribution: Object.fromEntries(entry.outcomeDistribution),
      }))
      .sort((a, b) => b.treatments - a.treatments)

    const start = (page - 1) * size
    const paginated = timeline.slice(start, start + size)

    return NextResponse.json({
      disease,
      stats,
      byDisease,
      byDoctor,
      timeline: paginated,
      page,
      size,
      total,
    })
  } catch (e) {
    return handleEndpointError(e, 'GET /disease-treatment-history')
  }
}

function initStatusDistribution(): Record<string, number> {
  return Object.fromEntries(TREATMENT_STATUSES.map((status) => [status, 0]))
}

function buildStats(timeline: TimelineItem[]) {
  const statusDistribution = initStatusDistribution()
  const outcomeDistribution: Record<string, number> = {}
  const patients = new Set<string>()
  const doctors = new Set<string>()
  const medications = new Set<string>()

  for (const item of timeline) {
    statusDistribution[item.status] = (statusDistribution[item.status] ?? 0) + 1
    if (item.outcome?.trim()) {
      const outcome = item.outcome.trim()
      outcomeDistribution[outcome] = (outcomeDistribution[outcome] ?? 0) + 1
    }
    if (item.patientId) patients.add(item.patientId)
    if (item.doctorId) doctors.add(item.doctorId)
    for (const med of item.medications) medications.add(med.name)
  }

  const months: { month: string; count: number }[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ month: key, count: 0 })
  }
  const monthIndex = new Map(months.map((m) => [m.month, m]))
  for (const item of timeline) {
    const key = item.startDate.slice(0, 7)
    const bucket = monthIndex.get(key)
    if (bucket) bucket.count += 1
  }

  return {
    totalTreatments: timeline.length,
    totalPatients: patients.size,
    totalDoctors: doctors.size,
    totalMedications: medications.size,
    statusDistribution,
    outcomeDistribution,
    monthlyTrend: months,
  }
}
