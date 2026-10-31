CREATE TYPE "public"."project_category" AS ENUM('Personal Project', 'Work Project', 'Capstone Project');--> statement-breakpoint
CREATE TYPE "public"."project_lifecycle" AS ENUM('active', 'trashed');--> statement-breakpoint
CREATE TYPE "public"."project_operation_kind" AS ENUM('save_project_draft', 'save_featured_draft', 'publish');--> statement-breakpoint
CREATE TYPE "public"."project_operation_status" AS ENUM('pending', 'succeeded', 'failed');--> statement-breakpoint
CREATE TYPE "public"."project_publication_intent" AS ENUM('include', 'exclude');--> statement-breakpoint
CREATE TYPE "public"."published_slug_kind" AS ENUM('current', 'redirect');--> statement-breakpoint
CREATE TABLE "draft_featured_state" (
	"singleton_id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"slot_1_project_id" uuid,
	"slot_2_project_id" uuid,
	"slot_3_project_id" uuid,
	"revision" bigint DEFAULT 1 NOT NULL,
	CONSTRAINT "draft_featured_state_singleton" CHECK ("draft_featured_state"."singleton_id" = 1),
	CONSTRAINT "draft_featured_state_revision_positive" CHECK ("draft_featured_state"."revision" > 0)
);
--> statement-breakpoint
INSERT INTO "draft_featured_state" ("singleton_id", "revision") VALUES (1, 1);
--> statement-breakpoint
CREATE TABLE "project_drafts" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"name" text NOT NULL,
	"category" "project_category" NOT NULL,
	"description" text NOT NULL,
	"role" text,
	"tech" text[] NOT NULL,
	"repo" text,
	"live_url" text,
	"long_description_markdown" text,
	"group_order" integer NOT NULL,
	"slug" text NOT NULL,
	CONSTRAINT "project_drafts_number_non_blank" CHECK (btrim("project_drafts"."number") <> ''),
	CONSTRAINT "project_drafts_name_non_blank" CHECK (btrim("project_drafts"."name") <> ''),
	CONSTRAINT "project_drafts_description_non_blank" CHECK (btrim("project_drafts"."description") <> ''),
	CONSTRAINT "project_drafts_role_non_blank" CHECK ("project_drafts"."role" IS NULL OR btrim("project_drafts"."role") <> ''),
	CONSTRAINT "project_drafts_tech_non_empty" CHECK (array_ndims("project_drafts"."tech") = 1 AND cardinality("project_drafts"."tech") > 0),
	CONSTRAINT "project_drafts_tech_values_present" CHECK (array_position("project_drafts"."tech", NULL) IS NULL AND array_position("project_drafts"."tech", '') IS NULL),
	CONSTRAINT "project_drafts_repo_http_url" CHECK ("project_drafts"."repo" IS NULL OR "project_drafts"."repo" ~ '^https?://'),
	CONSTRAINT "project_drafts_live_url_http_url" CHECK ("project_drafts"."live_url" IS NULL OR "project_drafts"."live_url" ~ '^https?://'),
	CONSTRAINT "project_drafts_slug_format" CHECK ("project_drafts"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "project_drafts_markdown_non_blank" CHECK ("project_drafts"."long_description_markdown" IS NULL OR btrim("project_drafts"."long_description_markdown") <> ''),
	CONSTRAINT "project_drafts_group_order_positive" CHECK ("project_drafts"."group_order" > 0)
);
--> statement-breakpoint
CREATE TABLE "project_operations" (
	"operation_id" text PRIMARY KEY NOT NULL,
	"kind" "project_operation_kind" NOT NULL,
	"project_id" uuid,
	"request_fingerprint" text NOT NULL,
	"status" "project_operation_status" DEFAULT 'pending' NOT NULL,
	"outcome_code" text,
	"result_revision" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "project_operations_operation_id_non_blank" CHECK (btrim("project_operations"."operation_id") <> ''),
	CONSTRAINT "project_operations_fingerprint_non_blank" CHECK (btrim("project_operations"."request_fingerprint") <> ''),
	CONSTRAINT "project_operations_target_matches_kind" CHECK (("project_operations"."kind" = 'save_project_draft' AND "project_operations"."project_id" IS NOT NULL) OR ("project_operations"."kind" <> 'save_project_draft' AND "project_operations"."project_id" IS NULL)),
	CONSTRAINT "project_operations_result_revision_positive" CHECK ("project_operations"."result_revision" IS NULL OR "project_operations"."result_revision" > 0),
	CONSTRAINT "project_operations_outcome_code_non_blank" CHECK ("project_operations"."outcome_code" IS NULL OR btrim("project_operations"."outcome_code") <> ''),
	CONSTRAINT "project_operations_completion_matches_status" CHECK (("project_operations"."status" = 'pending' AND "project_operations"."completed_at" IS NULL AND "project_operations"."outcome_code" IS NULL AND "project_operations"."result_revision" IS NULL) OR ("project_operations"."status" <> 'pending' AND "project_operations"."completed_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lifecycle" "project_lifecycle" NOT NULL,
	"publication_intent" "project_publication_intent" NOT NULL,
	"draft_revision" bigint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_draft_revision_positive" CHECK ("projects"."draft_revision" > 0),
	CONSTRAINT "projects_trashed_excluded" CHECK ("projects"."lifecycle" <> 'trashed' OR "projects"."publication_intent" = 'exclude')
);
--> statement-breakpoint
CREATE TABLE "published_projects" (
	"project_id" uuid PRIMARY KEY NOT NULL,
	"number" text NOT NULL,
	"name" text NOT NULL,
	"category" "project_category" NOT NULL,
	"description" text NOT NULL,
	"role" text,
	"tech" text[] NOT NULL,
	"repo" text,
	"live_url" text,
	"long_description_markdown" text,
	"group_order" integer NOT NULL,
	CONSTRAINT "published_projects_category_group_order_unique" UNIQUE("category","group_order"),
	CONSTRAINT "published_projects_number_non_blank" CHECK (btrim("published_projects"."number") <> ''),
	CONSTRAINT "published_projects_name_non_blank" CHECK (btrim("published_projects"."name") <> ''),
	CONSTRAINT "published_projects_description_non_blank" CHECK (btrim("published_projects"."description") <> ''),
	CONSTRAINT "published_projects_role_non_blank" CHECK ("published_projects"."role" IS NULL OR btrim("published_projects"."role") <> ''),
	CONSTRAINT "published_projects_tech_non_empty" CHECK (array_ndims("published_projects"."tech") = 1 AND cardinality("published_projects"."tech") > 0),
	CONSTRAINT "published_projects_tech_values_present" CHECK (array_position("published_projects"."tech", NULL) IS NULL AND array_position("published_projects"."tech", '') IS NULL),
	CONSTRAINT "published_projects_repo_http_url" CHECK ("published_projects"."repo" IS NULL OR "published_projects"."repo" ~ '^https?://'),
	CONSTRAINT "published_projects_live_url_http_url" CHECK ("published_projects"."live_url" IS NULL OR "published_projects"."live_url" ~ '^https?://'),
	CONSTRAINT "published_projects_markdown_non_blank" CHECK ("published_projects"."long_description_markdown" IS NULL OR btrim("published_projects"."long_description_markdown") <> ''),
	CONSTRAINT "published_projects_group_order_positive" CHECK ("published_projects"."group_order" > 0)
);
--> statement-breakpoint
CREATE TABLE "published_slugs" (
	"slug" text PRIMARY KEY NOT NULL,
	"project_id" uuid NOT NULL,
	"kind" "published_slug_kind" NOT NULL,
	CONSTRAINT "published_slugs_slug_format" CHECK ("published_slugs"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "published_state" (
	"singleton_id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"snapshot_revision" bigint NOT NULL,
	"operation_id" text NOT NULL,
	"slot_1_project_id" uuid NOT NULL,
	"slot_2_project_id" uuid NOT NULL,
	"slot_3_project_id" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_state_singleton" CHECK ("published_state"."singleton_id" = 1),
	CONSTRAINT "published_state_snapshot_revision_positive" CHECK ("published_state"."snapshot_revision" > 0),
	CONSTRAINT "published_state_featured_projects_distinct" CHECK ("published_state"."slot_1_project_id" <> "published_state"."slot_2_project_id" AND "published_state"."slot_1_project_id" <> "published_state"."slot_3_project_id" AND "published_state"."slot_2_project_id" <> "published_state"."slot_3_project_id")
);
--> statement-breakpoint
ALTER TABLE "draft_featured_state" ADD CONSTRAINT "draft_featured_state_slot_1_project_id_projects_id_fk" FOREIGN KEY ("slot_1_project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "draft_featured_state" ADD CONSTRAINT "draft_featured_state_slot_2_project_id_projects_id_fk" FOREIGN KEY ("slot_2_project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "draft_featured_state" ADD CONSTRAINT "draft_featured_state_slot_3_project_id_projects_id_fk" FOREIGN KEY ("slot_3_project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "project_drafts" ADD CONSTRAINT "project_drafts_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "project_operations" ADD CONSTRAINT "project_operations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_projects" ADD CONSTRAINT "published_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_slugs" ADD CONSTRAINT "published_slugs_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_state" ADD CONSTRAINT "published_state_operation_id_project_operations_operation_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."project_operations"("operation_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_state" ADD CONSTRAINT "published_state_slot_1_project_id_published_projects_project_id_fk" FOREIGN KEY ("slot_1_project_id") REFERENCES "public"."published_projects"("project_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_state" ADD CONSTRAINT "published_state_slot_2_project_id_published_projects_project_id_fk" FOREIGN KEY ("slot_2_project_id") REFERENCES "public"."published_projects"("project_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_state" ADD CONSTRAINT "published_state_slot_3_project_id_published_projects_project_id_fk" FOREIGN KEY ("slot_3_project_id") REFERENCES "public"."published_projects"("project_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "published_slugs_one_current_per_project" ON "published_slugs" USING btree ("project_id") WHERE "published_slugs"."kind" = 'current';
