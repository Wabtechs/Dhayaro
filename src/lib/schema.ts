import {
  pgTable, text, uuid, boolean, timestamp, jsonb, integer, index,
  pgEnum, date
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