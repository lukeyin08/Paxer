ALTER TABLE "users" ADD COLUMN "consumer_plan" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consumer_status" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "consumer_subscription_id" text;