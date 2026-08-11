CREATE TYPE "public"."bed_assignment_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."bed_status" AS ENUM('AVAILABLE', 'OCCUPIED', 'CLEANING', 'OUT_OF_SERVICE', 'RESERVED');--> statement-breakpoint
CREATE TYPE "public"."bed_type" AS ENUM('WARD', 'PRIVATE', 'SEMI_PRIVATE', 'ICU', 'MATERNITY', 'PEDIATRIC', 'OTHER');--> statement-breakpoint
CREATE TABLE "bed_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"bed_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"episode_id" uuid,
	"assigned_by_id" uuid,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	"released_by_id" uuid,
	"status" "bed_assignment_status" DEFAULT 'ACTIVE' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "beds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"facility_id" uuid,
	"location_id" uuid,
	"bed_number" text NOT NULL,
	"floor" text,
	"room" text,
	"department" text,
	"label" text,
	"type" "bed_type" DEFAULT 'WARD' NOT NULL,
	"status" "bed_status" DEFAULT 'AVAILABLE' NOT NULL,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_bed_id_beds_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."beds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_episode_id_care_episodes_id_fk" FOREIGN KEY ("episode_id") REFERENCES "public"."care_episodes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_assigned_by_id_users_id_fk" FOREIGN KEY ("assigned_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed_assignments" ADD CONSTRAINT "bed_assignments_released_by_id_users_id_fk" FOREIGN KEY ("released_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_facility_id_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."facilities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "beds" ADD CONSTRAINT "beds_location_id_equipment_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."equipment_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bed_assignments_facility" ON "bed_assignments" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_bed_assignments_bed" ON "bed_assignments" USING btree ("bed_id");--> statement-breakpoint
CREATE INDEX "idx_bed_assignments_patient" ON "bed_assignments" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "idx_bed_assignments_episode" ON "bed_assignments" USING btree ("episode_id");--> statement-breakpoint
CREATE INDEX "idx_bed_assignments_status" ON "bed_assignments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_bed_assignments_active" ON "bed_assignments" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_beds_facility" ON "beds" USING btree ("facility_id");--> statement-breakpoint
CREATE INDEX "idx_beds_location" ON "beds" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_beds_room" ON "beds" USING btree ("room");--> statement-breakpoint
CREATE INDEX "idx_beds_floor" ON "beds" USING btree ("floor");--> statement-breakpoint
CREATE INDEX "idx_beds_department" ON "beds" USING btree ("department");--> statement-breakpoint
CREATE INDEX "idx_beds_status" ON "beds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_beds_number" ON "beds" USING btree ("bed_number");--> statement-breakpoint
CREATE INDEX "idx_beds_active" ON "beds" USING btree ("is_active");