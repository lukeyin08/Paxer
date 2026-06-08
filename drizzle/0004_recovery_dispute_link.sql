ALTER TABLE "recoveries" ADD COLUMN "dispute_id" uuid;
--> statement-breakpoint
ALTER TABLE "recoveries" ADD CONSTRAINT "recoveries_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE set null ON UPDATE no action;
