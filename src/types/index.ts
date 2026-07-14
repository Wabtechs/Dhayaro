export type UserRole = 'admin' | 'doctor' | 'nurse' | 'researcher' | 'viewer'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  facility?: string
  department?: string
  phone?: string
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
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: 'M' | 'F'
  email?: string
  phone: string
  address: string
  bloodType: string
  allergies: string[]
  facilityId: string
  medicalRecordNumber: string
  isActive: boolean
  createdAt: string
  lastVisit?: string
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

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  link?: string
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
