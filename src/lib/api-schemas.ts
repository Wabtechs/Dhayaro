import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { apiError } from '@/lib/api-errors'
import {
  TREATMENT_STATUSES, LAB_EXAM_STATUSES, DIAGNOSTIC_TYPES, CONSULTATION_STATUSES,
  QUEUE_STATUSES, PRIORITIES, SEVERITY_LEVELS, CASE_PRIORITIES, EPISODE_STATUSES,
  DOCUMENT_TYPES, ENTITY_TYPES, GENDERS, CARE_COVERAGE_TYPES, COVERAGE_STATUSES,
} from '@/lib/schemas'

export const API_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY',
  'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST', 'PATIENT',
] as const

export const FACILITY_TYPES_API = ['HOSPITAL', 'CLINIC', 'LABORATORY', 'PHARMACY'] as const

export const NOTIFICATION_TYPES_API = ['INFO', 'WARNING', 'SUCCESS', 'ERROR'] as const

export const OUTCOME_STATUSES_API = ['SUCCESS', 'FAILURE', 'IN_PROGRESS', 'PENDING'] as const

export const DISCHARGE_OUTCOMES_API = ['GUERISON', 'AMELIORATION', 'DECES', 'TRANSFERT', 'FUITE'] as const

export const AUDIT_STATUSES_API = ['completed', 'in_progress', 'pending'] as const

export const CASE_PRIORITIES_API = ['low', 'medium', 'high', 'critical', 'urgent'] as const

const uuid = z.uuid()
const optUuid = z.union([z.uuid(), z.literal(''), z.null()]).nullish()
const optStr = z.string().nullish()
const optBool = z.boolean().nullish()
const optNum = z.number().nullish()
const optJson = z.unknown().nullish()
const optStrArr = z.union([z.array(z.string()), z.string()]).nullish()

export function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((i) => (i.path.length ? `${i.path.join('.')}: ` : '') + (i.message || 'Invalid value'))
    .join('; ')
}

export async function parseJsonBody(
  request: NextRequest,
  schema: z.ZodTypeAny,
): Promise<{ ok: true; body: any } | { ok: false; error: Response }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { ok: false, error: apiError(400, 'Invalid JSON body') }
  }
  const result = schema.safeParse(raw)
  if (!result.success) {
    return { ok: false, error: apiError(400, formatZodIssues(result.error)) }
  }
  return { ok: true, body: raw as any }
}

export const authLoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
})

export const userCreateSchema = z.object({
  email: z.email(),
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  role: z.enum(API_ROLES),
  password: z.string().min(6),
  facilityId: optUuid,
  phone: optStr,
  specialty: optStr,
  licenseNumber: optStr,
  availability: z.enum(['AVAILABLE', 'ON_LEAVE', 'OFF_DUTY'] as const).nullish(),
})

export const userUpdateSchema = z
  .object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.email(),
    phone: optStr,
    specialty: optStr,
    licenseNumber: optStr,
    availability: z.enum(['AVAILABLE', 'ON_LEAVE', 'OFF_DUTY'] as const).nullish(),
    isActive: optBool,
    role: z.enum(API_ROLES),
    facilityId: optUuid,
    password: z.string().min(6),
  })
  .partial()

export const patientCreateSchema = z.object({
  firstname: z.string().min(1),
  lastname: z.string().min(1),
  sex: z.enum(GENDERS),
  dateOfBirth: z.string().min(1),
  patientUuid: optStr,
  phone: optStr,
  email: z.email().nullish(),
  age: optNum,
  bloodGroup: optStr,
  address: optStr,
  city: optStr,
  photo: optStr,
  emergencyContactName: optStr,
  emergencyContactPhone: optStr,
  emergencyContactRelation: optStr,
  insuranceName: optStr,
  insuranceNumber: optStr,
  insuranceExpiry: optStr,
  allergies: optStrArr,
  antecedents: optJson,
  medicalHistoryJson: optJson,
  notes: optStr,
  facilityId: optUuid,
})

export const patientUpdateSchema = z
  .object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.email(),
    sex: z.enum(GENDERS),
    dateOfBirth: z.string().min(1),
    bloodGroup: optStr,
    facilityId: optUuid,
    allergies: optStrArr,
    phone: optStr,
    address: optStr,
    patientUuid: optStr,
    age: optNum,
    medicalHistoryJson: optJson,
  })
  .partial()

export const consultationCreateSchema = z.object({
  patientId: uuid,
  doctorId: uuid,
  motif: z.string().min(1),
  symptoms: z.array(z.string()).nullish(),
  vitalSigns: z.record(z.string(), z.unknown()).nullish(),
  notes: optStr,
  provisionalDiagnosis: optStr,
  status: z.enum(CONSULTATION_STATUSES).nullish(),
  episodeId: optUuid,
  isFollowUp: optBool,
  previousConsultationId: optUuid,
  facilityId: optUuid,
})

export const consultationUpdateSchema = z
  .object({
    motif: z.string().min(1),
    symptoms: z.array(z.string()).nullish(),
    vitalSigns: z.record(z.string(), z.unknown()).nullish(),
    notes: optStr,
    provisionalDiagnosis: optStr,
    status: z.enum(CONSULTATION_STATUSES),
    isFollowUp: optBool,
    previousConsultationId: optUuid,
    facilityId: optUuid,
    patientId: optUuid,
    doctorId: optUuid,
  })
  .partial()

export const treatmentCreateSchema = z.object({
  patientId: uuid,
  doctorId: uuid,
  description: z.string().min(1),
  startDate: z.string().min(1),
  status: z.enum(TREATMENT_STATUSES).nullish(),
  consultationId: optUuid,
  diagnosisId: optUuid,
  episodeId: optUuid,
  endDate: optStr,
  notes: optStr,
  outcome: optStr,
  facilityId: optUuid,
})

export const treatmentUpdateSchema = z
  .object({
    description: z.string().min(1),
    status: z.enum(TREATMENT_STATUSES),
    startDate: z.string().min(1),
    endDate: optStr,
    notes: optStr,
    outcome: optStr,
    consultationId: optUuid,
    patientId: optUuid,
    doctorId: optUuid,
    diagnosisId: optUuid,
    facilityId: optUuid,
  })
  .partial()

export const labExamCreateSchema = z.object({
  patientId: uuid,
  examName: z.string().min(1),
  categoryId: optUuid,
  doctorId: optUuid,
  episodeId: optUuid,
  labTechnicianId: optUuid,
  consultationId: optUuid,
  clinicalIndication: optStr,
  results: optJson,
  resultNotes: optStr,
  facilityId: optUuid,
})

export const labExamUpdateSchema = z
  .object({
    labTechnicianId: optUuid,
    categoryId: optUuid,
    consultationId: optUuid,
    examName: z.string().min(1),
    clinicalIndication: optStr,
    status: z.enum(LAB_EXAM_STATUSES),
    results: optJson,
    resultNotes: optStr,
    validatedBy: optUuid,
    validatedAt: optStr,
    completedAt: optStr,
  })
  .partial()

export const diagnosticCreateSchema = z.object({
  patientId: uuid,
  doctorId: uuid,
  consultationId: uuid,
  diagnosticType: z.enum(DIAGNOSTIC_TYPES),
  description: z.string().min(1),
  diseaseId: optUuid,
  notes: optStr,
  episodeId: optUuid,
  facilityId: optUuid,
})

export const diagnosticUpdateSchema = z
  .object({
    diseaseId: optUuid,
    diagnosticType: z.enum(DIAGNOSTIC_TYPES),
    description: z.string().min(1),
    notes: optStr,
    consultationId: optUuid,
    patientId: optUuid,
    doctorId: optUuid,
    facilityId: optUuid,
    isValidated: optBool,
  })
  .partial()

export const diseaseCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  description: optStr,
  symptoms: optStrArr,
  complications: optStrArr,
  treatments: optStrArr,
  isContagious: optBool,
  severity: z.enum(SEVERITY_LEVELS).nullish(),
})

export const diseaseUpdateSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    category: z.string().min(1),
    description: optStr,
    symptoms: optStrArr,
    complications: optStrArr,
    treatments: optStrArr,
    isContagious: optBool,
    severity: z.enum(SEVERITY_LEVELS),
  })
  .partial()

export const documentCreateSchema = z.object({
  title: z.string().min(1),
  documentType: z.enum(DOCUMENT_TYPES),
  patientId: optUuid,
  consultationId: optUuid,
  doctorId: optUuid,
  episodeId: optUuid,
  content: optJson,
  filePath: optStr,
  facilityId: optUuid,
})

export const documentUpdateSchema = z
  .object({
    patientId: optUuid,
    consultationId: optUuid,
    documentType: z.enum(DOCUMENT_TYPES),
    title: z.string().min(1),
    content: optJson,
    filePath: optStr,
    isPrinted: optBool,
  })
  .partial()

export const facilityCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  facilityType: z.enum(FACILITY_TYPES_API),
  address: optStr,
  city: optStr,
  phone: optStr,
  email: optStr,
  bedCount: optNum,
})

export const facilityUpdateSchema = z
  .object({
    name: z.string().min(1),
    code: z.string().min(1),
    facilityType: z.enum(FACILITY_TYPES_API),
    address: optStr,
    city: optStr,
    phone: optStr,
    email: optStr,
    bedCount: optNum,
    departmentCount: optNum,
    staffCount: optNum,
  })
  .partial()

export const prescriptionCreateSchema = z.object({
  treatmentId: uuid,
  medicationId: uuid,
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: optStr,
  quantity: optNum,
})

export const queueCreateSchema = z.object({
  patientId: uuid,
  consultationId: optUuid,
  priority: z.enum(PRIORITIES).nullish(),
  assignedDoctorId: optUuid,
  estimatedWaitMinutes: optNum,
  notes: optStr,
  facilityId: optUuid,
})

export const queueUpdateSchema = z
  .object({
    status: z.enum(QUEUE_STATUSES),
    priority: z.enum(PRIORITIES),
    assignedDoctorId: optUuid,
    queuePosition: optNum,
    estimatedWaitMinutes: optNum,
    notes: optStr,
    startedAt: optStr,
    completedAt: optStr,
  })
  .partial()

export const archiveCreateSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().min(1),
  title: z.string().min(1),
  patientId: optUuid,
  summary: optStr,
  data: optJson,
  facilityId: optUuid,
})

export const archiveUpdateSchema = z
  .object({
    title: z.string().min(1),
    summary: optStr,
    data: optJson,
  })
  .partial()

export const clinicalCaseCreateSchema = z.object({
  patientId: uuid,
  doctorId: optUuid,
  title: optStr,
  description: optStr,
  provisionalDiagnosis: optStr,
  treatment: optStr,
  treatmentDuration: optStr,
  outcomeStatus: z.enum(OUTCOME_STATUSES_API).nullish(),
  outcomeNotes: optStr,
  priority: z.enum(CASE_PRIORITIES_API).nullish(),
  symptomsJson: optJson,
  tagsJson: optJson,
  facilityId: optUuid,
})

export const clinicalCaseUpdateSchema = z
  .object({
    title: optStr,
    description: optStr,
    patientId: optUuid,
    doctorId: optUuid,
    facilityId: optUuid,
    symptomsJson: optJson,
    provisionalDiagnosis: optStr,
    treatment: optStr,
    treatmentDuration: optStr,
    outcomeStatus: z.enum(OUTCOME_STATUSES_API).nullish(),
    outcomeNotes: optStr,
    priority: z.enum(CASE_PRIORITIES_API).nullish(),
    tagsJson: optJson,
  })
  .partial()

export const careEpisodeCreateSchema = z.object({
  patientId: uuid,
  status: z.enum(EPISODE_STATUSES).nullish(),
  admitDate: optStr,
  admitReason: optStr,
  metadata: optJson,
  facilityId: optUuid,
})

export const careEpisodeUpdateSchema = z
  .object({
    status: z.enum(EPISODE_STATUSES),
    dischargeDate: optStr,
    dischargeSummary: optJson,
    dischargeOutcome: z.enum(DISCHARGE_OUTCOMES_API).nullish(),
    isArchived: optBool,
    metadata: optJson,
    admitReason: optStr,
  })
  .partial()

export const protocolCreateSchema = z.object({
  name: z.string().min(1),
  diseaseId: optUuid,
  description: optStr,
  steps: z.array(z.unknown()).nullish(),
  targetPopulation: optStr,
  contraindications: z.array(z.unknown()).nullish(),
  efficacyRate: optNum,
  isActive: optBool,
  facilityId: optUuid,
})

export const protocolUpdateSchema = z
  .object({
    name: z.string().min(1),
    description: optStr,
    steps: z.array(z.unknown()).nullish(),
    targetPopulation: optStr,
    contraindications: z.array(z.unknown()).nullish(),
    efficacyRate: optNum,
    isActive: optBool,
    diseaseId: optUuid,
  })
  .partial()

export const notificationCreateSchema = z.object({
  userId: uuid,
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(NOTIFICATION_TYPES_API).nullish(),
  link: optStr,
  metadata: optJson,
  facilityId: optUuid,
})

export const notificationsReadSchema = z.object({
  ids: z.array(z.uuid()).nullish(),
  all: optBool,
})

export const syncPushSchema = z.object({
  ids: z.array(z.uuid()).nullish(),
  all: optBool,
})

export const settingsUpdateSchema = z.object({
  preferences: z.record(z.string(), z.unknown()),
})

export const helpImageSchema = z.object({
  location: z.string().min(1),
  imageData: z.string().min(1),
  altText: optStr,
})

export const labCategorySchema = z.object({
  name: z.string().min(1),
  description: optStr,
})

export const auditFoncUpdateSchema = z.object({
  item_id: z.string().min(1),
  status: z.enum(AUDIT_STATUSES_API),
  note: optStr,
})

export const auditFoncNoteSchema = z.object({
  note: z.string().min(1),
})

export const careCoverageCreateSchema = z.object({
  patientId: uuid,
  coverageType: z.enum(CARE_COVERAGE_TYPES),
  organization: optStr,
  contractNumber: optStr,
  coverageRate: optNum,
  coverageCeiling: optNum,
  remainingAmount: optNum,
  validFrom: optStr,
  validUntil: optStr,
  justification: optStr,
  facilityId: optUuid,
})

export const careCoverageUpdateSchema = z
  .object({
    coverageType: z.enum(CARE_COVERAGE_TYPES),
    organization: optStr,
    contractNumber: optStr,
    coverageRate: optNum,
    coverageCeiling: optNum,
    remainingAmount: optNum,
    validFrom: optStr,
    validUntil: optStr,
    justification: optStr,
    status: z.enum(COVERAGE_STATUSES),
  })
  .partial()

export const partnerCompanyCreateSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  sector: optStr,
  address: optStr,
  city: optStr,
  country: optStr,
  phone: optStr,
  email: z.email().nullish(),
  website: optStr,
  contactName: optStr,
  contactFunction: optStr,
  contactPhone: optStr,
  contactEmail: z.email().nullish(),
  contractNumber: optStr,
  contractStartDate: optStr,
  contractEndDate: optStr,
  contractStatus: z.enum(COVERAGE_STATUSES).nullish(),
  coverageRate: optNum,
  annualCeiling: optNum,
  notes: optStr,
  facilityId: optUuid,
})

export const partnerCompanyUpdateSchema = z
  .object({
    code: z.string().min(1),
    name: z.string().min(1),
    sector: optStr,
    address: optStr,
    city: optStr,
    country: optStr,
    phone: optStr,
    email: z.email().nullish(),
    website: optStr,
    contactName: optStr,
    contactFunction: optStr,
    contactPhone: optStr,
    contactEmail: z.email().nullish(),
    contractNumber: optStr,
    contractStartDate: optStr,
    contractEndDate: optStr,
    contractStatus: z.enum(COVERAGE_STATUSES),
    coverageRate: optNum,
    annualCeiling: optNum,
    notes: optStr,
  })
  .partial()

export const partnerPatientCreateSchema = z.object({
  partnerId: uuid,
  patientId: uuid,
  contractNumber: optStr,
  coverageRate: optNum,
  annualCeiling: optNum,
  remainingAmount: optNum,
  validFrom: optStr,
  validUntil: optStr,
  notes: optStr,
  facilityId: optUuid,
})

export const partnerPatientUpdateSchema = z
  .object({
    partnerId: uuid,
    patientId: uuid,
    contractNumber: optStr,
    coverageRate: optNum,
    annualCeiling: optNum,
    remainingAmount: optNum,
    validFrom: optStr,
    validUntil: optStr,
    status: z.enum(COVERAGE_STATUSES),
    notes: optStr,
  })
  .partial()

export const patientHistoryCreateSchema = z.object({
  patientId: uuid,
  episodeId: optUuid,
  eventType: z.string().min(1),
  title: z.string().min(1),
  description: optStr,
  performedBy: optUuid,
  performedByName: optStr,
  metadata: optJson,
  facilityId: optUuid,
})

export const patientHistoryUpdateSchema = z
  .object({
    episodeId: optUuid,
    eventType: z.string().min(1),
    title: z.string().min(1),
    description: optStr,
    performedBy: optUuid,
    performedByName: optStr,
    metadata: optJson,
  })
  .partial()

export const notificationPreferenceCreateSchema = z.object({
  userId: uuid,
  soundEnabled: optBool,
  volume: optNum,
  notificationTypes: z.array(z.string()).nullish(),
  services: z.array(z.string()).nullish(),
  facilityId: optUuid,
})

export const notificationPreferenceUpdateSchema = z
  .object({
    soundEnabled: optBool,
    volume: optNum,
    notificationTypes: z.array(z.string()).nullish(),
    services: z.array(z.string()).nullish(),
  })
  .partial()
