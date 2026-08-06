import {
  pgTable, text, uuid, boolean, timestamp, jsonb, integer, index,
  pgEnum, date, uniqueIndex
} from 'drizzle-orm/pg-core'

// ENUMS

export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST',
  'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST', 'PATIENT'
])
export const facilityTypeEnum = pgEnum('facility_type', ['HOSPITAL', 'CLINIC', 'LABORATORY', 'PHARMACY'])
export const genderEnum = pgEnum('gender', ['M', 'F', 'OTHER'])
export const bloodGroupEnum = pgEnum('blood_group', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
export const consultationStatusEnum = pgEnum('consultation_status', ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const diagnosticTypeEnum = pgEnum('diagnostic_type', ['PROVISIONAL', 'FINAL', 'DIFFERENTIAL'])
export const treatmentStatusEnum = pgEnum('treatment_status', ['PRESCRIBED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUSPENDED'])
export const labExamStatusEnum = pgEnum('lab_exam_status', ['REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const queueStatusEnum = pgEnum('queue_status', ['WAITING', 'WITH_DOCTOR', 'WITH_LAB', 'WITH_PHARMACY', 'COMPLETED', 'CANCELLED'])
export const queuePriorityEnum = pgEnum('queue_priority', ['LOW', 'NORMAL', 'HIGH', 'URGENT'])
export const documentTypeEnum = pgEnum('document_type', ['PRESCRIPTION', 'CERTIFICATE', 'REPORT', 'LAB_RESULT', 'REFERRAL', 'ORDONNANCE'])
export const archiveTypeEnum = pgEnum('archive_type', ['CONSULTATION', 'DIAGNOSTIC', 'TREATMENT', 'LAB_EXAM', 'DOCUMENT', 'PATIENT_FILE'])
export const notificationTypeEnum = pgEnum('notification_type', ['INFO', 'WARNING', 'SUCCESS', 'ERROR'])
export const examCategoryEnum = pgEnum('exam_category', ['BIOLOGICAL', 'RADIOLOGY', 'IMAGING', 'ANATOMY', 'CARDIOLOGY', 'OTHER'])
export const outcomeStatusEnum = pgEnum('outcome_status', ['SUCCESS', 'FAILURE', 'IN_PROGRESS', 'PENDING'])
export const episodeStatusEnum = pgEnum('episode_status', ['ADMITTED', 'TRIAGE', 'CONSULTATION', 'TREATMENT', 'HOSPITALIZED', 'DISCHARGED', 'TRANSFERRED', 'ARCHIVED'])
export const episodeEntityTypeEnum = pgEnum('episode_entity_type', ['CONSULTATION', 'DIAGNOSIS', 'TREATMENT', 'LAB_EXAM', 'DOCUMENT'])
export const dischargeOutcomeEnum = pgEnum('discharge_outcome', ['GUERISON', 'AMELIORATION', 'DECES', 'TRANSFERT', 'FUITE'])

// EQUIPMENT & SUPPLIES ENUMS

export const equipmentTypeEnum = pgEnum('equipment_type', ['BIOMEDICAL', 'MEDICAL', 'FURNITURE', 'IT', 'OTHER'])
export const equipmentStatusEnum = pgEnum('equipment_status', ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'RESERVED', 'OUT_OF_SERVICE', 'RETIRED', 'LOST'])
export const equipmentStateEnum = pgEnum('equipment_state', ['NEW', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'])
export const locationTypeEnum = pgEnum('location_type', ['FACILITY', 'BUILDING', 'FLOOR', 'DEPARTMENT', 'ROOM', 'POSITION'])
export const assignmentTypeEnum = pgEnum('assignment_type', ['DOCTOR', 'NURSE', 'TECHNICIAN', 'DEPARTMENT', 'SERVICE', 'OTHER'])
export const maintenanceTypeEnum = pgEnum('maintenance_type', ['PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CALIBRATION', 'VALIDATION', 'REVISION'])
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE'])
export const maintenanceTaskStatusEnum = pgEnum('maintenance_task_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'])
export const incidentStatusEnum = pgEnum('incident_status', ['OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED'])
export const incidentPriorityEnum = pgEnum('incident_priority', ['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL'])
export const bookingStatusEnum = pgEnum('booking_status', ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
export const warrantyStatusEnum = pgEnum('warranty_status', ['ACTIVE', 'EXPIRED', 'CLAIMED'])
export const equipmentDocCategoryEnum = pgEnum('equipment_doc_category', ['INVOICE', 'CONTRACT', 'WARRANTY', 'MANUAL', 'REPORT', 'CERTIFICATE', 'PHOTO', 'OTHER'])
export const supplyCategoryEnum = pgEnum('supply_category', ['GLOVES', 'SYRINGES', 'COMPRESSES', 'MASKS', 'REAGENTS', 'CATHETERS', 'IV_BAGS', 'PERFUSION', 'SUTURES', 'BANDAGES', 'DISINFECTANTS', 'OTHER'])
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['RECEIPT', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN', 'EXPIRED', 'MANUAL'])
export const poStatusEnum = pgEnum('po_status', ['DRAFT', 'SUBMITTED', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED'])
export const equipmentAuditTypeEnum = pgEnum('equipment_audit_type', ['INVENTORY', 'STATUS_CHECK', 'REGULATORY', 'QUALITY', 'SAFETY'])

// FACILITIES

export const facilities = pgTable('facilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: text('code').notNull().unique(),
  facilityType: facilityTypeEnum('facility_type').notNull(),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  email: text('email'),
  bedCount: integer('bed_count').default(0),
  departmentCount: integer('department_count').default(0),
  staffCount: integer('staff_count').default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_facilities_type').on(t.facilityType),
  index('idx_facilities_active').on(t.isActive),
])

// USERS

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  phone: text('phone'),
  specialty: text('specialty'),
  licenseNumber: text('license_number'),
  availability: text('availability'),
  avatar: text('avatar'),
  isActive: boolean('is_active').notNull().default(true),
  lastLogin: timestamp('last_login', { withTimezone: true }),
  preferences: jsonb('preferences').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_users_facility').on(t.facilityId),
  index('idx_users_role').on(t.role),
  index('idx_users_email').on(t.email),
])

// PATIENTS

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  userId: uuid('user_id').references(() => users.id),
  patientUuid: text('patient_uuid').notNull().unique(),
  dossierNumber: text('dossier_number').notNull().unique(),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  sex: genderEnum('sex').notNull(),
  dateOfBirth: date('date_of_birth').notNull(),
  age: integer('age'),
  bloodGroup: bloodGroupEnum('blood_group'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  photo: text('photo'),
  emergencyContactName: text('emergency_contact_name'),
  emergencyContactPhone: text('emergency_contact_phone'),
  emergencyContactRelation: text('emergency_contact_relation'),
  insuranceName: text('insurance_name'),
  insuranceNumber: text('insurance_number'),
  insuranceExpiry: date('insurance_expiry'),
  allergies: jsonb('allergies').$type<string[]>().default([]),
  antecedents: jsonb('antecedents').$type<{ type: string; description: string; date?: string }[]>().default([]),
  medicalHistoryJson: jsonb('medical_history_json').$type<Record<string, unknown>>().default({}),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  isArchived: boolean('is_archived').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_patients_facility').on(t.facilityId),
  index('idx_patients_uuid').on(t.patientUuid),
  index('idx_patients_name').on(t.firstname, t.lastname),
  index('idx_patients_active').on(t.isActive),
])

// CONSULTATIONS

export const consultations = pgTable('consultations', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  doctorId: uuid('doctor_id').references(() => users.id).notNull(),
  consultationNumber: text('consultation_number').notNull().unique(),
  motif: text('motif').notNull(),
  symptoms: jsonb('symptoms').$type<string[]>().default([]),
  vitalSigns: jsonb('vital_signs').$type<Record<string, unknown>>().default({}),
  notes: text('notes'),
  provisionalDiagnosis: text('provisional_diagnosis'),
  status: consultationStatusEnum('status').notNull().default('WAITING'),
  episodeId: uuid('episode_id').references(() => careEpisodes.id),
  isFollowUp: boolean('is_follow_up').default(false),
  previousConsultationId: uuid('previous_consultation_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_consultations_facility').on(t.facilityId),
  index('idx_consultations_patient').on(t.patientId),
  index('idx_consultations_doctor').on(t.doctorId),
  index('idx_consultations_status').on(t.status),
  index('idx_consultations_number').on(t.consultationNumber),
  index('idx_consultations_episode').on(t.episodeId),
])

// DISEASES (CIM-10)

export const diseases = pgTable('diseases', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  description: text('description'),
  symptoms: jsonb('symptoms').$type<string[]>().default([]),
  complications: jsonb('complications').$type<string[]>().default([]),
  treatments: jsonb('treatments').$type<string[]>().default([]),
  isContagious: boolean('is_contagious').default(false),
  severity: text('severity').default('MODERATE'),
  statisticsMetadata: jsonb('statistics_metadata').$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_diseases_code').on(t.code),
  index('idx_diseases_category').on(t.category),
  index('idx_diseases_name').on(t.name),
])

// DIAGNOSTICS

export const diagnostics = pgTable('diagnostics', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  consultationId: uuid('consultation_id').references(() => consultations.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  doctorId: uuid('doctor_id').references(() => users.id).notNull(),
  diseaseId: uuid('disease_id').references(() => diseases.id),
  episodeId: uuid('episode_id').references(() => careEpisodes.id),
  diagnosticType: diagnosticTypeEnum('diagnostic_type').notNull(),
  description: text('description').notNull(),
  notes: text('notes'),
  isValidated: boolean('is_validated').default(false),
  validatedBy: uuid('validated_by').references(() => users.id),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_diagnostics_facility').on(t.facilityId),
  index('idx_diagnostics_consultation').on(t.consultationId),
  index('idx_diagnostics_patient').on(t.patientId),
  index('idx_diagnostics_doctor').on(t.doctorId),
  index('idx_diagnostics_disease').on(t.diseaseId),
  index('idx_diagnostics_episode').on(t.episodeId),
])

// MEDICATIONS

export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  genericName: text('generic_name'),
  category: text('category'),
  form: text('form'),
  dosage: text('dosage'),
  manufacturer: text('manufacturer'),
  sideEffects: jsonb('side_effects').$type<string[]>().default([]),
  contraindications: jsonb('contraindications').$type<string[]>().default([]),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_medications_name').on(t.name),
  index('idx_medications_category').on(t.category),
])

// TREATMENTS

export const treatments = pgTable('treatments', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  consultationId: uuid('consultation_id').references(() => consultations.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  doctorId: uuid('doctor_id').references(() => users.id).notNull(),
  diagnosisId: uuid('diagnosis_id').references(() => diagnostics.id),
  episodeId: uuid('episode_id').references(() => careEpisodes.id),
  description: text('description').notNull(),
  status: treatmentStatusEnum('status').notNull().default('PRESCRIBED'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  notes: text('notes'),
  outcome: text('outcome'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_treatments_facility').on(t.facilityId),
  index('idx_treatments_patient').on(t.patientId),
  index('idx_treatments_doctor').on(t.doctorId),
  index('idx_treatments_status').on(t.status),
  index('idx_treatments_episode').on(t.episodeId),
])

// PRESCRIPTIONS

export const prescriptions = pgTable('prescriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  treatmentId: uuid('treatment_id').references(() => treatments.id).notNull(),
  medicationId: uuid('medication_id').references(() => medications.id).notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  duration: text('duration').notNull(),
  instructions: text('instructions'),
  quantity: integer('quantity'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_prescriptions_treatment').on(t.treatmentId),
  index('idx_prescriptions_medication').on(t.medicationId),
])

// LAB CATEGORIES

export const labCategories = pgTable('lab_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// LAB EXAMS

export const labExams = pgTable('lab_exams', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  doctorId: uuid('doctor_id').references(() => users.id).notNull(),
  labTechnicianId: uuid('lab_technician_id').references(() => users.id),
  categoryId: uuid('category_id').references(() => labCategories.id),
  consultationId: uuid('consultation_id').references(() => consultations.id),
  episodeId: uuid('episode_id').references(() => careEpisodes.id),
  examName: text('exam_name').notNull(),
  clinicalIndication: text('clinical_indication'),
  status: labExamStatusEnum('status').notNull().default('REQUESTED'),
  results: jsonb('results').$type<Record<string, unknown>>().default({}),
  resultNotes: text('result_notes'),
  validatedBy: uuid('validated_by').references(() => users.id),
  validatedAt: timestamp('validated_at', { withTimezone: true }),
  requestedAt: timestamp('requested_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_lab_exams_facility').on(t.facilityId),
  index('idx_lab_exams_patient').on(t.patientId),
  index('idx_lab_exams_doctor').on(t.doctorId),
  index('idx_lab_exams_status').on(t.status),
  index('idx_lab_exams_category').on(t.categoryId),
  index('idx_lab_exams_episode').on(t.episodeId),
])

// QUEUE

export const queue = pgTable('queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  consultationId: uuid('consultation_id').references(() => consultations.id),
  ticketNumber: text('ticket_number').notNull(),
  priority: queuePriorityEnum('priority').notNull().default('NORMAL'),
  status: queueStatusEnum('status').notNull().default('WAITING'),
  assignedDoctorId: uuid('assigned_doctor_id').references(() => users.id),
  queuePosition: integer('queue_position'),
  estimatedWaitMinutes: integer('estimated_wait_minutes'),
  arrivedAt: timestamp('arrived_at', { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_queue_facility').on(t.facilityId),
  index('idx_queue_status').on(t.status),
  index('idx_queue_patient').on(t.patientId),
  index('idx_queue_doctor').on(t.assignedDoctorId),
  index('idx_queue_ticket').on(t.ticketNumber),
])

// DOCUMENTS

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id),
  consultationId: uuid('consultation_id').references(() => consultations.id),
  doctorId: uuid('doctor_id').references(() => users.id).notNull(),
  episodeId: uuid('episode_id').references(() => careEpisodes.id),
  documentType: documentTypeEnum('document_type').notNull(),
  title: text('title').notNull(),
  content: jsonb('content').$type<Record<string, unknown>>().default({}),
  filePath: text('file_path'),
  isActive: boolean('is_active').notNull().default(true),
  isPrinted: boolean('is_printed').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_documents_facility').on(t.facilityId),
  index('idx_documents_patient').on(t.patientId),
  index('idx_documents_type').on(t.documentType),
  index('idx_documents_episode').on(t.episodeId),
])

// NOTIFICATIONS

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').notNull().default('INFO'),
  isRead: boolean('is_read').notNull().default(false),
  link: text('link'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_notifications_user').on(t.userId),
  index('idx_notifications_read').on(t.isRead),
  index('idx_notifications_facility').on(t.facilityId),
])

// AUDIT LOGS

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  facilityId: uuid('facility_id').references(() => facilities.id),
  action: text('action').notNull(),
  resource: text('resource'),
  resourceId: text('resource_id'),
  details: jsonb('details').$type<Record<string, unknown>>().default({}),
  ipAddress: text('ip_address'),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_audit_user').on(t.userId),
  index('idx_audit_facility').on(t.facilityId),
  index('idx_audit_resource').on(t.resource),
  index('idx_audit_timestamp').on(t.timestamp),
])

// ARCHIVES

export const archives = pgTable('archives', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  entityType: archiveTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  patientId: uuid('patient_id').references(() => patients.id),
  title: text('title').notNull(),
  summary: text('summary'),
  archivedBy: uuid('archived_by').references(() => users.id).notNull(),
  data: jsonb('data').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_archives_facility').on(t.facilityId),
  index('idx_archives_entity').on(t.entityType),
  index('idx_archives_patient').on(t.patientId),
])

// SYNC QUEUE

export const syncQueue = pgTable('sync_queue', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  payload: jsonb('payload').$type<Record<string, unknown>>().default({}),
  status: text('status').default('pending'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp('synced_at', { withTimezone: true }),
}, (t) => [
  index('idx_sync_user').on(t.userId),
  index('idx_sync_status').on(t.status),
])

// CARE EPISODES

export const careEpisodes = pgTable('care_episodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  episodeNumber: text('episode_number').notNull().unique(),
  status: episodeStatusEnum('status').notNull().default('ADMITTED'),
  admitDate: timestamp('admit_date', { withTimezone: true }).notNull().defaultNow(),
  dischargeDate: timestamp('discharge_date', { withTimezone: true }),
  admitReason: text('admit_reason'),
  dischargeSummary: jsonb('discharge_summary').$type<Record<string, unknown>>().default({}),
  dischargeOutcome: dischargeOutcomeEnum('discharge_outcome'),
  isArchived: boolean('is_archived').notNull().default(false),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_care_episodes_facility').on(t.facilityId),
  index('idx_care_episodes_patient').on(t.patientId),
  index('idx_care_episodes_status').on(t.status),
  index('idx_care_episodes_number').on(t.episodeNumber),
])

// EPISODE ENTITIES (polymorphic join)

export const episodeEntities = pgTable('episode_entities', {
  id: uuid('id').primaryKey().defaultRandom(),
  episodeId: uuid('episode_id').references(() => careEpisodes.id).notNull(),
  entityType: episodeEntityTypeEnum('entity_type').notNull(),
  entityId: uuid('entity_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_episode_entities_episode').on(t.episodeId),
  index('idx_episode_entities_type').on(t.entityType),
])

// CLINICAL KNOWLEDGE BASE (anonymized cases)

export const clinicalKnowledgeBase = pgTable('clinical_knowledge_base', {
  id: uuid('id').primaryKey().defaultRandom(),
  sourceEpisodeId: uuid('source_episode_id'),
  ageRange: text('age_range'),
  sex: genderEnum('sex'),
  symptoms: jsonb('symptoms').$type<string[]>().default([]),
  diagnostics: jsonb('diagnostics').$type<string[]>().default([]),
  treatments: jsonb('treatments').$type<string[]>().default([]),
  examResults: jsonb('exam_results').$type<Record<string, unknown>>().default({}),
  evolution: text('evolution'),
  durationDays: integer('duration_days'),
  outcome: text('outcome'),
  diseaseId: uuid('disease_id').references(() => diseases.id),
  facilityId: uuid('facility_id').references(() => facilities.id),
  isAnonymized: boolean('is_anonymized').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_knowledge_base_disease').on(t.diseaseId),
  index('idx_knowledge_base_facility').on(t.facilityId),
  index('idx_knowledge_base_sex').on(t.sex),
])

// DISEASE STATISTICS (pre-computed)

export const diseaseStatistics = pgTable('disease_statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  diseaseId: uuid('disease_id').references(() => diseases.id).notNull().unique(),
  totalCases: integer('total_cases').default(0),
  recoveryRate: integer('recovery_rate').default(0),
  mortalityRate: integer('mortality_rate').default(0),
  avgHospitalizationDays: integer('avg_hospitalization_days').default(0),
  commonTreatments: jsonb('common_treatments').$type<{ name: string; count: number }[]>().default([]),
  commonMedications: jsonb('common_medications').$type<{ name: string; count: number }[]>().default([]),
  commonExams: jsonb('common_exams').$type<{ name: string; count: number }[]>().default([]),
  commonComplications: jsonb('common_complications').$type<{ name: string; count: number }[]>().default([]),
  lastCalculated: timestamp('last_calculated', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_disease_statistics_disease').on(t.diseaseId),
])

// THERAPEUTIC PROTOCOLS

export const therapeuticProtocols = pgTable('therapeutic_protocols', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  diseaseId: uuid('disease_id').references(() => diseases.id),
  name: text('name').notNull(),
  description: text('description'),
  steps: jsonb('steps').$type<{ order: number; description: string; duration?: string; medication?: string; dosage?: string }[]>().default([]),
  targetPopulation: text('target_population'),
  contraindications: jsonb('contraindications').$type<string[]>().default([]),
  efficacyRate: integer('efficacy_rate'),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_therapeutic_protocols_facility').on(t.facilityId),
  index('idx_therapeutic_protocols_disease').on(t.diseaseId),
  index('idx_therapeutic_protocols_active').on(t.isActive),
])

// SIMILAR CASE SEARCHES (cache)

export const similarCaseSearches = pgTable('similar_case_searches', {
  id: uuid('id').primaryKey().defaultRandom(),
  diagnosticId: uuid('diagnostic_id').references(() => diagnostics.id),
  querySymptoms: jsonb('query_symptoms').$type<string[]>().default([]),
  queryDiseaseId: uuid('query_disease_id').references(() => diseases.id),
  results: jsonb('results').$type<{ caseId: string; similarity: number; treatment: string; outcome: string }[]>().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_similar_case_searches_diagnostic').on(t.diagnosticId),
  index('idx_similar_case_searches_disease').on(t.queryDiseaseId),
])

// CARE COVERAGE (Prises en charge)

export const careCoverageTypes = pgEnum('care_coverage_type', ['PERSONAL', 'INSURANCE', 'MUTUAL', 'COMPANY', 'NGO', 'GOVERNMENT', 'HEALTH_PROJECT', 'PARTNER', 'FREE', 'OTHER'])
export const coverageStatusEnum = pgEnum('coverage_status', ['ACTIVE', 'EXPIRED', 'SUSPENDED'])

export const careCoverages = pgTable('care_coverages', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  coverageType: careCoverageTypes('coverage_type').notNull(),
  organization: text('organization'),
  contractNumber: text('contract_number'),
  coverageRate: integer('coverage_rate'),
  coverageCeiling: integer('coverage_ceiling'),
  remainingAmount: integer('remaining_amount'),
  validFrom: date('valid_from'),
  validUntil: date('valid_until'),
  status: coverageStatusEnum('status').notNull().default('ACTIVE'),
  justification: text('justification'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_care_coverage_facility').on(t.facilityId),
  index('idx_care_coverage_patient').on(t.patientId),
  index('idx_care_coverage_type').on(t.coverageType),
  index('idx_care_coverage_status').on(t.status),
])

// PARTNER COMPANIES (Entreprises partenaires)

export const partnerCompanies = pgTable('partner_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  sector: text('sector'),
  address: text('address'),
  city: text('city'),
  country: text('country').default('RD Congo'),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  contactName: text('contact_name'),
  contactFunction: text('contact_function'),
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  contractNumber: text('contract_number'),
  contractStartDate: date('contract_start_date'),
  contractEndDate: date('contract_end_date'),
  contractStatus: coverageStatusEnum('contract_status').notNull().default('ACTIVE'),
  coverageRate: integer('coverage_rate'),
  annualCeiling: integer('annual_ceiling'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_partner_facility').on(t.facilityId),
  index('idx_partner_code').on(t.code),
  index('idx_partner_name').on(t.name),
  index('idx_partner_status').on(t.contractStatus),
])

// PARTNER PATIENTS (Patients affiliated with partners)

export const partnerPatients = pgTable('partner_patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  partnerId: uuid('partner_id').references(() => partnerCompanies.id).notNull(),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  contractNumber: text('contract_number'),
  coverageRate: integer('coverage_rate'),
  annualCeiling: integer('annual_ceiling'),
  remainingAmount: integer('remaining_amount'),
  validFrom: date('valid_from'),
  validUntil: date('valid_until'),
  status: coverageStatusEnum('status').notNull().default('ACTIVE'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_partner_patient_facility').on(t.facilityId),
  index('idx_partner_patient_partner').on(t.partnerId),
  index('idx_partner_patient_patient').on(t.patientId),
  index('idx_partner_patient_status').on(t.status),
])

// PATIENT HISTORY (Clinical event tracking)

export const patientHistory = pgTable('patient_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id).notNull(),
  episodeId: uuid('episode_id').references(() => careEpisodes.id),
  eventType: text('event_type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  performedBy: uuid('performed_by').references(() => users.id),
  performedByName: text('performed_by_name'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_patient_history_facility').on(t.facilityId),
  index('idx_patient_history_patient').on(t.patientId),
  index('idx_patient_history_episode').on(t.episodeId),
  index('idx_patient_history_type').on(t.eventType),
  index('idx_patient_history_created').on(t.createdAt),
])

// NOTIFICATION PREFERENCES

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  soundEnabled: boolean('sound_enabled').notNull().default(true),
  volume: integer('volume').notNull().default(50),
  notificationTypes: jsonb('notification_types').$type<string[]>().default(['INFO', 'WARNING', 'SUCCESS', 'ERROR']),
  services: jsonb('services').$type<string[]>().default(['LABORATORY', 'PHARMACY', 'IMAGERY', 'HOSPITALIZATION', 'RECEPTION', 'ADMINISTRATION']),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_notif_prefs_user').on(t.userId),
])

// LEGACY clinical_cases table (kept for backward compatibility)
export const clinicalCases = pgTable('clinical_cases', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientId: uuid('patient_id').references(() => patients.id),
  doctorId: uuid('doctor_id').references(() => users.id),
  title: text('title'),
  description: text('description'),
  symptomsJson: jsonb('symptoms_json').$type<{ description?: string }>().default({}),
  provisionalDiagnosis: text('provisional_diagnosis'),
  treatment: text('treatment'),
  treatmentDuration: text('treatment_duration'),
  outcomeStatus: outcomeStatusEnum('outcome_status').default('PENDING'),
  outcomeNotes: text('outcome_notes'),
  priority: text('priority').default('medium'),
  tagsJson: jsonb('tags_json').$type<{ tags?: string[] }>().default({}),
  isSynced: boolean('is_synced').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_cases_facility').on(t.facilityId),
  index('idx_cases_patient').on(t.patientId),
  index('idx_cases_doctor').on(t.doctorId),
  index('idx_cases_status').on(t.outcomeStatus),
])

export const caseNotes = pgTable('case_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  caseId: uuid('case_id').notNull().references(() => clinicalCases.id, { onDelete: 'cascade' }),
  authorId: uuid('author_id').references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_case_notes_case').on(t.caseId),
  index('idx_case_notes_author').on(t.authorId),
])

// HELP IMAGES (for /docs and /help guide sections)

export const helpImages = pgTable('help_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  location: text('location').notNull().unique(),
  imageData: text('image_data'),
  altText: text('alt_text'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
})

// AUDIT HISTORY (overrides + dev journal for /audit-fonc page)

export const auditHistory = pgTable('audit_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: text('item_id').notNull(),
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  note: text('note'),
  changedBy: uuid('changed_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_audit_history_item').on(t.itemId),
  index('idx_audit_history_created').on(t.createdAt),
])

// ============================================================
// EQUIPMENT & SUPPLIES MODULE
// ============================================================

const equipmentAuditColumns = {
  organizationId: uuid('organization_id'),
  createdBy: uuid('created_by').references(() => users.id),
  updatedBy: uuid('updated_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}

// 1. EQUIPMENT CATEGORIES (hierarchical, infinite nesting)

export const equipmentCategories = pgTable('equipment_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  parentId: uuid('parent_id').references((): any => equipmentCategories.id),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_cats_facility').on(t.facilityId),
  index('idx_equip_cats_parent').on(t.parentId),
  index('idx_equip_cats_name').on(t.name),
])

// 2. MEDICAL EQUIPMENT

export const medicalEquipment = pgTable('medical_equipment', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  code: text('code').notNull().unique(),
  qrCode: text('qr_code'),
  barcode: text('barcode'),
  name: text('name').notNull(),
  description: text('description'),
  type: equipmentTypeEnum('type').notNull().default('BIOMEDICAL'),
  categoryId: uuid('category_id').references(() => equipmentCategories.id),
  subCategoryId: uuid('sub_category_id').references(() => equipmentCategories.id),
  manufacturer: text('manufacturer'),
  brand: text('brand'),
  model: text('model'),
  serialNumber: text('serial_number'),
  purchaseDate: date('purchase_date'),
  purchasePrice: integer('purchase_price'),
  currency: text('currency').default('CDF'),
  warrantyMonths: integer('warranty_months'),
  lifecycleYears: integer('lifecycle_years'),
  state: equipmentStateEnum('state').notNull().default('NEW'),
  status: equipmentStatusEnum('status').notNull().default('AVAILABLE'),
  photo: text('photo'),
  responsibleUserId: uuid('responsible_user_id').references(() => users.id),
  locationId: uuid('location_id').references(() => equipmentLocations.id),
  building: text('building'),
  floor: text('floor'),
  department: text('department'),
  room: text('room'),
  position: text('position'),
  commissioningDate: date('commissioning_date'),
  retirementDate: date('retirement_date'),
  comments: text('comments'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_med_equip_facility').on(t.facilityId),
  index('idx_med_equip_category').on(t.categoryId),
  index('idx_med_equip_status').on(t.status),
  index('idx_med_equip_state').on(t.state),
  index('idx_med_equip_type').on(t.type),
  index('idx_med_equip_serial').on(t.serialNumber),
  index('idx_med_equip_name').on(t.name),
])

// 3. EQUIPMENT LOCATIONS (hierarchy: FACILITY > BUILDING > FLOOR > DEPARTMENT > ROOM > POSITION)

export const equipmentLocations = pgTable('equipment_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  parentId: uuid('parent_id').references((): any => equipmentLocations.id),
  type: locationTypeEnum('type').notNull().default('FACILITY'),
  name: text('name').notNull(),
  building: text('building'),
  floor: text('floor'),
  department: text('department'),
  room: text('room'),
  position: text('position'),
  code: text('code'),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_loc_facility').on(t.facilityId),
  index('idx_equip_loc_parent').on(t.parentId),
  index('idx_equip_loc_type').on(t.type),
  index('idx_equip_loc_name').on(t.name),
])

// 4. EQUIPMENT ASSIGNMENTS (historized)

export const equipmentAssignments = pgTable('equipment_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  assignedToType: assignmentTypeEnum('assigned_to_type').notNull().default('DEPARTMENT'),
  assignedToId: uuid('assigned_to_id'),
  assignedToName: text('assigned_to_name'),
  department: text('department'),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  notes: text('notes'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_assign_equipment').on(t.equipmentId),
  index('idx_equip_assign_type').on(t.assignedToType),
  index('idx_equip_assign_facility').on(t.facilityId),
  index('idx_equip_assign_dates').on(t.startedAt, t.endedAt),
])

// 5. EQUIPMENT DOCUMENTS (versioned uploads)

export const equipmentDocuments = pgTable('equipment_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  title: text('title').notNull(),
  category: equipmentDocCategoryEnum('category').notNull().default('OTHER'),
  filePath: text('file_path'),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  version: integer('version').notNull().default(1),
  description: text('description'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_docs_equipment').on(t.equipmentId),
  index('idx_equip_docs_category').on(t.category),
  index('idx_equip_docs_facility').on(t.facilityId),
])

// 6. EQUIPMENT MAINTENANCE

export const equipmentMaintenance = pgTable('equipment_maintenance', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  maintenanceType: maintenanceTypeEnum('maintenance_type').notNull(),
  status: maintenanceStatusEnum('status').notNull().default('SCHEDULED'),
  scheduledDate: date('scheduled_date'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  technicianUserId: uuid('technician_user_id').references(() => users.id),
  technicianName: text('technician_name'),
  company: text('company'),
  cost: integer('cost'),
  currency: text('currency').default('CDF'),
  durationHours: integer('duration_hours'),
  priority: incidentPriorityEnum('priority').notNull().default('MEDIUM'),
  report: text('report'),
  photos: jsonb('photos').$type<string[]>().default([]),
  partsReplaced: jsonb('parts_replaced').$type<{ name: string; quantity: number; cost?: number }[]>().default([]),
  signature: text('signature'),
  notes: text('notes'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_maint_equipment').on(t.equipmentId),
  index('idx_equip_maint_type').on(t.maintenanceType),
  index('idx_equip_maint_status').on(t.status),
  index('idx_equip_maint_date').on(t.scheduledDate),
  index('idx_equip_maint_facility').on(t.facilityId),
])

// 7. MAINTENANCE TASKS

export const maintenanceTasks = pgTable('maintenance_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  maintenanceId: uuid('maintenance_id').references(() => equipmentMaintenance.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: maintenanceTaskStatusEnum('status').notNull().default('PENDING'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  completedBy: uuid('completed_by').references(() => users.id),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_maint_tasks_maintenance').on(t.maintenanceId),
  index('idx_maint_tasks_status').on(t.status),
])

// 8. EQUIPMENT INCIDENTS (breakdowns / kanban workflow)

export const equipmentIncidents = pgTable('equipment_incidents', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  priority: incidentPriorityEnum('priority').notNull().default('MEDIUM'),
  status: incidentStatusEnum('status').notNull().default('OPEN'),
  reportedByUserId: uuid('reported_by_user_id').references(() => users.id),
  assignedToUserId: uuid('assigned_to_user_id').references(() => users.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  resolutionNotes: text('resolution_notes'),
  rootCause: text('root_cause'),
  cost: integer('cost'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_inc_equipment').on(t.equipmentId),
  index('idx_equip_inc_status').on(t.status),
  index('idx_equip_inc_priority').on(t.priority),
  index('idx_equip_inc_facility').on(t.facilityId),
])

// 9. EQUIPMENT LOGS (history / movements)

export const equipmentLogs = pgTable('equipment_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  action: text('action').notNull(),
  details: jsonb('details').$type<Record<string, unknown>>().default({}),
  userId: uuid('user_id').references(() => users.id),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_logs_equipment').on(t.equipmentId),
  index('idx_equip_logs_action').on(t.action),
  index('idx_equip_logs_facility').on(t.facilityId),
])

// 10. EQUIPMENT WARRANTIES

export const equipmentWarranties = pgTable('equipment_warranties', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  supplierId: uuid('supplier_id').references(() => equipmentSuppliers.id),
  startDate: date('start_date'),
  endDate: date('end_date').notNull(),
  status: warrantyStatusEnum('status').notNull().default('ACTIVE'),
  coverage: text('coverage'),
  terms: text('terms'),
  cost: integer('cost'),
  notes: text('notes'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_warr_equipment').on(t.equipmentId),
  index('idx_equip_warr_status').on(t.status),
  index('idx_equip_warr_end').on(t.endDate),
  index('idx_equip_warr_facility').on(t.facilityId),
])

// 11. EQUIPMENT BOOKINGS / RESERVATIONS

export const equipmentBookings = pgTable('equipment_bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  bookedByUserId: uuid('booked_by_user_id').references(() => users.id),
  assignedToName: text('assigned_to_name'),
  assignedToId: uuid('assigned_to_id'),
  purpose: text('purpose').notNull(),
  startTime: timestamp('start_time', { withTimezone: true }).notNull(),
  endTime: timestamp('end_time', { withTimezone: true }).notNull(),
  status: bookingStatusEnum('status').notNull().default('PENDING'),
  notes: text('notes'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_book_equipment').on(t.equipmentId),
  index('idx_equip_book_status').on(t.status),
  index('idx_equip_book_time').on(t.startTime, t.endTime),
  index('idx_equip_book_facility').on(t.facilityId),
])

// 12. EQUIPMENT SUPPLIERS

export const equipmentSuppliers = pgTable('equipment_suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  contactPerson: text('contact_person'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  city: text('city'),
  category: text('category'),
  rating: integer('rating').default(3),
  isActive: boolean('is_active').notNull().default(true),
  notes: text('notes'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_supp_facility').on(t.facilityId),
  index('idx_equip_supp_name').on(t.name),
  index('idx_equip_supp_code').on(t.code),
])

// 13. EQUIPMENT AUDITS (inventory / regulatory inspections)

export const equipmentAudits = pgTable('equipment_audits', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id).notNull(),
  auditType: equipmentAuditTypeEnum('audit_type').notNull().default('STATUS_CHECK'),
  auditedByUserId: uuid('audited_by_user_id').references(() => users.id),
  auditDate: date('audit_date').notNull(),
  status: equipmentStateEnum('status').notNull().default('GOOD'),
  findings: jsonb('findings').$type<{ label: string; result: string; note?: string }[]>().default([]),
  nextAuditDate: date('next_audit_date'),
  notes: text('notes'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_equip_audits_equipment').on(t.equipmentId),
  index('idx_equip_audits_date').on(t.auditDate),
  index('idx_equip_audits_facility').on(t.facilityId),
])

// 14. SPARE PARTS

export const spareParts = pgTable('spare_parts', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  code: text('code'),
  sku: text('sku'),
  name: text('name').notNull(),
  categoryId: uuid('category_id').references(() => equipmentCategories.id),
  description: text('description'),
  unit: text('unit').default('piece'),
  manufacturer: text('manufacturer'),
  supplierId: uuid('supplier_id').references(() => equipmentSuppliers.id),
  isActive: boolean('is_active').notNull().default(true),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_spare_parts_facility').on(t.facilityId),
  index('idx_spare_parts_name').on(t.name),
  index('idx_spare_parts_sku').on(t.sku),
])

// 15. SPARE PART INVENTORY

export const sparePartInventory = pgTable('spare_part_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  sparePartId: uuid('spare_part_id').references(() => spareParts.id).notNull(),
  location: text('location').default('MAIN'),
  quantity: integer('quantity').notNull().default(0),
  minThreshold: integer('min_threshold').notNull().default(0),
  unitCost: integer('unit_cost'),
  currency: text('currency').default('CDF'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_spare_inv_part').on(t.sparePartId),
  index('idx_spare_inv_location').on(t.location),
  index('idx_spare_inv_facility').on(t.facilityId),
])

// 16. MEDICAL SUPPLIES (consumables)

export const medicalSupplies = pgTable('medical_supplies', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  name: text('name').notNull(),
  code: text('code'),
  sku: text('sku'),
  category: supplyCategoryEnum('category').notNull().default('OTHER'),
  description: text('description'),
  unit: text('unit').default('piece'),
  minStock: integer('min_stock').notNull().default(0),
  criticalStock: integer('critical_stock').notNull().default(0),
  price: integer('price'),
  currency: text('currency').default('CDF'),
  supplierId: uuid('supplier_id').references(() => equipmentSuppliers.id),
  isActive: boolean('is_active').notNull().default(true),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_med_supplies_facility').on(t.facilityId),
  index('idx_med_supplies_name').on(t.name),
  index('idx_med_supplies_sku').on(t.sku),
  index('idx_med_supplies_category').on(t.category),
])

// 17. SUPPLY BATCHES (lots with expiry, FEFO/FIFO)

export const supplyBatches = pgTable('supply_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  supplyId: uuid('supply_id').references(() => medicalSupplies.id).notNull(),
  batchNumber: text('batch_number'),
  lotNumber: text('lot_number'),
  manufacturerDate: date('manufacturer_date'),
  expiryDate: date('expiry_date'),
  quantity: integer('quantity').notNull().default(0),
  receivedDate: date('received_date'),
  supplierId: uuid('supplier_id').references(() => equipmentSuppliers.id),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_supply_batches_supply').on(t.supplyId),
  index('idx_supply_batches_expiry').on(t.expiryDate),
  index('idx_supply_batches_facility').on(t.facilityId),
  index('idx_supply_batches_lot').on(t.lotNumber),
])

// 18. STOCK MOVEMENTS

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  supplyId: uuid('supply_id').references(() => medicalSupplies.id).notNull(),
  batchId: uuid('batch_id').references(() => supplyBatches.id),
  movementType: stockMovementTypeEnum('movement_type').notNull(),
  quantity: integer('quantity').notNull(),
  unitCost: integer('unit_cost'),
  fromLocation: text('from_location'),
  toLocation: text('to_location'),
  reason: text('reason'),
  referenceId: text('reference_id'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_stock_mov_supply').on(t.supplyId),
  index('idx_stock_mov_type').on(t.movementType),
  index('idx_stock_mov_batch').on(t.batchId),
  index('idx_stock_mov_facility').on(t.facilityId),
  index('idx_stock_mov_created').on(t.createdAt),
])

// 19. PURCHASE ORDERS

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  orderNumber: text('order_number').notNull().unique(),
  supplierId: uuid('supplier_id').references(() => equipmentSuppliers.id),
  orderDate: date('order_date').notNull(),
  expectedDate: date('expected_date'),
  receivedDate: date('received_date'),
  status: poStatusEnum('status').notNull().default('DRAFT'),
  totalAmount: integer('total_amount'),
  currency: text('currency').default('CDF'),
  notes: text('notes'),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_po_facility').on(t.facilityId),
  index('idx_po_supplier').on(t.supplierId),
  index('idx_po_status').on(t.status),
  index('idx_po_order_number').on(t.orderNumber),
])

// 20. PURCHASE ORDER ITEMS

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  orderId: uuid('order_id').references(() => purchaseOrders.id).notNull(),
  itemType: text('item_type').notNull().default('supply'),
  supplyId: uuid('supply_id').references(() => medicalSupplies.id),
  sparePartId: uuid('spare_part_id').references(() => spareParts.id),
  equipmentId: uuid('equipment_id').references(() => medicalEquipment.id),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull().default(0),
  totalPrice: integer('total_price').notNull().default(0),
  receivedQuantity: integer('received_quantity').notNull().default(0),
  ...equipmentAuditColumns,
}, (t) => [
  index('idx_po_items_order').on(t.orderId),
  index('idx_po_items_supply').on(t.supplyId),
  index('idx_po_items_facility').on(t.facilityId),
])