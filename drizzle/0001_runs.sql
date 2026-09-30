CREATE TYPE "public"."run_scenario" AS ENUM('fix-invoice-test', 'rename-config-option');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('queued', 'running', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."run_step_decision" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."run_step_kind" AS ENUM('read', 'tool_call', 'test', 'source', 'claim');--> statement-breakpoint
CREATE TYPE "public"."run_verdict" AS ENUM('none', 'accepted', 'needs_changes');--> statement-breakpoint
CREATE TABLE "run_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"kind" "run_step_kind" NOT NULL,
	"title" text NOT NULL,
	"input" text NOT NULL,
	"output" text NOT NULL,
	"evidence" text,
	"decision" "run_step_decision" DEFAULT 'pending' NOT NULL,
	"note" text,
	CONSTRAINT "run_steps_run_position_unique" UNIQUE("run_id","position")
);
--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"scenario" "run_scenario" NOT NULL,
	"status" "run_status" DEFAULT 'queued' NOT NULL,
	"verdict" "run_verdict" DEFAULT 'none' NOT NULL,
	"ip_hash" text NOT NULL,
	"archive_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "run_steps" ADD CONSTRAINT "run_steps_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_user_created_idx" ON "runs" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "runs_ip_created_idx" ON "runs" USING btree ("ip_hash","created_at");