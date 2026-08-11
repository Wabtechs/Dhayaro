import { getDb } from '@/lib/db'
import { documents } from '@/lib/schema'
import { and, eq } from 'drizzle-orm'

type DocumentType = 'PRESCRIPTION' | 'CERTIFICATE' | 'REPORT' | 'LAB_RESULT' | 'REFERRAL' | 'ORDONNANCE'

interface ClinicalDocumentInput {
  facilityId: string | null
  patientId: string
  doctorId: string
  episodeId?: string | null
  consultationId?: string | null
  documentType: DocumentType
  title: string
  content?: Record<string, unknown>
}

export async function createClinicalDocument(input: ClinicalDocumentInput): Promise<boolean> {
  const db = getDb()
  const now = new Date()

  await db.insert(documents).values({
    id: crypto.randomUUID(),
    facilityId: input.facilityId,
    patientId: input.patientId,
    consultationId: input.consultationId || null,
    doctorId: input.doctorId,
    episodeId: input.episodeId || null,
    documentType: input.documentType,
    title: input.title,
    content: input.content || {},
    createdAt: now,
  })

  return true
}

export async function documentExistsForEntity(
  entityKey: 'consultationId' | 'episodeId',
  entityId: string,
  documentType: DocumentType,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: documents.id })
    .from(documents)
    .where(and(
      entityKey === 'consultationId' ? eq(documents.consultationId, entityId) : eq(documents.episodeId, entityId),
      eq(documents.documentType, documentType),
      eq(documents.isActive, true),
    ))
    .limit(1)

  return !!row
}
