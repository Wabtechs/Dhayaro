export type UserRole = 'super_admin' | 'admin' | 'receptionist' | 'doctor' | 'specialist' | 'laboratory' | 'pharmacist' | 'nurse' | 'accountant' | 'archivist' | 'patient'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  facility?: string
  department?: string
  phone?: string
  specialty?: string
  licenseNumber?: string
  availability?: string
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

export interface Facility {
  id: string
  name: string
  type: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy'
  address: string
  city: string
  phone: string
  email: string
  bedCount: number
  departmentCount: number
  staffCount: number
  isActive: boolean
  createdAt: string
}

export interface Patient {
  id: string
  firstname?: string
  lastname?: string
  firstName?: string
  lastName?: string
  dateOfBirth: string
  sex?: 'M' | 'F' | 'OTHER'
  gender?: 'M' | 'F' | 'OTHER'
  email?: string
  phone: string
  address: string
  city?: string
  photo?: string
  bloodGroup?: string
  bloodType?: string
  medicalRecordNumber?: string
  allergies?: string[]
  antecedents?: { type: string; description: string; date?: string }[]
  emergencyContactName?: string
  emergencyContactPhone?: string
  emergencyContactRelation?: string
  insuranceName?: string
  insuranceNumber?: string
  facilityId: string
  patientUuid?: string
  isActive: boolean
  isArchived?: boolean
  createdAt: string
  lastVisit?: string
  notes?: string
}

export interface Consultation {
  id: string
  facilityId?: string
  patientId: string
  patient?: Patient
  doctorId: string
  doctor?: User
  consultationNumber: string
  motif: string
  symptoms: string[]
  vitalSigns: Record<string, unknown>
  notes?: string
  provisionalDiagnosis?: string
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  isFollowUp?: boolean
  previousConsultationId?: string
  createdAt: string
  updatedAt: string
}

export interface Disease {
  id: string
  code: string
  name: string
  category: string
  description?: string
  symptoms: string[]
  complications: string[]
  treatments: string[]
  isContagious?: boolean
  severity?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Diagnostic {
  id: string
  facilityId?: string
  consultationId: string
  consultation?: Consultation
  patientId: string
  patient?: Patient
  doctorId: string
  doctor?: User
  diseaseId?: string
  disease?: Disease
  diagnosticType: 'PROVISIONAL' | 'FINAL' | 'DIFFERENTIAL'
  description: string
  notes?: string
  isValidated?: boolean
  validatedBy?: string
  validatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Medication {
  id: string
  name: string
  genericName?: string
  category?: string
  form?: string
  dosage?: string
  manufacturer?: string
  sideEffects: string[]
  contraindications: string[]
  isActive: boolean
}

export interface Treatment {
  id: string
  facilityId?: string
  consultationId?: string
  patientId: string
  patient?: Patient
  doctorId: string
  doctor?: User
  diagnosisId?: string
  description: string
  status: 'PRESCRIBED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SUSPENDED'
  startDate: string
  endDate?: string
  notes?: string
  outcome?: string
  prescriptions?: Prescription[]
  createdAt: string
  updatedAt: string
}

export interface Prescription {
  id: string
  treatmentId: string
  medicationId: string
  medication?: Medication
  dosage: string
  frequency: string
  duration: string
  instructions?: string
  quantity?: number
  createdAt: string
}

export interface LabExam {
  id: string
  facilityId?: string
  patientId: string
  patient?: Patient
  doctorId: string
  doctor?: User
  labTechnicianId?: string
  categoryId?: string
  category?: LabCategory
  consultationId?: string
  examName: string
  clinicalIndication?: string
  status: 'REQUESTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  results: Record<string, unknown>
  resultNotes?: string
  validatedBy?: string
  validatedAt?: string
  requestedAt: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export interface LabCategory {
  id: string
  name: string
  description?: string
  isActive: boolean
}

export interface QueueEntry {
  id: string
  facilityId?: string
  patientId: string
  patient?: Patient
  consultationId?: string
  ticketNumber: string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  status: 'WAITING' | 'WITH_DOCTOR' | 'WITH_LAB' | 'WITH_PHARMACY' | 'COMPLETED' | 'CANCELLED'
  assignedDoctorId?: string
  assignedDoctor?: User
  queuePosition?: number
  estimatedWaitMinutes?: number
  arrivedAt: string
  startedAt?: string
  completedAt?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface MedicalDocument {
  id: string
  facilityId?: string
  patientId?: string
  patient?: Patient
  consultationId?: string
  doctorId: string
  doctor?: User
  documentType: 'PRESCRIPTION' | 'CERTIFICATE' | 'REPORT' | 'LAB_RESULT' | 'REFERRAL' | 'ORDONNANCE'
  title: string
  content: Record<string, unknown>
  filePath?: string
  isPrinted?: boolean
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR'
  read: boolean
  createdAt: string
  link?: string
}

export interface Archive {
  id: string
  facilityId?: string
  entityType: string
  entityId: string
  patientId?: string
  title: string
  summary?: string
  archivedBy: string
  data: Record<string, unknown>
  createdAt: string
}

export interface AuditEntry {
  id: string
  userId: string
  user?: User
  action: string
  entity: string
  entityId: string
  details: string
  ipAddress: string
  timestamp: string
}

export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

export interface StatsCard {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease'
  icon: string
  description?: string
}

export interface SearchFilters {
  query: string
  status?: string
  priority?: string
  dateFrom?: string
  dateTo?: string
  facilityId?: string
}

export type CaseStatus = 'draft' | 'active' | 'in_review' | 'resolved' | 'archived'
export type CasePriority = 'low' | 'medium' | 'high' | 'critical'

export interface ClinicalCase {
  id: string
  title: string
  description: string
  status: CaseStatus
  priority: CasePriority
  patientId: string
  patient?: Patient
  facilityId: string
  facility?: Facility
  assignedDoctorId: string
  assignedDoctor?: User
  diagnosis: string
  symptoms: string[]
  treatment?: string
  tags: string[]
  createdAt: string
  updatedAt: string
  resolvedAt?: string
  attachments: Attachment[]
  notes: CaseNote[]
}

export interface CaseNote {
  id: string
  caseId: string
  authorId: string
  author?: User
  content: string
  createdAt: string
}

export interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url: string
  uploadedAt: string
}

export interface SyncLog {
  id: string
  entityType: string
  entityId: string
  action: 'create' | 'update' | 'delete'
  status: 'pending' | 'synced' | 'failed'
  timestamp: string
  errorMessage?: string
}
