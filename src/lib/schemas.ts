import { z } from 'zod'
import { sanitizeUuid } from '@/lib/validation'

export const commaSplit = (v?: string): string[] =>
  v ? v.split(',').map((s) => s.trim()).filter(Boolean) : []

export const commaJoin = (v?: string[] | string | null): string =>
  Array.isArray(v) ? v.join(', ') : (v ?? '')

export const safeParseJson = (v: string): Record<string, unknown> => {
  const raw = v.trim()
  if (!raw) return {}
  try { return JSON.parse(raw) as Record<string, unknown> } catch { return { text: raw } }
}

export const splitName = (full: string) => {
  const parts = full.trim().split(/\s+/)
  return {
    firstname: parts[0] || full.trim(),
    lastname: parts.slice(1).join(' ') || full.trim(),
  }
}

const uuidField = (msg: string) => z.uuid(msg)

const optionalString = z.string().optional().or(z.literal(''))

export const ROLE_MAP: Record<string, string> = {
  super_admin: 'SUPER_ADMIN',
  admin: 'ADMIN',
  receptionist: 'RECEPTIONIST',
  doctor: 'DOCTOR',
  specialist: 'SPECIALIST',
  laboratory: 'LABORATORY',
  pharmacist: 'PHARMACIST',
  nurse: 'NURSE',
  accountant: 'ACCOUNTANT',
  archivist: 'ARCHIVIST',
  patient: 'PATIENT',
}

const MULTI_FACILITY_ROLES = new Set(['super_admin', 'admin'])

export const USER_ROLES = [
  'super_admin', 'admin', 'receptionist', 'doctor', 'specialist',
  'laboratory', 'pharmacist', 'nurse', 'accountant', 'archivist', 'patient',
] as const

export const DOCTOR_ROLES = ['doctor', 'specialist'] as const

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export const GENDERS = ['M', 'F', 'OTHER'] as const

export const FACILITY_TYPES = ['hospital', 'clinic', 'laboratory', 'pharmacy'] as const

export const SEVERITY_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const

export const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const

export const CASE_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const

export const CASE_STATUSES = ['draft', 'active', 'in_review', 'resolved', 'archived'] as const

export const CONSULTATION_STATUSES = ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export const QUEUE_STATUSES = ['WAITING', 'WITH_DOCTOR', 'WITH_LAB', 'WITH_PHARMACY', 'COMPLETED', 'CANCELLED'] as const

export const DOCUMENT_TYPES = ['PRESCRIPTION', 'CERTIFICATE', 'REPORT', 'LAB_RESULT', 'REFERRAL', 'ORDONNANCE'] as const

export const ENTITY_TYPES = ['CONSULTATION', 'DIAGNOSTIC', 'TREATMENT', 'LAB_EXAM', 'DOCUMENT', 'PATIENT_FILE'] as const

export const EPISODE_STATUSES = ['ADMITTED', 'HOSPITALIZED', 'DISCHARGED', 'ARCHIVED'] as const

export const CARE_COVERAGE_TYPES = ['PERSONAL', 'INSURANCE', 'MUTUAL', 'COMPANY', 'NGO', 'GOVERNMENT', 'HEALTH_PROJECT', 'PARTNER', 'FREE', 'OTHER'] as const

export const COVERAGE_STATUSES = ['ACTIVE', 'EXPIRED', 'SUSPENDED'] as const

export const AVAILABILITY = ['AVAILABLE', 'ON_LEAVE', 'OFF_DUTY'] as const

export const loginSchema = z.object({
  email: z.email('Veuillez entrer une adresse email valide'),
  password: z.string().min(1, 'Veuillez entrer votre mot de passe'),
  rememberMe: z.boolean(),
})
export type LoginValues = z.infer<typeof loginSchema>

export const forgotPasswordSchema = z.object({
  email: z.email('Veuillez entrer une adresse email valide'),
})
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

const userBase = {
  name: z.string().min(1, 'Le nom est requis'),
  email: z.email('Adresse email invalide'),
  role: z.enum(USER_ROLES),
  facility: z.string(),
  phone: optionalString,
}

export const userCreateSchema = z
  .object({ ...userBase, password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères') })
  .superRefine((v, ctx) => {
    if (!MULTI_FACILITY_ROLES.has(v.role) && !sanitizeUuid(v.facility)) {
      ctx.addIssue({ code: 'custom', path: ['facility'], message: 'Un établissement est requis pour ce rôle.' })
    }
  })

export const userEditSchema = z
  .object(userBase)
  .superRefine((v, ctx) => {
    if (!MULTI_FACILITY_ROLES.has(v.role) && !sanitizeUuid(v.facility)) {
      ctx.addIssue({ code: 'custom', path: ['facility'], message: 'Un établissement est requis pour ce rôle.' })
    }
  })

export type UserCreateValues = z.infer<typeof userCreateSchema>
export type UserEditValues = z.infer<typeof userEditSchema>

export const toUserPayload = (v: UserCreateValues | UserEditValues, withPassword = false) => {
  const { firstname, lastname } = splitName(v.name)
  return {
    firstname,
    lastname,
    email: v.email,
    ...(withPassword && 'password' in v && v.password ? { password: v.password } : {}),
    role: ROLE_MAP[v.role] || 'DOCTOR',
    facilityId: sanitizeUuid(v.facility) || null,
    phone: v.phone || undefined,
  }
}

const doctorFields = {
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.email('Adresse email invalide'),
  role: z.enum(DOCTOR_ROLES),
  facility: z.uuid('L\'établissement est requis'),
  phone: optionalString,
  specialty: optionalString,
  licenseNumber: optionalString,
  availability: z.enum(AVAILABILITY),
}

export const doctorCreateSchema = z.object({
  ...doctorFields,
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export const doctorEditSchema = z.object(doctorFields)

export type DoctorCreateValues = z.infer<typeof doctorCreateSchema>
export type DoctorEditValues = z.infer<typeof doctorEditSchema>

export const toDoctorPayload = (v: DoctorCreateValues | DoctorEditValues) => ({
  firstname: v.firstName,
  lastname: v.lastName,
  email: v.email,
  ...('password' in v && v.password ? { password: v.password } : {}),
  role: ROLE_MAP[v.role] || 'DOCTOR',
  facilityId: v.facility,
  phone: v.phone || undefined,
  specialty: v.specialty || null,
  licenseNumber: v.licenseNumber || null,
  availability: v.availability || null,
})

const facilityFields = {
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(FACILITY_TYPES),
  address: optionalString,
  city: optionalString,
  phone: optionalString,
  email: z.union([z.literal(''), z.email('Adresse email invalide')]),
  bedCount: z.string(),
}

export const facilityCreateSchema = z.object({
  ...facilityFields,
  code: z.string(),
})

export const facilityEditSchema = z.object(facilityFields)

export type FacilityCreateValues = z.infer<typeof facilityCreateSchema>
export type FacilityEditValues = z.infer<typeof facilityEditSchema>

const TYPE_MAP: Record<string, string> = {
  hospital: 'HOSPITAL',
  clinic: 'CLINIC',
  laboratory: 'LABORATORY',
  pharmacy: 'PHARMACY',
}

export const toFacilityPayload = (
  v: (FacilityCreateValues | FacilityEditValues) & { code?: string },
  includeCode = false,
) => ({
  name: v.name,
  ...(includeCode && v.code ? { code: v.code } : {}),
  facilityType: TYPE_MAP[v.type] || 'HOSPITAL',
  address: v.address,
  city: v.city,
  phone: v.phone,
  email: v.email,
  bedCount: parseInt(v.bedCount, 10) || 0,
})

export const patientSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  dateOfBirth: z.string().min(1, 'La date de naissance est requise'),
  gender: z.enum(GENDERS, 'Le sexe est requis'),
  phone: optionalString,
  address: optionalString,
  bloodType: z.enum(BLOOD_TYPES).optional().or(z.literal('')),
  facilityId: z.string(),
  allergies: z.string(),
})
export type PatientValues = z.infer<typeof patientSchema>

export const toPatientPayload = (v: PatientValues) => ({
  firstname: v.firstName,
  lastname: v.lastName,
  dateOfBirth: v.dateOfBirth,
  sex: v.gender,
  phone: v.phone,
  address: v.address,
  bloodGroup: v.bloodType,
  facilityId: sanitizeUuid(v.facilityId),
  allergies: commaSplit(v.allergies),
})

export const consultationCreateSchema = z.object({
  patientId: uuidField('Le patient est requis'),
  doctorId: uuidField('Le médecin est requis'),
  motif: z.string().min(1, 'Le motif est requis'),
  symptoms: z.string(),
  notes: z.string(),
  provisionalDiagnosis: z.string(),
  status: z.enum(CONSULTATION_STATUSES),
  isFollowUp: z.boolean(),
  facilityId: z.string(),
})

export const consultationEditSchema = z.object({
  motif: z.string().min(1, 'Le motif est requis'),
  notes: z.string(),
  provisionalDiagnosis: z.string(),
  status: z.enum(CONSULTATION_STATUSES),
  doctorId: z.string(),
})

export type ConsultationCreateValues = z.infer<typeof consultationCreateSchema>
export type ConsultationEditValues = z.infer<typeof consultationEditSchema>

export const toConsultationCreatePayload = (v: ConsultationCreateValues) => ({
  patientId: v.patientId,
  doctorId: v.doctorId,
  motif: v.motif,
  symptoms: commaSplit(v.symptoms),
  notes: v.notes || null,
  provisionalDiagnosis: v.provisionalDiagnosis || null,
  status: v.status,
  isFollowUp: v.isFollowUp,
  facilityId: sanitizeUuid(v.facilityId) || null,
})

export const toConsultationEditPayload = (v: ConsultationEditValues) => ({
  motif: v.motif,
  notes: v.notes || null,
  provisionalDiagnosis: v.provisionalDiagnosis || null,
  status: v.status,
  doctorId: sanitizeUuid(v.doctorId) || null,
})

export const queueCreateSchema = z.object({
  patientId: uuidField('Veuillez sélectionner un patient'),
  consultationId: z.string(),
  assignedDoctorId: z.string(),
  priority: z.enum(PRIORITIES),
  estimatedWaitMinutes: z.string(),
  notes: z.string(),
})

export const queueEditSchema = z.object({
  priority: z.enum(PRIORITIES),
  assignedDoctorId: z.string(),
  notes: z.string(),
  status: z.enum(QUEUE_STATUSES),
})

export type QueueCreateValues = z.infer<typeof queueCreateSchema>
export type QueueEditValues = z.infer<typeof queueEditSchema>

export const toQueueCreatePayload = (v: QueueCreateValues) => ({
  patientId: v.patientId,
  consultationId: sanitizeUuid(v.consultationId) || undefined,
  assignedDoctorId: sanitizeUuid(v.assignedDoctorId) || undefined,
  priority: v.priority,
  estimatedWaitMinutes: v.estimatedWaitMinutes ? Number(v.estimatedWaitMinutes) : undefined,
  notes: v.notes || null,
})

export const toQueueEditPayload = (v: QueueEditValues) => ({
  priority: v.priority,
  assignedDoctorId: sanitizeUuid(v.assignedDoctorId) || undefined,
  notes: v.notes || null,
  status: v.status,
})

const vitalSignsSchema = z.object({
  bloodPressureSystolic: z.string(),
  bloodPressureDiastolic: z.string(),
  heartRate: z.string(),
  temperature: z.string(),
  respiratoryRate: z.string(),
  oxygenSaturation: z.string(),
  weight: z.string(),
  height: z.string(),
})

export const triageSchema = z.object({
  vitalSigns: vitalSignsSchema,
  priority: z.enum(PRIORITIES),
  assignedDoctorId: z.string().min(1, 'Le médecin est requis'),
  motif: z.string().min(1, 'Le motif est requis'),
  notes: z.string(),
}).superRefine((v, ctx) => {
  const vs = v.vitalSigns
  if (!vs.bloodPressureSystolic && !vs.heartRate && !vs.temperature) {
    ctx.addIssue({ code: 'custom', path: ['vitalSigns'], message: 'Veuillez saisir au moins les signes vitaux principaux.' })
  }
})
export type TriageValues = z.infer<typeof triageSchema>

export const TREATMENT_STATUSES = ['PRESCRIBED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUSPENDED'] as const

export const treatmentCreateSchema = z.object({
  patientId: uuidField('Le patient est requis'),
  doctorId: uuidField('Le médecin est requis'),
  consultationId: z.string(),
  diagnosisId: z.string(),
  description: z.string().min(1, 'La description est requise'),
  status: z.enum(TREATMENT_STATUSES),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string(),
  notes: z.string(),
  outcome: z.string(),
})

export const treatmentEditSchema = z.object({
  description: z.string().min(1, 'La description est requise'),
  status: z.enum(TREATMENT_STATUSES),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string(),
  outcome: z.string(),
})

export type TreatmentCreateValues = z.infer<typeof treatmentCreateSchema>
export type TreatmentEditValues = z.infer<typeof treatmentEditSchema>

export const toTreatmentPayload = (v: TreatmentCreateValues | TreatmentEditValues) => ({
  patientId: 'patientId' in v ? v.patientId : undefined,
  doctorId: 'doctorId' in v ? v.doctorId : undefined,
  consultationId: 'consultationId' in v ? sanitizeUuid(v.consultationId) || undefined : undefined,
  diagnosisId: 'diagnosisId' in v ? sanitizeUuid(v.diagnosisId) || undefined : undefined,
  description: v.description,
  status: v.status,
  startDate: v.startDate || undefined,
  endDate: v.endDate || null,
  notes: v.notes || null,
  outcome: v.outcome || null,
})

export const LAB_EXAM_STATUSES = ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const

export const labExamSchema = z.object({
  patientId: uuidField('Le patient est requis'),
  categoryId: z.string(),
  examName: z.string().min(1, "Le nom de l'examen est requis"),
  clinicalIndication: z.string(),
  results: z.string(),
})

export const labExamEditSchema = z
  .object({
    categoryId: z.string(),
    labTechnicianId: z.string(),
    examName: z.string().min(1, "Le nom de l'examen est requis"),
    clinicalIndication: z.string(),
    status: z.enum(LAB_EXAM_STATUSES),
    results: z.string(),
    resultNotes: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.status === 'COMPLETED' && !v.results.trim()) {
      ctx.addIssue({ code: 'custom', path: ['results'], message: 'Les résultats sont requis lorsque le statut est "Terminé".' })
    }
  })

export type LabExamValues = z.infer<typeof labExamSchema>
export type LabExamEditValues = z.infer<typeof labExamEditSchema>

export const toLabExamPayload = (v: LabExamValues | LabExamEditValues) => ({
  patientId: 'patientId' in v ? v.patientId : undefined,
  categoryId: sanitizeUuid(v.categoryId) || undefined,
  labTechnicianId: 'labTechnicianId' in v ? sanitizeUuid(v.labTechnicianId) || undefined : undefined,
  examName: v.examName,
  clinicalIndication: v.clinicalIndication || null,
  status: 'status' in v ? v.status : undefined,
  results: safeParseJson(v.results),
  resultNotes: 'resultNotes' in v ? v.resultNotes || null : undefined,
})

export const DIAGNOSTIC_TYPES = ['PROVISIONAL', 'FINAL', 'DIFFERENTIAL'] as const

export const diagnosticSchema = z.object({
  patientId: uuidField('Le patient est requis'),
  doctorId: uuidField('Le médecin est requis'),
  consultationId: uuidField('La consultation est requise'),
  diseaseId: z.string(),
  diagnosticType: z.enum(DIAGNOSTIC_TYPES),
  description: z.string().min(1, 'La description est requise'),
  notes: z.string(),
})

export const diagnosticEditSchema = z.object({
  doctorId: z.string(),
  diseaseId: z.string(),
  diagnosticType: z.enum(DIAGNOSTIC_TYPES),
  description: z.string().min(1, 'La description est requise'),
  notes: z.string(),
})

export type DiagnosticValues = z.infer<typeof diagnosticSchema>
export type DiagnosticEditValues = z.infer<typeof diagnosticEditSchema>

export const toDiagnosticPayload = (v: DiagnosticValues | DiagnosticEditValues) => ({
  patientId: 'patientId' in v ? v.patientId : undefined,
  doctorId: 'doctorId' in v ? sanitizeUuid(v.doctorId) || undefined : undefined,
  consultationId: 'consultationId' in v ? v.consultationId : undefined,
  diseaseId: sanitizeUuid(v.diseaseId) || undefined,
  diagnosticType: v.diagnosticType,
  description: v.description,
  notes: v.notes || null,
})

const documentBase = {
  patientId: z.string().min(1, 'Le patient est requis'),
  doctorId: z.string(),
  consultationId: z.string(),
  documentType: z.enum(DOCUMENT_TYPES, 'Le type de document est requis'),
  title: z.string().trim().min(1, 'Le titre est requis'),
  content: z.string(),
}

export const documentCreateSchema = z.object({
  ...documentBase,
  filePath: z.string(),
})

export const documentEditSchema = z.object({
  ...documentBase,
  isPrinted: z.boolean(),
})

export type DocumentCreateValues = z.infer<typeof documentCreateSchema>
export type DocumentEditValues = z.infer<typeof documentEditSchema>

export const toDocumentPayload = (v: DocumentCreateValues | DocumentEditValues) => ({
  patientId: sanitizeUuid(v.patientId) || undefined,
  doctorId: sanitizeUuid(v.doctorId) || undefined,
  consultationId: v.consultationId && v.consultationId !== 'none' ? sanitizeUuid(v.consultationId) || undefined : undefined,
  documentType: v.documentType,
  title: v.title.trim(),
  content: safeParseJson(v.content),
  filePath: 'filePath' in v && v.filePath ? v.filePath.trim() || null : undefined,
})

export const diseaseSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  name: z.string().min(1, 'Le nom est requis'),
  category: z.string().min(1, 'La catégorie est requise'),
  description: z.string(),
  severity: z.enum(SEVERITY_LEVELS),
  isContagious: z.boolean(),
  symptoms: z.string(),
  complications: z.string(),
  treatments: z.string(),
})
export type DiseaseValues = z.infer<typeof diseaseSchema>

export const toDiseasePayload = (v: DiseaseValues) => ({
  code: v.code,
  name: v.name,
  category: v.category,
  description: v.description || null,
  severity: v.severity,
  isContagious: v.isContagious,
  symptoms: commaSplit(v.symptoms),
  complications: commaSplit(v.complications),
  treatments: commaSplit(v.treatments),
})

export const clinicalCaseSchema = z.object({
  title: z.string().trim().min(1, 'Le titre est requis'),
  description: z.string(),
  patientId: uuidField('Le patient est requis'),
  facilityId: z.string(),
  assignedDoctorId: z.string(),
  priority: z.enum(CASE_PRIORITIES),
  diagnosis: z.string(),
  symptoms: z.string(),
  tags: z.string(),
})
export type ClinicalCaseValues = z.infer<typeof clinicalCaseSchema>

export const toClinicalCasePayload = (v: ClinicalCaseValues) => ({
  title: v.title,
  description: v.description,
  patientId: v.patientId,
  facilityId: sanitizeUuid(v.facilityId),
  doctorId: sanitizeUuid(v.assignedDoctorId),
  provisionalDiagnosis: v.diagnosis,
  symptomsJson: v.symptoms ? { description: v.symptoms } : {},
  tagsJson: v.tags ? { tags: commaSplit(v.tags) } : {},
  priority: v.priority,
})

export const caseNoteSchema = z.object({
  content: z.string().trim().min(1, 'La note est requise'),
})
export type CaseNoteValues = z.infer<typeof caseNoteSchema>

export const archiveSchema = z.object({
  entityType: z.enum(ENTITY_TYPES),
  entityId: uuidField('L\'identifiant de l\'entité est requis'),
  title: z.string().trim().min(1, 'Le titre est requis'),
  patientId: z.string(),
  summary: z.string(),
  data: z.string(),
})
export type ArchiveValues = z.infer<typeof archiveSchema>

export const toArchivePayload = (v: ArchiveValues) => ({
  entityType: v.entityType,
  entityId: v.entityId,
  title: v.title,
  patientId: sanitizeUuid(v.patientId) || null,
  summary: v.summary || null,
  data: safeParseJson(v.data),
})

export const episodeCreateSchema = z.object({
  patientId: z.string().min(1, 'Veuillez sélectionner un patient'),
  admitReason: z.string(),
})
export type EpisodeCreateValues = z.infer<typeof episodeCreateSchema>

export const episodeEditSchema = z.object({
  status: z.enum(EPISODE_STATUSES),
  admitReason: z.string(),
  admitDate: z.string(),
  dischargeDate: z.string(),
})
export type EpisodeEditValues = z.infer<typeof episodeEditSchema>

export const toEpisodeCreatePayload = (v: EpisodeCreateValues) => ({
  patientId: v.patientId,
  admitReason: v.admitReason || null,
  status: 'ADMITTED',
})

export const toEpisodeEditPayload = (v: EpisodeEditValues) => ({
  status: v.status,
  admitReason: v.admitReason || null,
  admitDate: v.admitDate ? new Date(v.admitDate).toISOString() : undefined,
  dischargeDate: v.dischargeDate ? new Date(v.dischargeDate).toISOString() : null,
})

export const admitSchema = z.object({
  patientId: z.string().min(1, 'Veuillez sélectionner un patient'),
  admitReason: z.string().min(1, 'Le motif est requis'),
})
export type AdmitValues = z.infer<typeof admitSchema>

export const dischargeSchema = z.object({
  outcome: z.string().min(1, 'Le résultat de sortie est requis'),
  summary: z.string(),
})
export type DischargeValues = z.infer<typeof dischargeSchema>

export const toDischargePayload = (v: DischargeValues) => ({
  status: 'DISCHARGED',
  dischargeOutcome: v.outcome,
  dischargeSummary: v.summary ? { summary: v.summary } : {},
})

export const protocolSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string(),
  diseaseId: z.string(),
  targetPopulation: z.string(),
})
export type ProtocolValues = z.infer<typeof protocolSchema>

export const toProtocolPayload = (v: ProtocolValues) => ({
  name: v.name,
  description: v.description || null,
  diseaseId: v.diseaseId || null,
  targetPopulation: v.targetPopulation || null,
  steps: [],
  contraindications: [],
  isActive: true,
})

export const settingsSchema = z.object({
  platformName: z.string().min(1, 'Le nom de la plateforme est requis'),
  language: z.string(),
  timezone: z.string(),
  facility: z.string(),
  dateFormat: z.string(),
  emailNotifications: z.boolean(),
  newCaseAlerts: z.boolean(),
  caseUpdateAlerts: z.boolean(),
  reminderAlerts: z.boolean(),
  reportAlerts: z.boolean(),
  emailFrequency: z.string(),
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.number(),
  sidebarHover: z.boolean(),
  compactMode: z.boolean(),
})
export type SettingsValues = z.infer<typeof settingsSchema>

export const profileSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  email: z.email('Adresse email invalide'),
  phone: optionalString,
  department: optionalString,
  prefLanguage: z.string(),
  prefTimezone: z.string(),
  emailNotif: z.boolean(),
  itemsPerPage: z.string(),
})
export type ProfileValues = z.infer<typeof profileSchema>

export const toProfilePayload = (v: ProfileValues) => {
  const { firstname, lastname } = splitName(v.name)
  return {
    firstname,
    lastname,
    email: v.email,
    phone: v.phone,
    department: v.department,
  }
}

export const careCoverageCreateSchema = z.object({
  patientId: z.string().min(1, 'Veuillez sélectionner un patient'),
  coverageType: z.enum(CARE_COVERAGE_TYPES),
  organization: z.string().optional(),
  contractNumber: z.string().optional(),
  coverageRate: z.number().optional(),
  coverageCeiling: z.number().optional(),
  remainingAmount: z.number().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  justification: z.string().optional(),
})
export type CareCoverageCreateValues = z.infer<typeof careCoverageCreateSchema>

export const partnerCompanyCreateSchema = z.object({
  code: z.string().min(1, 'Le code est requis'),
  name: z.string().min(1, 'Le nom est requis'),
  sector: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.email().optional().or(z.literal('')),
  website: z.string().optional(),
  contactName: z.string().optional(),
  contactFunction: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.email().optional().or(z.literal('')),
  contractNumber: z.string().optional(),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  contractStatus: z.enum(COVERAGE_STATUSES).optional(),
  coverageRate: z.number().optional(),
  annualCeiling: z.number().optional(),
  notes: z.string().optional(),
})
export type PartnerCompanyCreateValues = z.infer<typeof partnerCompanyCreateSchema>

export const partnerPatientCreateSchema = z.object({
  partnerId: z.string().min(1, 'Veuillez sélectionner une entreprise'),
  patientId: z.string().min(1, 'Veuillez sélectionner un patient'),
  contractNumber: z.string().optional(),
  coverageRate: z.number().optional(),
  annualCeiling: z.number().optional(),
  remainingAmount: z.number().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  notes: z.string().optional(),
})
export type PartnerPatientCreateValues = z.infer<typeof partnerPatientCreateSchema>

export const patientHistoryCreateSchema = z.object({
  patientId: z.string().min(1, 'Veuillez sélectionner un patient'),
  episodeId: z.string().optional(),
  eventType: z.string().min(1, 'Le type d\'événement est requis'),
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  performedBy: z.string().optional(),
  performedByName: z.string().optional(),
})
export type PatientHistoryCreateValues = z.infer<typeof patientHistoryCreateSchema>

export const notificationPreferenceCreateSchema = z.object({
  userId: z.string().min(1, 'Veuillez sélectionner un utilisateur'),
  soundEnabled: z.boolean().optional(),
  volume: z.number().optional(),
  notificationTypes: z.array(z.string()).optional(),
  services: z.array(z.string()).optional(),
})
export type NotificationPreferenceCreateValues = z.infer<typeof notificationPreferenceCreateSchema>
