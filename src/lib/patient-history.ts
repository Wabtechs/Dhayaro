import { getDb } from '@/lib/db'
import { patientHistory } from '@/lib/schema'

export interface PatientHistoryEvent {
  patientId: string
  episodeId?: string
  eventType: string
  title: string
  description?: string
  performedBy?: string
  performedByName?: string
  metadata?: Record<string, unknown>
  facilityId?: string
}

export async function logPatientEvent(event: PatientHistoryEvent): Promise<void> {
  try {
    const db = getDb()
    const now = new Date()

    await db.insert(patientHistory).values({
      facilityId: event.facilityId || null,
      patientId: event.patientId,
      episodeId: event.episodeId || null,
      eventType: event.eventType,
      title: event.title,
      description: event.description || null,
      performedBy: event.performedBy || null,
      performedByName: event.performedByName || null,
      metadata: event.metadata || {},
      createdAt: now,
    })
  } catch (error) {
    console.error('Failed to log patient history event:', error)
  }
}

export const PatientEventTypes = {
  PATIENT_CREATED: 'PATIENT_CREATED',
  PATIENT_UPDATED: 'PATIENT_UPDATED',
  PATIENT_ARCHIVED: 'PATIENT_ARCHIVED',
  QUEUE_TICKET_CREATED: 'QUEUE_TICKET_CREATED',
  QUEUE_STATUS_CHANGED: 'QUEUE_STATUS_CHANGED',
  TRIAGE_COMPLETED: 'TRIAGE_COMPLETED',
  CONSULTATION_CREATED: 'CONSULTATION_CREATED',
  CONSULTATION_STARTED: 'CONSULTATION_STARTED',
  CONSULTATION_COMPLETED: 'CONSULTATION_COMPLETED',
  CONSULTATION_CANCELLED: 'CONSULTATION_CANCELLED',
  DIAGNOSTIC_CREATED: 'DIAGNOSTIC_CREATED',
  DIAGNOSTIC_VALIDATED: 'DIAGNOSTIC_VALIDATED',
  DIAGNOSTIC_UPDATED: 'DIAGNOSTIC_UPDATED',
  TREATMENT_PRESCRIBED: 'TREATMENT_PRESCRIBED',
  TREATMENT_STARTED: 'TREATMENT_STARTED',
  TREATMENT_COMPLETED: 'TREATMENT_COMPLETED',
  TREATMENT_CANCELLED: 'TREATMENT_CANCELLED',
  TREATMENT_SUSPENDED: 'TREATMENT_SUSPENDED',
  PRESCRIPTION_CREATED: 'PRESCRIPTION_CREATED',
  LAB_EXAM_REQUESTED: 'LAB_EXAM_REQUESTED',
  LAB_EXAM_STARTED: 'LAB_EXAM_STARTED',
  LAB_EXAM_COMPLETED: 'LAB_EXAM_COMPLETED',
  LAB_EXAM_VALIDATED: 'LAB_EXAM_VALIDATED',
  LAB_EXAM_CANCELLED: 'LAB_EXAM_CANCELLED',
  EPISODE_ADMITTED: 'EPISODE_ADMITTED',
  EPISODE_STATUS_CHANGED: 'EPISODE_STATUS_CHANGED',
  EPISODE_DISCHARGED: 'EPISODE_DISCHARGED',
  EPISODE_ARCHIVED: 'EPISODE_ARCHIVED',
  EPISODE_RESTORED: 'EPISODE_RESTORED',
  DOCUMENT_CREATED: 'DOCUMENT_CREATED',
  ARCHIVE_CREATED: 'ARCHIVE_CREATED',
  HOSPITALIZATION_ADMITTED: 'HOSPITALIZATION_ADMITTED',
  HOSPITALIZATION_DISCHARGED: 'HOSPITALIZATION_DISCHARGED',
  PHARMACY_DISPENSED: 'PHARMACY_DISPENSED',
} as const

export type PatientEventType = typeof PatientEventTypes[keyof typeof PatientEventTypes]

export function createEventMetadata(base: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...base,
    timestamp: new Date().toISOString(),
  }
}

export const EVENT_TITLES: Record<PatientEventType, string> = {
  PATIENT_CREATED: 'Patient créé',
  PATIENT_UPDATED: 'Patient modifié',
  PATIENT_ARCHIVED: 'Patient archivé',
  QUEUE_TICKET_CREATED: 'Ticket file d\'attente créé',
  QUEUE_STATUS_CHANGED: 'Statut file d\'attente modifié',
  TRIAGE_COMPLETED: 'Triage effectué',
  CONSULTATION_CREATED: 'Consultation créée',
  CONSULTATION_STARTED: 'Consultation commencée',
  CONSULTATION_COMPLETED: 'Consultation terminée',
  CONSULTATION_CANCELLED: 'Consultation annulée',
  DIAGNOSTIC_CREATED: 'Diagnostic créé',
  DIAGNOSTIC_VALIDATED: 'Diagnostic validé',
  DIAGNOSTIC_UPDATED: 'Diagnostic modifié',
  TREATMENT_PRESCRIBED: 'Traitement prescrit',
  TREATMENT_STARTED: 'Traitement commencé',
  TREATMENT_COMPLETED: 'Traitement terminé',
  TREATMENT_CANCELLED: 'Traitement annulé',
  TREATMENT_SUSPENDED: 'Traitement suspendu',
  PRESCRIPTION_CREATED: 'Prescription créée',
  LAB_EXAM_REQUESTED: 'Examen labo demandé',
  LAB_EXAM_STARTED: 'Examen labo commencé',
  LAB_EXAM_COMPLETED: 'Examen labo terminé',
  LAB_EXAM_VALIDATED: 'Examen labo validé',
  LAB_EXAM_CANCELLED: 'Examen labo annulé',
  EPISODE_ADMITTED: 'Épisode admis',
  EPISODE_STATUS_CHANGED: 'Statut épisode modifié',
  EPISODE_DISCHARGED: 'Épisode sorti',
  EPISODE_ARCHIVED: 'Épisode archivé',
  EPISODE_RESTORED: 'Épisode restauré',
  DOCUMENT_CREATED: 'Document créé',
  ARCHIVE_CREATED: 'Archive créée',
  HOSPITALIZATION_ADMITTED: 'Hospitalisation admission',
  HOSPITALIZATION_DISCHARGED: 'Hospitalisation sortie',
  PHARMACY_DISPENSED: 'Médicament délivré',
}