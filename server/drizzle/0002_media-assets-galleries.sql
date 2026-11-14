CREATE TYPE "public"."media_asset_kind" AS ENUM('image', 'resume_pdf');--> statement-breakpoint
CREATE TYPE "public"."media_asset_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TABLE "draft_project_media" (
	"project_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"alt_text" text NOT NULL,
	"is_cover" boolean NOT NULL,
	CONSTRAINT "draft_project_media_project_media_unique" UNIQUE("project_id","media_id"),
	CONSTRAINT "draft_project_media_project_position_unique" UNIQUE("project_id","position"),
	CONSTRAINT "draft_project_media_position_positive" CHECK ("draft_project_media"."position" > 0),
	CONSTRAINT "draft_project_media_alt_text_non_blank" CHECK (btrim("draft_project_media"."alt_text") <> '')
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "media_asset_kind" NOT NULL,
	"object_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"byte_size" bigint NOT NULL,
	"original_filename" text NOT NULL,
	"status" "media_asset_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_object_key_unique" UNIQUE("object_key"),
	CONSTRAINT "media_assets_object_key_non_blank" CHECK (btrim("media_assets"."object_key") <> ''),
	CONSTRAINT "media_assets_mime_type_non_blank" CHECK (btrim("media_assets"."mime_type") <> ''),
	CONSTRAINT "media_assets_byte_size_positive" CHECK ("media_assets"."byte_size" > 0),
	CONSTRAINT "media_assets_original_filename_non_blank" CHECK (btrim("media_assets"."original_filename") <> ''),
	CONSTRAINT "media_assets_kind_mime_type" CHECK (("media_assets"."kind" = 'image' AND "media_assets"."mime_type" IN ('image/jpeg', 'image/png', 'image/webp')) OR ("media_assets"."kind" = 'resume_pdf' AND "media_assets"."mime_type" = 'application/pdf'))
);
--> statement-breakpoint
CREATE TABLE "published_project_media" (
	"project_id" uuid NOT NULL,
	"media_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"alt_text" text NOT NULL,
	"is_cover" boolean NOT NULL,
	CONSTRAINT "published_project_media_project_media_unique" UNIQUE("project_id","media_id"),
	CONSTRAINT "published_project_media_project_position_unique" UNIQUE("project_id","position"),
	CONSTRAINT "published_project_media_position_positive" CHECK ("published_project_media"."position" > 0),
	CONSTRAINT "published_project_media_alt_text_non_blank" CHECK (btrim("published_project_media"."alt_text") <> '')
);
--> statement-breakpoint
ALTER TABLE "draft_project_media" ADD CONSTRAINT "draft_project_media_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "draft_project_media" ADD CONSTRAINT "draft_project_media_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_project_media" ADD CONSTRAINT "published_project_media_project_id_published_projects_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."published_projects"("project_id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "published_project_media" ADD CONSTRAINT "published_project_media_media_id_media_assets_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "draft_project_media_one_cover_per_project" ON "draft_project_media" USING btree ("project_id") WHERE "draft_project_media"."is_cover";--> statement-breakpoint
CREATE UNIQUE INDEX "published_project_media_one_cover_per_project" ON "published_project_media" USING btree ("project_id") WHERE "published_project_media"."is_cover";