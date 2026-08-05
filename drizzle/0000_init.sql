CREATE TYPE "public"."archive_type" AS ENUM('CONSULTATION', 'DIAGNOSTIC', 'TREATMENT', 'LAB_EXAM', 'DOCUMENT', 'PATIENT_FILE');--> statement-breakpoint
CREATE TYPE "public"."assignment_type" AS ENUM('DOCTOR', 'NURSE', 'TECHNICIAN', 'DEPARTMENT', 'SERVICE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."blood_group" AS ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."care_coverage_type" AS ENUM('PERSONAL', 'INSURANCE', 'MUTUAL', 'COMPANY', 'NGO', 'GOVERNMENT', 'HEALTH_PROJECT', 'PARTNER', 'FREE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."consultation_status" AS ENUM('WAITING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."coverage_status" AS ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."diagnostic_type" AS ENUM('PROVISIONAL', 'FINAL', 'DIFFERENTIAL');--> statement-breakpoint
CREATE TYPE "public"."discharge_outcome" AS ENUM('GUERISON', 'AMELIORATION', 'DECES', 'TRANSFERT', 'FUITE');--> statement-breakpoint
CREATE TYPE "public"."document_type" AS ENUM('PRESCRIPTION', 'CERTIFICATE', 'REPORT', 'LAB_RESULT', 'REFERRAL', 'ORDONNANCE');--> statement-breakpoint
CREATE TYPE "public"."episode_entity_type" AS ENUM('CONSULTATION', 'DIAGNOSIS', 'TREATMENT', 'LAB_EXAM', 'DOCUMENT');--> statement-breakpoint
CREATE TYPE "public"."episode_status" AS ENUM('ADMITTED', 'TRIAGE', 'CONSULTATION', 'TREATMENT', 'HOSPITALIZED', 'DISCHARGED', 'TRANSFERRED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."equipment_audit_type" AS ENUM('INVENTORY', 'STATUS_CHECK', 'REGULATORY', 'QUALITY', 'SAFETY');--> statement-breakpoint
CREATE TYPE "public"."equipment_doc_category" AS ENUM('INVOICE', 'CONTRACT', 'WARRANTY', 'MANUAL', 'REPORT', 'CERTIFICATE', 'PHOTO', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."equipment_state" AS ENUM('NEW', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."equipment_status" AS ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN', 'RESERVED', 'OUT_OF_SERVICE', 'RETIRED', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."equipment_type" AS ENUM('BIOMEDICAL', 'MEDICAL', 'FURNITURE', 'IT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."exam_category" AS ENUM('BIOLOGICAL', 'RADIOLOGY', 'IMAGING', 'ANATOMY', 'CARDIOLOGY', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."facility_type" AS ENUM('HOSPITAL', 'CLINIC', 'LABORATORY', 'PHARMACY');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('M', 'F', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."incident_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('OPEN', 'IN_PROGRESS', 'ON_HOLD', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."lab_exam_status" AS ENUM('REQUESTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."location_type" AS ENUM('FACILITY', 'BUILDING', 'FLOOR', 'DEPARTMENT', 'ROOM', 'POSITION');--> statement-breakpoint
CREATE TYPE "public"."maintenance_status" AS ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."maintenance_task_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."maintenance_type" AS ENUM('PREVENTIVE', 'CORRECTIVE', 'INSPECTION', 'CALIBRATION', 'VALIDATION', 'REVISION');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('INFO', 'WARNING', 'SUCCESS', 'ERROR');--> statement-breakpoint
CREATE TYPE "public"."outcome_status" AS ENUM('SUCCESS', 'FAILURE', 'IN_PROGRESS', 'PENDING');--> statement-breakpoint
CREATE TYPE "public"."po_status" AS ENUM('DRAFT', 'SUBMITTED', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."queue_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."queue_status" AS ENUM('WAITING', 'WITH_DOCTOR', 'WITH_LAB', 'WITH_PHARMACY', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('RECEIPT', 'ISSUE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'RETURN', 'EXPIRED', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."supply_category" AS ENUM('GLOVES', 'SYRINGES', 'COMPRESSES', 'MASKS', 'REAGENTS', 'CATHETERS', 'IV_BAGS', 'PERFUSION', 'SUTURES', 'BANDAGES', 'DISINFECTANTS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."treatment_status" AS ENUM('PRESCRIBED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'SUSPENDED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'DOCTOR', 'SPECIALIST', 'LABORATORY', 'PHARMACIST', 'NURSE', 'ACCOUNTANT', 'ARCHIVIST', 'PATIENT');--> statement-breakpoint
CREATE TYPE "public"."warranty_status" AS ENUM('ACTIVE', 'EXPIRED', 'CLAIMED');--> statement-breakpoint
CREATE TABLE "archives" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"entity_type" "archive_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"patient_id" uuid,
	"title" text NOT NULL,
	"summary" text,
	"archived_by" uuid NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" text NOT NULL,
	"previous_status" text,
	"new_status" text NOT NULL,
	"note" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"facility_id" uuid,
	"action" text NOT NULL,
	"resource" text,
	"resource_id" text,
	"details" jsonb DEFAULT '{}'::jsonb,
	"ip_address" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_coverages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"coverage_type" "care_coverage_type" NOT NULL,
	"organization" text,
	"contract_number" text,
	"coverage_rate" integer,
	"coverage_ceiling" integer,
	"remaining_amount" integer,
	"valid_from" date,
	"valid_until" date,
	"status" "coverage_status" DEFAULT 'ACTIVE' NOT NULL,
	"justification" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_episodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"episode_number" text NOT NULL,
	"status" "episode_status" DEFAULT 'ADMITTED' NOT NULL,
	"admit_date" timestamp with time zone DEFAULT now() NOT NULL,
	"discharge_date" timestamp with time zone,
	"admit_reason" text,
	"discharge_summary" jsonb DEFAULT '{}'::jsonb,
	"discharge_outcome" "discharge_outcome",
	"is_archived" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "care_episodes_episode_number_unique" UNIQUE("episode_number")
);
--> statement-breakpoint
CREATE TABLE "clinical_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid,
	"doctor_id" uuid,
	"title" text,
	"description" text,
	"symptoms_json" jsonb DEFAULT '{}'::jsonb,
	"provisional_diagnosis" text,
	"treatment" text,
	"treatment_duration" text,
	"outcome_status" "outcome_status" DEFAULT 'PENDING',
	"outcome_notes" text,
	"priority" text DEFAULT 'medium',
	"tags_json" jsonb DEFAULT '{}'::jsonb,
	"is_synced" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clinical_knowledge_base" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_episode_id" uuid,
	"age_range" text,
	"sex" "gender",
	"symptoms" jsonb DEFAULT '[]'::jsonb,
	"diagnostics" jsonb DEFAULT '[]'::jsonb,
	"treatments" jsonb DEFAULT '[]'::jsonb,
	"exam_results" jsonb DEFAULT '{}'::jsonb,
	"evolution" text,
	"duration_days" integer,
	"outcome" text,
	"disease_id" uuid,
	"facility_id" uuid,
	"is_anonymized" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"consultation_number" text NOT NULL,
	"motif" text NOT NULL,
	"symptoms" jsonb DEFAULT '[]'::jsonb,
	"vital_signs" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"provisional_diagnosis" text,
	"status" "consultation_status" DEFAULT 'WAITING' NOT NULL,
	"episode_id" uuid,
	"is_follow_up" boolean DEFAULT false,
	"previous_consultation_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultations_consultation_number_unique" UNIQUE("consultation_number")
);
--> statement-breakpoint
CREATE TABLE "diagnostics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"consultation_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"disease_id" uuid,
	"episode_id" uuid,
	"diagnostic_type" "diagnostic_type" NOT NULL,
	"description" text NOT NULL,
	"notes" text,
	"is_validated" boolean DEFAULT false,
	"validated_by" uuid,
	"validated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disease_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"disease_id" uuid NOT NULL,
	"total_cases" integer DEFAULT 0,
	"recovery_rate" integer DEFAULT 0,
	"mortality_rate" integer DEFAULT 0,
	"avg_hospitalization_days" integer DEFAULT 0,
	"common_treatments" jsonb DEFAULT '[]'::jsonb,
	"common_medications" jsonb DEFAULT '[]'::jsonb,
	"common_exams" jsonb DEFAULT '[]'::jsonb,
	"common_complications" jsonb DEFAULT '[]'::jsonb,
	"last_calculated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "disease_statistics_disease_id_unique" UNIQUE("disease_id")
);
--> statement-breakpoint
CREATE TABLE "diseases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"description" text,
	"symptoms" jsonb DEFAULT '[]'::jsonb,
	"complications" jsonb DEFAULT '[]'::jsonb,
	"treatments" jsonb DEFAULT '[]'::jsonb,
	"is_contagious" boolean DEFAULT false,
	"severity" text DEFAULT 'MODERATE',
	"statistics_metadata" jsonb DEFAULT '{}'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "diseases_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid,
	"consultation_id" uuid,
	"doctor_id" uuid NOT NULL,
	"episode_id" uuid,
	"document_type" "document_type" NOT NULL,
	"title" text NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb,
	"file_path" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_printed" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "episode_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"episode_id" uuid NOT NULL,
	"entity_type" "episode_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"assigned_to_type" "assignment_type" DEFAULT 'DEPARTMENT' NOT NULL,
	"assigned_to_id" uuid,
	"assigned_to_name" text,
	"department" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"notes" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"audit_type" "equipment_audit_type" DEFAULT 'STATUS_CHECK' NOT NULL,
	"audited_by_user_id" uuid,
	"audit_date" date NOT NULL,
	"status" "equipment_state" DEFAULT 'GOOD' NOT NULL,
	"findings" jsonb DEFAULT '[]'::jsonb,
	"next_audit_date" date,
	"notes" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"booked_by_user_id" uuid,
	"assigned_to_name" text,
	"assigned_to_id" uuid,
	"purpose" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"status" "booking_status" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"parent_id" uuid,
	"name" text NOT NULL,
	"icon" text,
	"color" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" "equipment_doc_category" DEFAULT 'OTHER' NOT NULL,
	"file_path" text,
	"file_type" text,
	"file_size" integer,
	"version" integer DEFAULT 1 NOT NULL,
	"description" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"priority" "incident_priority" DEFAULT 'MEDIUM' NOT NULL,
	"status" "incident_status" DEFAULT 'OPEN' NOT NULL,
	"reported_by_user_id" uuid,
	"assigned_to_user_id" uuid,
	"resolved_at" timestamp with time zone,
	"resolution_notes" text,
	"root_cause" text,
	"cost" integer,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"parent_id" uuid,
	"type" "location_type" DEFAULT 'FACILITY' NOT NULL,
	"name" text NOT NULL,
	"building" text,
	"floor" text,
	"department" text,
	"room" text,
	"position" text,
	"code" text,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"action" text NOT NULL,
	"details" jsonb DEFAULT '{}'::jsonb,
	"user_id" uuid,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"maintenance_type" "maintenance_type" NOT NULL,
	"status" "maintenance_status" DEFAULT 'SCHEDULED' NOT NULL,
	"scheduled_date" date,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"technician_user_id" uuid,
	"technician_name" text,
	"company" text,
	"cost" integer,
	"currency" text DEFAULT 'CDF',
	"duration_hours" integer,
	"priority" "incident_priority" DEFAULT 'MEDIUM' NOT NULL,
	"report" text,
	"photos" jsonb DEFAULT '[]'::jsonb,
	"parts_replaced" jsonb DEFAULT '[]'::jsonb,
	"signature" text,
	"notes" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "equipment_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"phone" text,
	"email" text,
	"address" text,
	"city" text,
	"category" text,
	"rating" integer DEFAULT 3,
	"is_active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "equipment_suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "equipment_warranties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"equipment_id" uuid NOT NULL,
	"supplier_id" uuid,
	"start_date" date,
	"end_date" date NOT NULL,
	"status" "warranty_status" DEFAULT 'ACTIVE' NOT NULL,
	"coverage" text,
	"terms" text,
	"cost" integer,
	"notes" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "facilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"facility_type" "facility_type" NOT NULL,
	"address" text,
	"city" text,
	"phone" text,
	"email" text,
	"bed_count" integer DEFAULT 0,
	"department_count" integer DEFAULT 0,
	"staff_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "facilities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "help_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"location" text NOT NULL,
	"image_data" text,
	"alt_text" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "help_images_location_unique" UNIQUE("location")
);
--> statement-breakpoint
CREATE TABLE "lab_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"lab_technician_id" uuid,
	"category_id" uuid,
	"consultation_id" uuid,
	"episode_id" uuid,
	"exam_name" text NOT NULL,
	"clinical_indication" text,
	"status" "lab_exam_status" DEFAULT 'REQUESTED' NOT NULL,
	"results" jsonb DEFAULT '{}'::jsonb,
	"result_notes" text,
	"validated_by" uuid,
	"validated_at" timestamp with time zone,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "maintenance_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"maintenance_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "maintenance_task_status" DEFAULT 'PENDING' NOT NULL,
	"completed_at" timestamp with time zone,
	"completed_by" uuid,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "medical_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"code" text NOT NULL,
	"qr_code" text,
	"barcode" text,
	"name" text NOT NULL,
	"description" text,
	"type" "equipment_type" DEFAULT 'BIOMEDICAL' NOT NULL,
	"category_id" uuid,
	"sub_category_id" uuid,
	"manufacturer" text,
	"brand" text,
	"model" text,
	"serial_number" text,
	"purchase_date" date,
	"purchase_price" integer,
	"currency" text DEFAULT 'CDF',
	"warranty_months" integer,
	"lifecycle_years" integer,
	"state" "equipment_state" DEFAULT 'NEW' NOT NULL,
	"status" "equipment_status" DEFAULT 'AVAILABLE' NOT NULL,
	"photo" text,
	"responsible_user_id" uuid,
	"location_id" uuid,
	"building" text,
	"floor" text,
	"department" text,
	"room" text,
	"position" text,
	"commissioning_date" date,
	"retirement_date" date,
	"comments" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "medical_equipment_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "medical_supplies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"name" text NOT NULL,
	"code" text,
	"sku" text,
	"category" "supply_category" DEFAULT 'OTHER' NOT NULL,
	"description" text,
	"unit" text DEFAULT 'piece',
	"min_stock" integer DEFAULT 0 NOT NULL,
	"critical_stock" integer DEFAULT 0 NOT NULL,
	"price" integer,
	"currency" text DEFAULT 'CDF',
	"supplier_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "medications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"generic_name" text,
	"category" text,
	"form" text,
	"dosage" text,
	"manufacturer" text,
	"side_effects" jsonb DEFAULT '[]'::jsonb,
	"contraindications" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sound_enabled" boolean DEFAULT true NOT NULL,
	"volume" integer DEFAULT 50 NOT NULL,
	"notification_types" jsonb DEFAULT '["INFO","WARNING","SUCCESS","ERROR"]'::jsonb,
	"services" jsonb DEFAULT '["LABORATORY","PHARMACY","IMAGERY","HOSPITALIZATION","RECEPTION","ADMINISTRATION"]'::jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"facility_id" uuid,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" "notification_type" DEFAULT 'INFO' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"link" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partner_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"sector" text,
	"address" text,
	"city" text,
	"country" text DEFAULT 'RD Congo',
	"phone" text,
	"email" text,
	"website" text,
	"contact_name" text,
	"contact_function" text,
	"contact_phone" text,
	"contact_email" text,
	"contract_number" text,
	"contract_start_date" date,
	"contract_end_date" date,
	"contract_status" "coverage_status" DEFAULT 'ACTIVE' NOT NULL,
	"coverage_rate" integer,
	"annual_ceiling" integer,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_companies_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "partner_patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"partner_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"contract_number" text,
	"coverage_rate" integer,
	"annual_ceiling" integer,
	"remaining_amount" integer,
	"valid_from" date,
	"valid_until" date,
	"status" "coverage_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"episode_id" uuid,
	"event_type" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"performed_by" uuid,
	"performed_by_name" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"user_id" uuid,
	"patient_uuid" text NOT NULL,
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"sex" "gender" NOT NULL,
	"date_of_birth" date NOT NULL,
	"age" integer,
	"blood_group" "blood_group",
	"phone" text,
	"email" text,
	"address" text,
	"city" text,
	"photo" text,
	"emergency_contact_name" text,
	"emergency_contact_phone" text,
	"emergency_contact_relation" text,
	"insurance_name" text,
	"insurance_number" text,
	"insurance_expiry" date,
	"allergies" jsonb DEFAULT '[]'::jsonb,
	"antecedents" jsonb DEFAULT '[]'::jsonb,
	"medical_history_json" jsonb DEFAULT '{}'::jsonb,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "patients_patient_uuid_unique" UNIQUE("patient_uuid")
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"treatment_id" uuid NOT NULL,
	"medication_id" uuid NOT NULL,
	"dosage" text NOT NULL,
	"frequency" text NOT NULL,
	"duration" text NOT NULL,
	"instructions" text,
	"quantity" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchase_order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"order_id" uuid NOT NULL,
	"item_type" text DEFAULT 'supply' NOT NULL,
	"supply_id" uuid,
	"spare_part_id" uuid,
	"equipment_id" uuid,
	"description" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"total_price" integer DEFAULT 0 NOT NULL,
	"received_quantity" integer DEFAULT 0 NOT NULL,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"order_number" text NOT NULL,
	"supplier_id" uuid,
	"order_date" date NOT NULL,
	"expected_date" date,
	"received_date" date,
	"status" "po_status" DEFAULT 'DRAFT' NOT NULL,
	"total_amount" integer,
	"currency" text DEFAULT 'CDF',
	"notes" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"consultation_id" uuid,
	"ticket_number" text NOT NULL,
	"priority" "queue_priority" DEFAULT 'NORMAL' NOT NULL,
	"status" "queue_status" DEFAULT 'WAITING' NOT NULL,
	"assigned_doctor_id" uuid,
	"queue_position" integer,
	"estimated_wait_minutes" integer,
	"arrived_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "similar_case_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagnostic_id" uuid,
	"query_symptoms" jsonb DEFAULT '[]'::jsonb,
	"query_disease_id" uuid,
	"results" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spare_part_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"spare_part_id" uuid NOT NULL,
	"location" text DEFAULT 'MAIN',
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_threshold" integer DEFAULT 0 NOT NULL,
	"unit_cost" integer,
	"currency" text DEFAULT 'CDF',
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "spare_parts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"code" text,
	"sku" text,
	"name" text NOT NULL,
	"category_id" uuid,
	"description" text,
	"unit" text DEFAULT 'piece',
	"manufacturer" text,
	"supplier_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"supply_id" uuid NOT NULL,
	"batch_id" uuid,
	"movement_type" "stock_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" integer,
	"from_location" text,
	"to_location" text,
	"reason" text,
	"reference_id" text,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "supply_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"supply_id" uuid NOT NULL,
	"batch_number" text,
	"lot_number" text,
	"manufacturer_date" date,
	"expiry_date" date,
	"quantity" integer DEFAULT 0 NOT NULL,
	"received_date" date,
	"supplier_id" uuid,
	"purchase_order_id" uuid,
	"organization_id" uuid,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sync_queue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb,
	"status" text DEFAULT 'pending',
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"synced_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "therapeutic_protocols" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"disease_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"steps" jsonb DEFAULT '[]'::jsonb,
	"target_population" text,
	"contraindications" jsonb DEFAULT '[]'::jsonb,
	"efficacy_rate" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treatments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"consultation_id" uuid,
	"patient_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"diagnosis_id" uuid,
	"episode_id" uuid,
	"description" text NOT NULL,
	"status" "treatment_status" DEFAULT 'PRESCRIBED' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"notes" text,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"firstname" text NOT NULL,
	"lastname" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" NOT NULL,
	"phone" text,
	"specialty" text,
	"license_number" text,
	"availability" text,
	"avatar" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login" timestamp with time zone,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "archives_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "archives_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "archives" ADD CONSTRAINT "archives_archived_by_users_id_fk" FOREIGN KEY ("archived_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_history" ADD CONSTRAINT "audit_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_coverages" ADD CONSTRAINT "care_coverages_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_coverages" ADD CONSTRAINT "care_coverages_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_episodes" ADD CONSTRAINT "care_episodes_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "care_episodes" ADD CONSTRAINT "care_episodes_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_cases" ADD CONSTRAINT "clinical_cases_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_cases" ADD CONSTRAINT "clinical_cases_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_cases" ADD CONSTRAINT "clinical_cases_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_knowledge_base" ADD CONSTRAINT "clinical_knowledge_base_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clinical_knowledge_base" ADD CONSTRAINT "clinical_knowledge_base_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostics" ADD CONSTRAINT "diagnostics_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disease_statistics" ADD CONSTRAINT "disease_statistics_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "episode_entities" ADD CONSTRAINT "episode_entities_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_assignments" ADD CONSTRAINT "equipment_assignments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_audits" ADD CONSTRAINT "equipment_audits_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_audits" ADD CONSTRAINT "equipment_audits_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_audits" ADD CONSTRAINT "equipment_audits_audited_by_user_id_users_id_fk" FOREIGN KEY ("audited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_audits" ADD CONSTRAINT "equipment_audits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_audits" ADD CONSTRAINT "equipment_audits_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_booked_by_user_id_users_id_fk" FOREIGN KEY ("booked_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_bookings" ADD CONSTRAINT "equipment_bookings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_categories" ADD CONSTRAINT "equipment_categories_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_categories" ADD CONSTRAINT "equipment_categories_parent_id_equipment_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."equipment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_categories" ADD CONSTRAINT "equipment_categories_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_categories" ADD CONSTRAINT "equipment_categories_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_documents" ADD CONSTRAINT "equipment_documents_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_documents" ADD CONSTRAINT "equipment_documents_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_documents" ADD CONSTRAINT "equipment_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_documents" ADD CONSTRAINT "equipment_documents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incidents" ADD CONSTRAINT "equipment_incidents_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incidents" ADD CONSTRAINT "equipment_incidents_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incidents" ADD CONSTRAINT "equipment_incidents_reported_by_user_id_users_id_fk" FOREIGN KEY ("reported_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incidents" ADD CONSTRAINT "equipment_incidents_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incidents" ADD CONSTRAINT "equipment_incidents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_incidents" ADD CONSTRAINT "equipment_incidents_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_locations" ADD CONSTRAINT "equipment_locations_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_locations" ADD CONSTRAINT "equipment_locations_parent_id_equipment_locations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."equipment_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_locations" ADD CONSTRAINT "equipment_locations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_locations" ADD CONSTRAINT "equipment_locations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_logs" ADD CONSTRAINT "equipment_logs_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_logs" ADD CONSTRAINT "equipment_logs_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_logs" ADD CONSTRAINT "equipment_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_logs" ADD CONSTRAINT "equipment_logs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_logs" ADD CONSTRAINT "equipment_logs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_technician_user_id_users_id_fk" FOREIGN KEY ("technician_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_suppliers" ADD CONSTRAINT "equipment_suppliers_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_suppliers" ADD CONSTRAINT "equipment_suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_suppliers" ADD CONSTRAINT "equipment_suppliers_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_supplier_id_equipment_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."equipment_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_warranties" ADD CONSTRAINT "equipment_warranties_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "help_images" ADD CONSTRAINT "help_images_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_lab_technician_id_users_id_fk" FOREIGN KEY ("lab_technician_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_category_id_lab_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."lab_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lab_exams" ADD CONSTRAINT "lab_exams_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_maintenance_id_equipment_maintenance_id_fk" FOREIGN KEY ("maintenance_id") REFERENCES "public"."equipment_maintenance"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_tasks" ADD CONSTRAINT "maintenance_tasks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_equipment" ADD CONSTRAINT "medical_equipment_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_equipment" ADD CONSTRAINT "medical_equipment_category_id_equipment_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."equipment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_equipment" ADD CONSTRAINT "medical_equipment_sub_category_id_equipment_categories_id_fk" FOREIGN KEY ("sub_category_id") REFERENCES "public"."equipment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_equipment" ADD CONSTRAINT "medical_equipment_responsible_user_id_users_id_fk" FOREIGN KEY ("responsible_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_equipment" ADD CONSTRAINT "medical_equipment_location_id_equipment_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."equipment_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_equipment" ADD CONSTRAINT "medical_equipment_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_equipment" ADD CONSTRAINT "medical_equipment_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_supplies" ADD CONSTRAINT "medical_supplies_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_supplies" ADD CONSTRAINT "medical_supplies_supplier_id_equipment_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."equipment_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_supplies" ADD CONSTRAINT "medical_supplies_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_supplies" ADD CONSTRAINT "medical_supplies_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_companies" ADD CONSTRAINT "partner_companies_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_patients" ADD CONSTRAINT "partner_patients_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_patients" ADD CONSTRAINT "partner_patients_partner_id_partner_companies_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partner_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_patients" ADD CONSTRAINT "partner_patients_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patient_history" ADD CONSTRAINT "patient_history_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_order_id_purchase_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_supply_id_medical_supplies_id_fk" FOREIGN KEY ("supply_id") REFERENCES "public"."medical_supplies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "public"."spare_parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_equipment_id_medical_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."medical_equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_supplier_id_equipment_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."equipment_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue" ADD CONSTRAINT "queue_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue" ADD CONSTRAINT "queue_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue" ADD CONSTRAINT "queue_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queue" ADD CONSTRAINT "queue_assigned_doctor_id_users_id_fk" FOREIGN KEY ("assigned_doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similar_case_searches" ADD CONSTRAINT "similar_case_searches_diagnostic_id_diagnostics_id_fk" FOREIGN KEY ("diagnostic_id") REFERENCES "public"."diagnostics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "similar_case_searches" ADD CONSTRAINT "similar_case_searches_query_disease_id_diseases_id_fk" FOREIGN KEY ("query_disease_id") REFERENCES "public"."diseases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_part_inventory" ADD CONSTRAINT "spare_part_inventory_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_part_inventory" ADD CONSTRAINT "spare_part_inventory_spare_part_id_spare_parts_id_fk" FOREIGN KEY ("spare_part_id") REFERENCES "public"."spare_parts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_part_inventory" ADD CONSTRAINT "spare_part_inventory_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_part_inventory" ADD CONSTRAINT "spare_part_inventory_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_category_id_equipment_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."equipment_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_supplier_id_equipment_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."equipment_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "spare_parts" ADD CONSTRAINT "spare_parts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_supply_id_medical_supplies_id_fk" FOREIGN KEY ("supply_id") REFERENCES "public"."medical_supplies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_supply_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."supply_batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_batches" ADD CONSTRAINT "supply_batches_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_batches" ADD CONSTRAINT "supply_batches_supply_id_medical_supplies_id_fk" FOREIGN KEY ("supply_id") REFERENCES "public"."medical_supplies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_batches" ADD CONSTRAINT "supply_batches_supplier_id_equipment_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."equipment_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_batches" ADD CONSTRAINT "supply_batches_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_batches" ADD CONSTRAINT "supply_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply_batches" ADD CONSTRAINT "supply_batches_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_queue" ADD CONSTRAINT "sync_queue_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapeutic_protocols" ADD CONSTRAINT "therapeutic_protocols_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapeutic_protocols" ADD CONSTRAINT "therapeutic_protocols_disease_id_diseases_id_fk" FOREIGN KEY ("disease_id") REFERENCES "public"."diseases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "therapeutic_protocols" ADD CONSTRAINT "therapeutic_protocols_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_diagnosis_id_diagnostics_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."diagnostics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_archives_facility" ON "archives" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_archives_entity" ON "archives" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_archives_patient" ON "archives" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_audit_history_item" ON "audit_history" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "idx_audit_history_created" ON "audit_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_facility" ON "audit_logs" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_audit_resource" ON "audit_logs" USING btree ("resource");--> statement-breakpoint
CREATE INDEX "idx_audit_timestamp" ON "audit_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "idx_care_coverage_facility" ON "care_coverages" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_care_coverage_patient" ON "care_coverages" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_care_coverage_type" ON "care_coverages" USING btree ("coverage_type");--> statement-breakpoint
CREATE INDEX "idx_care_coverage_status" ON "care_coverages" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_care_episodes_facility" ON "care_episodes" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_care_episodes_patient" ON "care_episodes" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_care_episodes_status" ON "care_episodes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_care_episodes_number" ON "care_episodes" USING btree ("episode_number");--> statement-breakpoint
CREATE INDEX "idx_cases_facility" ON "clinical_cases" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_cases_patient" ON "clinical_cases" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_cases_doctor" ON "clinical_cases" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_cases_status" ON "clinical_cases" USING btree ("outcome_status");--> statement-breakpoint
CREATE INDEX "idx_knowledge_base_disease" ON "clinical_knowledge_base" USING btree ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_base_facility" ON "clinical_knowledge_base" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_knowledge_base_sex" ON "clinical_knowledge_base" USING btree ("sex");--> statement-breakpoint
CREATE INDEX "idx_consultations_facility" ON "consultations" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_patient" ON "consultations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_doctor" ON "consultations" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_consultations_status" ON "consultations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_consultations_number" ON "consultations" USING btree ("consultation_number");--> statement-breakpoint
CREATE INDEX "idx_consultations_episode" ON "consultations" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostics_facility" ON "diagnostics" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostics_consultation" ON "diagnostics" USING btree ("consultation_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostics_patient" ON "diagnostics" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostics_doctor" ON "diagnostics" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostics_disease" ON "diagnostics" USING btree ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostics_episode" ON "diagnostics" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_disease_statistics_disease" ON "disease_statistics" USING btree ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_diseases_code" ON "diseases" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_diseases_category" ON "diseases" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_diseases_name" ON "diseases" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_documents_facility" ON "documents" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_documents_patient" ON "documents" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_documents_type" ON "documents" USING btree ("document_type");--> statement-breakpoint
CREATE INDEX "idx_documents_episode" ON "documents" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_episode_entities_episode" ON "episode_entities" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_episode_entities_type" ON "episode_entities" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "idx_equip_assign_equipment" ON "equipment_assignments" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_assign_type" ON "equipment_assignments" USING btree ("assigned_to_type");--> statement-breakpoint
CREATE INDEX "idx_equip_assign_facility" ON "equipment_assignments" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_assign_dates" ON "equipment_assignments" USING btree ("started_at","ended_at");--> statement-breakpoint
CREATE INDEX "idx_equip_audits_equipment" ON "equipment_audits" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_audits_date" ON "equipment_audits" USING btree ("audit_date");--> statement-breakpoint
CREATE INDEX "idx_equip_audits_facility" ON "equipment_audits" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_book_equipment" ON "equipment_bookings" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_book_status" ON "equipment_bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_equip_book_time" ON "equipment_bookings" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "idx_equip_book_facility" ON "equipment_bookings" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_cats_facility" ON "equipment_categories" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_cats_parent" ON "equipment_categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_equip_cats_name" ON "equipment_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_equip_docs_equipment" ON "equipment_documents" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_docs_category" ON "equipment_documents" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_equip_docs_facility" ON "equipment_documents" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_inc_equipment" ON "equipment_incidents" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_inc_status" ON "equipment_incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_equip_inc_priority" ON "equipment_incidents" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "idx_equip_inc_facility" ON "equipment_incidents" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_loc_facility" ON "equipment_locations" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_loc_parent" ON "equipment_locations" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "idx_equip_loc_type" ON "equipment_locations" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_equip_loc_name" ON "equipment_locations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_equip_logs_equipment" ON "equipment_logs" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_logs_action" ON "equipment_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_equip_logs_facility" ON "equipment_logs" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_maint_equipment" ON "equipment_maintenance" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_maint_type" ON "equipment_maintenance" USING btree ("maintenance_type");--> statement-breakpoint
CREATE INDEX "idx_equip_maint_status" ON "equipment_maintenance" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_equip_maint_date" ON "equipment_maintenance" USING btree ("scheduled_date");--> statement-breakpoint
CREATE INDEX "idx_equip_maint_facility" ON "equipment_maintenance" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_supp_facility" ON "equipment_suppliers" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_equip_supp_name" ON "equipment_suppliers" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_equip_supp_code" ON "equipment_suppliers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_equip_warr_equipment" ON "equipment_warranties" USING btree ("equipment_id");--> statement-breakpoint
CREATE INDEX "idx_equip_warr_status" ON "equipment_warranties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_equip_warr_end" ON "equipment_warranties" USING btree ("end_date");--> statement-breakpoint
CREATE INDEX "idx_equip_warr_facility" ON "equipment_warranties" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_facilities_type" ON "facilities" USING btree ("facility_type");--> statement-breakpoint
CREATE INDEX "idx_facilities_active" ON "facilities" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_lab_exams_facility" ON "lab_exams" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_lab_exams_patient" ON "lab_exams" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_lab_exams_doctor" ON "lab_exams" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_lab_exams_status" ON "lab_exams" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_lab_exams_category" ON "lab_exams" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_lab_exams_episode" ON "lab_exams" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_maint_tasks_maintenance" ON "maintenance_tasks" USING btree ("maintenance_id");--> statement-breakpoint
CREATE INDEX "idx_maint_tasks_status" ON "maintenance_tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_med_equip_facility" ON "medical_equipment" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_med_equip_category" ON "medical_equipment" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_med_equip_status" ON "medical_equipment" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_med_equip_state" ON "medical_equipment" USING btree ("state");--> statement-breakpoint
CREATE INDEX "idx_med_equip_type" ON "medical_equipment" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_med_equip_serial" ON "medical_equipment" USING btree ("serial_number");--> statement-breakpoint
CREATE INDEX "idx_med_equip_name" ON "medical_equipment" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_med_supplies_facility" ON "medical_supplies" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_med_supplies_name" ON "medical_supplies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_med_supplies_sku" ON "medical_supplies" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_med_supplies_category" ON "medical_supplies" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_medications_name" ON "medications" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_medications_category" ON "medications" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_notif_prefs_user" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_read" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_facility" ON "notifications" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_partner_facility" ON "partner_companies" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_partner_code" ON "partner_companies" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_partner_name" ON "partner_companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_partner_status" ON "partner_companies" USING btree ("contract_status");--> statement-breakpoint
CREATE INDEX "idx_partner_patient_facility" ON "partner_patients" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_partner_patient_partner" ON "partner_patients" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "idx_partner_patient_patient" ON "partner_patients" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_partner_patient_status" ON "partner_patients" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_patient_history_facility" ON "patient_history" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_patient_history_patient" ON "patient_history" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_patient_history_episode" ON "patient_history" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_patient_history_type" ON "patient_history" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "idx_patient_history_created" ON "patient_history" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_patients_facility" ON "patients" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_patients_uuid" ON "patients" USING btree ("patient_uuid");--> statement-breakpoint
CREATE INDEX "idx_patients_name" ON "patients" USING btree ("firstname","lastname");--> statement-breakpoint
CREATE INDEX "idx_patients_active" ON "patients" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_treatment" ON "prescriptions" USING btree ("treatment_id");--> statement-breakpoint
CREATE INDEX "idx_prescriptions_medication" ON "prescriptions" USING btree ("medication_id");--> statement-breakpoint
CREATE INDEX "idx_po_items_order" ON "purchase_order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_po_items_supply" ON "purchase_order_items" USING btree ("supply_id");--> statement-breakpoint
CREATE INDEX "idx_po_items_facility" ON "purchase_order_items" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_po_facility" ON "purchase_orders" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_po_supplier" ON "purchase_orders" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_po_status" ON "purchase_orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_po_order_number" ON "purchase_orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "idx_queue_facility" ON "queue" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_queue_status" ON "queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_queue_patient" ON "queue" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_queue_doctor" ON "queue" USING btree ("assigned_doctor_id");--> statement-breakpoint
CREATE INDEX "idx_queue_ticket" ON "queue" USING btree ("ticket_number");--> statement-breakpoint
CREATE INDEX "idx_similar_case_searches_diagnostic" ON "similar_case_searches" USING btree ("diagnostic_id");--> statement-breakpoint
CREATE INDEX "idx_similar_case_searches_disease" ON "similar_case_searches" USING btree ("query_disease_id");--> statement-breakpoint
CREATE INDEX "idx_spare_inv_part" ON "spare_part_inventory" USING btree ("spare_part_id");--> statement-breakpoint
CREATE INDEX "idx_spare_inv_location" ON "spare_part_inventory" USING btree ("location");--> statement-breakpoint
CREATE INDEX "idx_spare_inv_facility" ON "spare_part_inventory" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_spare_parts_facility" ON "spare_parts" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_spare_parts_name" ON "spare_parts" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_spare_parts_sku" ON "spare_parts" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_supply" ON "stock_movements" USING btree ("supply_id");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_type" ON "stock_movements" USING btree ("movement_type");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_batch" ON "stock_movements" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_facility" ON "stock_movements" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_stock_mov_created" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_supply_batches_supply" ON "supply_batches" USING btree ("supply_id");--> statement-breakpoint
CREATE INDEX "idx_supply_batches_expiry" ON "supply_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_supply_batches_facility" ON "supply_batches" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_supply_batches_lot" ON "supply_batches" USING btree ("lot_number");--> statement-breakpoint
CREATE INDEX "idx_sync_user" ON "sync_queue" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sync_status" ON "sync_queue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_therapeutic_protocols_facility" ON "therapeutic_protocols" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_therapeutic_protocols_disease" ON "therapeutic_protocols" USING btree ("disease_id");--> statement-breakpoint
CREATE INDEX "idx_therapeutic_protocols_active" ON "therapeutic_protocols" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_treatments_facility" ON "treatments" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_treatments_patient" ON "treatments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_treatments_doctor" ON "treatments" USING btree ("doctor_id");--> statement-breakpoint
CREATE INDEX "idx_treatments_status" ON "treatments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_treatments_episode" ON "treatments" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_users_facility" ON "users" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");