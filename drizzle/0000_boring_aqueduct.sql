CREATE TYPE "public"."benchmark_source" AS ENUM('SEED', 'AGGREGATE');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('DRAFT', 'INGESTING', 'AUDITED', 'IN_DISPUTE', 'RESOLVED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "public"."detector" AS ENUM('RULE', 'AI', 'RULE+AI');--> statement-breakpoint
CREATE TYPE "public"."dispute_channel" AS ENUM('MAIL', 'FAX', 'PORTAL');--> statement-breakpoint
CREATE TYPE "public"."dispute_event_type" AS ENUM('CREATED', 'EDITED', 'APPROVED', 'SIMULATED_SENT', 'REMINDER_SENT', 'RESPONSE_LOGGED', 'ESCALATED', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('DRAFT', 'AWAITING_USER_APPROVAL', 'SIMULATED_SENT', 'RESPONSE_RECEIVED', 'WON', 'PARTIAL', 'DENIED', 'ESCALATED');--> statement-breakpoint
CREATE TYPE "public"."dispute_target" AS ENUM('PROVIDER', 'INSURER');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('ITEMIZED_BILL', 'EOB', 'DENIAL_LETTER', 'PLAN_SBC', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."finding_status" AS ENUM('OPEN', 'DISMISSED', 'DISPUTING', 'RECOVERED');--> statement-breakpoint
CREATE TYPE "public"."finding_type" AS ENUM('DUPLICATE_CHARGE', 'UPCODING', 'UNBUNDLING_NCCI', 'COST_SHARE_ERROR', 'BALANCE_BILLING_NSA', 'OOP_MAX_OVERRUN', 'CROSS_PROVIDER_DUPLICATE', 'NON_COVERED_BILLED_TO_PATIENT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."ingest_status" AS ENUM('PENDING', 'PROCESSING', 'NEEDS_REVIEW', 'DONE', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."recovery_kind" AS ENUM('BILL_REDUCTION', 'REFUND', 'CLAIM_PAID');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('LOW', 'MED', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('PATIENT', 'ADMIN');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"entity" text NOT NULL,
	"entity_id" text,
	"action" text NOT NULL,
	"diff_json" jsonb,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "benchmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cpt_hcpcs_code" text NOT NULL,
	"region" text NOT NULL,
	"sample_size" integer DEFAULT 0 NOT NULL,
	"median_charge" numeric(12, 2),
	"p25" numeric(12, 2),
	"p75" numeric(12, 2),
	"source" "benchmark_source" DEFAULT 'SEED' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"status" "case_status" DEFAULT 'DRAFT' NOT NULL,
	"provider_name" text,
	"payer_name" text,
	"date_of_service" timestamp with time zone,
	"total_billed" numeric(12, 2),
	"total_patient_responsibility" numeric(12, 2),
	"estimated_recoverable" numeric(12, 2),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "dispute_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"type" "dispute_event_type" NOT NULL,
	"payload_json" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"finding_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target" "dispute_target" NOT NULL,
	"channel" "dispute_channel" DEFAULT 'MAIL' NOT NULL,
	"letter_html" text,
	"letter_pdf_url" text,
	"status" "dispute_status" DEFAULT 'DRAFT' NOT NULL,
	"deadline_at" timestamp with time zone,
	"model_id" text,
	"prompt_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"kind" "document_kind" DEFAULT 'OTHER' NOT NULL,
	"blob_url" text,
	"file_name" text,
	"mime_type" text,
	"ingest_status" "ingest_status" DEFAULT 'PENDING' NOT NULL,
	"raw_extract_json" jsonb,
	"page_count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"line_item_id" uuid,
	"type" "finding_type" NOT NULL,
	"severity" "severity" DEFAULT 'MED' NOT NULL,
	"title" text NOT NULL,
	"explanation_plain" text NOT NULL,
	"evidence_json" jsonb,
	"estimated_recovery" numeric(12, 2),
	"confidence" real DEFAULT 0.5 NOT NULL,
	"detector" "detector" DEFAULT 'RULE' NOT NULL,
	"status" "finding_status" DEFAULT 'OPEN' NOT NULL,
	"model_id" text,
	"prompt_version" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "line_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid,
	"case_id" uuid NOT NULL,
	"description" text NOT NULL,
	"cpt_hcpcs_code" text,
	"revenue_code" text,
	"units" integer DEFAULT 1 NOT NULL,
	"charge_amount" numeric(12, 2),
	"allowed_amount" numeric(12, 2),
	"plan_paid" numeric(12, 2),
	"patient_responsibility" numeric(12, 2),
	"date_of_service" timestamp with time zone,
	"source_confidence" real DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "plan_benefits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"deductible" numeric(12, 2),
	"deductible_met" numeric(12, 2),
	"coinsurance_rate" real,
	"copay" numeric(12, 2),
	"oop_max" numeric(12, 2),
	"oop_met" numeric(12, 2),
	"in_network" boolean DEFAULT true NOT NULL,
	"source_doc_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recoveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"finding_id" uuid,
	"amount" numeric(12, 2) NOT NULL,
	"kind" "recovery_kind" NOT NULL,
	"recovered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"fee_rate" real NOT NULL,
	"fee_amount" numeric(12, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"role" "user_role" DEFAULT 'PATIENT' NOT NULL,
	"state" text,
	"consent_at" timestamp with time zone,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dispute_events" ADD CONSTRAINT "dispute_events_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_line_item_id_line_items_id_fk" FOREIGN KEY ("line_item_id") REFERENCES "public"."line_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "line_items" ADD CONSTRAINT "line_items_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_benefits" ADD CONSTRAINT "plan_benefits_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plan_benefits" ADD CONSTRAINT "plan_benefits_source_doc_id_documents_id_fk" FOREIGN KEY ("source_doc_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recoveries" ADD CONSTRAINT "recoveries_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recoveries" ADD CONSTRAINT "recoveries_finding_id_findings_id_fk" FOREIGN KEY ("finding_id") REFERENCES "public"."findings"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "benchmarks_code_region_idx" ON "benchmarks" USING btree ("cpt_hcpcs_code","region");--> statement-breakpoint
CREATE INDEX "cases_user_id_idx" ON "cases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "dispute_events_dispute_id_idx" ON "dispute_events" USING btree ("dispute_id");--> statement-breakpoint
CREATE INDEX "disputes_case_id_idx" ON "disputes" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "documents_case_id_idx" ON "documents" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "findings_case_id_idx" ON "findings" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "line_items_case_id_idx" ON "line_items" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "line_items_code_idx" ON "line_items" USING btree ("cpt_hcpcs_code");--> statement-breakpoint
CREATE INDEX "plan_benefits_case_id_idx" ON "plan_benefits" USING btree ("case_id");--> statement-breakpoint
CREATE INDEX "recoveries_case_id_idx" ON "recoveries" USING btree ("case_id");