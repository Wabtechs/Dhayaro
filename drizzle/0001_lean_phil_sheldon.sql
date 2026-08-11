CREATE TYPE "public"."billing_status" AS ENUM('DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'CARD', 'MOBILE_MONEY', 'BANK_TRANSFER', 'INSURANCE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "billing_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"code" text NOT NULL,
	"label" text NOT NULL,
	"service_type" text DEFAULT 'CONSULTATION' NOT NULL,
	"price" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'CDF' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "case_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"author_id" uuid,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dispensations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"treatment_id" uuid NOT NULL,
	"doctor_id" uuid NOT NULL,
	"pharmacist_id" uuid NOT NULL,
	"episode_id" uuid,
	"medication_id" uuid,
	"quantity" integer NOT NULL,
	"dosage" text,
	"batch_number" text,
	"expiry_date" date,
	"notes" text,
	"signature" text,
	"dispensed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"invoice_id" uuid NOT NULL,
	"billing_code_id" uuid,
	"description" text NOT NULL,
	"service_type" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer DEFAULT 0 NOT NULL,
	"total_price" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"patient_id" uuid NOT NULL,
	"care_coverage_id" uuid,
	"doctor_id" uuid,
	"episode_id" uuid,
	"invoice_number" text NOT NULL,
	"status" "billing_status" DEFAULT 'DRAFT' NOT NULL,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"paid_amount" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'CDF' NOT NULL,
	"coverage_rate" integer DEFAULT 0,
	"coverage_ceiling" integer DEFAULT 0,
	"patient_share" integer DEFAULT 0 NOT NULL,
	"insurance_share" integer DEFAULT 0 NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date,
	"paid_at" timestamp with time zone,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"invoice_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'CDF' NOT NULL,
	"method" "payment_method" NOT NULL,
	"reference" text,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"recorded_by" uuid,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patients" ADD COLUMN "dossier_number" text NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_codes" ADD CONSTRAINT "billing_codes_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_case_id_clinical_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."clinical_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "case_notes" ADD CONSTRAINT "case_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_treatment_id_treatments_id_fk" FOREIGN KEY ("treatment_id") REFERENCES "public"."treatments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_pharmacist_id_users_id_fk" FOREIGN KEY ("pharmacist_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispensations" ADD CONSTRAINT "dispensations_medication_id_medications_id_fk" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_billing_code_id_billing_codes_id_fk" FOREIGN KEY ("billing_code_id") REFERENCES "public"."billing_codes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_care_coverage_id_care_coverages_id_fk" FOREIGN KEY ("care_coverage_id") REFERENCES "public"."care_coverages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_doctor_id_users_id_fk" FOREIGN KEY ("doctor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_billing_codes_facility" ON "billing_codes" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_billing_codes_code" ON "billing_codes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_billing_codes_service" ON "billing_codes" USING btree ("service_type");--> statement-breakpoint
CREATE INDEX "idx_case_notes_case" ON "case_notes" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "idx_case_notes_author" ON "case_notes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "idx_dispensations_facility" ON "dispensations" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_dispensations_patient" ON "dispensations" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_dispensations_treatment" ON "dispensations" USING btree ("treatment_id");--> statement-breakpoint
CREATE INDEX "idx_dispensations_pharmacist" ON "dispensations" USING btree ("pharmacist_id");--> statement-breakpoint
CREATE INDEX "idx_dispensations_date" ON "dispensations" USING btree ("dispensed_at");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_invoice" ON "invoice_items" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_invoice_items_facility" ON "invoice_items" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_facility" ON "invoices" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_patient" ON "invoices" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_invoices_status" ON "invoices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_invoices_number" ON "invoices" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "idx_invoices_date" ON "invoices" USING btree ("issue_date");--> statement-breakpoint
CREATE INDEX "idx_payments_facility" ON "payments" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_payments_invoice" ON "payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "idx_payments_patient" ON "payments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_payments_method" ON "payments" USING btree ("method");--> statement-breakpoint
ALTER TABLE "patients" ADD CONSTRAINT "patients_dossier_number_unique" UNIQUE("dossier_number");