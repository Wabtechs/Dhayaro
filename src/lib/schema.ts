import { pgTable, text, uuid, boolean, timestamp, jsonb, integer, index, pgEnum } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'DOCTOR', 'RESEARCHER', 'NURSE', 'VIEWER'])
export const facilityTypeEnum = pgEnum('facility_type', ['HOSPITAL', 'CLINIC', 'LABORATORY', 'PHARMACY'])
export const outcomeStatusEnum = pgEnum('outcome_status', ['SUCCESS', 'FAILURE', 'IN_PROGRESS', 'PENDING'])

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

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  firstname: text('firstname').notNull(),
  lastname: text('lastname').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: userRoleEnum('role').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_users_facility').on(t.facilityId),
  index('idx_users_role').on(t.role),
  index('idx_users_email').on(t.email),
])

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  facilityId: uuid('facility_id').references(() => facilities.id),
  patientUuid: text('patient_uuid').notNull().unique(),
  firstname: text('firstname'),
  lastname: text('lastname'),
  sex: text('sex'),
  age: integer('age'),
  bloodGroup: text('blood_group'),
  phone: text('phone'),
  email: text('email'),
  address: text('address'),
  dateOfBirth: text('date_of_birth'),
  allergies: jsonb('allergies').$type<string[]>().default([]),
  medicalHistoryJson: jsonb('medical_history_json').$type<Record<string, unknown>>().default({}),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_patients_facility').on(t.facilityId),
  index('idx_patients_uuid').on(t.patientUuid),
])

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
