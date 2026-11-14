import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  foreignKey,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  PROJECT_CATEGORY_ORDER,
  type ProjectId,
} from "../../projects/project-contract.ts";
import {
  CONTENT_SECTION_KEYS,
  type ContentDocument,
  type ContentSectionKey,
} from "../../content/content-contract.ts";

export const projectCategoryEnum = pgEnum(
  "project_category",
  PROJECT_CATEGORY_ORDER,
);
export const projectLifecycleEnum = pgEnum("project_lifecycle", [
  "active",
  "trashed",
]);
export const projectPublicationIntentEnum = pgEnum(
  "project_publication_intent",
  ["include", "exclude"],
);
export const publishedSlugKindEnum = pgEnum("published_slug_kind", [
  "current",
  "redirect",
]);
export const projectOperationKindEnum = pgEnum("project_operation_kind", [
  "save_project_draft",
  "save_featured_draft",
  "save_content_draft",
  "publish",
]);
export const contentSectionKeyEnum = pgEnum(
  "content_section_key",
  CONTENT_SECTION_KEYS,
);
export const mediaAssetKindEnum = pgEnum("media_asset_kind", [
  "image",
  "resume_pdf",
]);
export const mediaAssetStatusEnum = pgEnum("media_asset_status", [
  "pending",
  "ready",
  "failed",
]);
export const projectOperationStatusEnum = pgEnum("project_operation_status", [
  "pending",
  "succeeded",
  "failed",
]);

const projectVersionColumns = () => ({
  number: text("number").notNull(),
  name: text("name").notNull(),
  category: projectCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  role: text("role"),
  tech: text("tech").array().notNull(),
  repo: text("repo"),
  liveUrl: text("live_url"),
  longDescriptionMarkdown: text("long_description_markdown"),
  groupOrder: integer("group_order").notNull(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").$type<ProjectId>().defaultRandom().primaryKey(),
    lifecycle: projectLifecycleEnum("lifecycle").notNull(),
    publicationIntent:
      projectPublicationIntentEnum("publication_intent").notNull(),
    draftRevision: bigint("draft_revision", { mode: "bigint" })
      .default(sql`1`)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("projects_draft_revision_positive", sql`${table.draftRevision} > 0`),
    check(
      "projects_trashed_excluded",
      sql`${table.lifecycle} <> 'trashed' OR ${table.publicationIntent} = 'exclude'`,
    ),
  ],
);

export const projectDrafts = pgTable(
  "project_drafts",
  {
    projectId: uuid("project_id")
      .$type<ProjectId>()
      .primaryKey()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    ...projectVersionColumns(),
    slug: text("slug").notNull(),
  },
  (table) => [
    check("project_drafts_number_non_blank", sql`btrim(${table.number}) <> ''`),
    check("project_drafts_name_non_blank", sql`btrim(${table.name}) <> ''`),
    check(
      "project_drafts_description_non_blank",
      sql`btrim(${table.description}) <> ''`,
    ),
    check(
      "project_drafts_role_non_blank",
      sql`${table.role} IS NULL OR btrim(${table.role}) <> ''`,
    ),
    check(
      "project_drafts_tech_non_empty",
      sql`array_ndims(${table.tech}) = 1 AND cardinality(${table.tech}) > 0`,
    ),
    check(
      "project_drafts_tech_values_present",
      sql`array_position(${table.tech}, NULL) IS NULL AND array_position(${table.tech}, '') IS NULL`,
    ),
    check(
      "project_drafts_repo_http_url",
      sql`${table.repo} IS NULL OR ${table.repo} ~ '^https?://'`,
    ),
    check(
      "project_drafts_live_url_http_url",
      sql`${table.liveUrl} IS NULL OR ${table.liveUrl} ~ '^https?://'`,
    ),
    check(
      "project_drafts_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    check(
      "project_drafts_markdown_non_blank",
      sql`${table.longDescriptionMarkdown} IS NULL OR btrim(${table.longDescriptionMarkdown}) <> ''`,
    ),
    check("project_drafts_group_order_positive", sql`${table.groupOrder} > 0`),
  ],
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    kind: mediaAssetKindEnum("kind").notNull(),
    objectKey: text("object_key").notNull(),
    mimeType: text("mime_type").notNull(),
    byteSize: bigint("byte_size", { mode: "bigint" }).notNull(),
    originalFilename: text("original_filename").notNull(),
    status: mediaAssetStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("media_assets_object_key_unique").on(table.objectKey),
    check(
      "media_assets_object_key_non_blank",
      sql`btrim(${table.objectKey}) <> ''`,
    ),
    check(
      "media_assets_mime_type_non_blank",
      sql`btrim(${table.mimeType}) <> ''`,
    ),
    check("media_assets_byte_size_positive", sql`${table.byteSize} > 0`),
    check(
      "media_assets_original_filename_non_blank",
      sql`btrim(${table.originalFilename}) <> ''`,
    ),
    check(
      "media_assets_kind_mime_type",
      sql`(${table.kind} = 'image' AND ${table.mimeType} IN ('image/jpeg', 'image/png', 'image/webp')) OR (${table.kind} = 'resume_pdf' AND ${table.mimeType} = 'application/pdf')`,
    ),
  ],
);

export const draftProjectMedia = pgTable(
  "draft_project_media",
  {
    projectId: uuid("project_id")
      .$type<ProjectId>()
      .notNull()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    position: integer("position").notNull(),
    altText: text("alt_text").notNull(),
    isCover: boolean("is_cover").notNull(),
  },
  (table) => [
    unique("draft_project_media_project_media_unique").on(
      table.projectId,
      table.mediaId,
    ),
    unique("draft_project_media_project_position_unique").on(
      table.projectId,
      table.position,
    ),
    uniqueIndex("draft_project_media_one_cover_per_project")
      .on(table.projectId)
      .where(sql`${table.isCover}`),
    check("draft_project_media_position_positive", sql`${table.position} > 0`),
    check(
      "draft_project_media_alt_text_non_blank",
      sql`btrim(${table.altText}) <> ''`,
    ),
  ],
);

export const draftFeaturedState = pgTable(
  "draft_featured_state",
  {
    singletonId: integer("singleton_id").default(1).primaryKey(),
    slot1ProjectId: uuid("slot_1_project_id")
      .$type<ProjectId>()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    slot2ProjectId: uuid("slot_2_project_id")
      .$type<ProjectId>()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    slot3ProjectId: uuid("slot_3_project_id")
      .$type<ProjectId>()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    revision: bigint("revision", { mode: "bigint" })
      .default(sql`1`)
      .notNull(),
  },
  (table) => [
    check("draft_featured_state_singleton", sql`${table.singletonId} = 1`),
    check("draft_featured_state_revision_positive", sql`${table.revision} > 0`),
  ],
);

export const publishedProjects = pgTable(
  "published_projects",
  {
    projectId: uuid("project_id")
      .$type<ProjectId>()
      .primaryKey()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    ...projectVersionColumns(),
  },
  (table) => [
    check(
      "published_projects_number_non_blank",
      sql`btrim(${table.number}) <> ''`,
    ),
    check("published_projects_name_non_blank", sql`btrim(${table.name}) <> ''`),
    check(
      "published_projects_description_non_blank",
      sql`btrim(${table.description}) <> ''`,
    ),
    check(
      "published_projects_role_non_blank",
      sql`${table.role} IS NULL OR btrim(${table.role}) <> ''`,
    ),
    check(
      "published_projects_tech_non_empty",
      sql`array_ndims(${table.tech}) = 1 AND cardinality(${table.tech}) > 0`,
    ),
    check(
      "published_projects_tech_values_present",
      sql`array_position(${table.tech}, NULL) IS NULL AND array_position(${table.tech}, '') IS NULL`,
    ),
    check(
      "published_projects_repo_http_url",
      sql`${table.repo} IS NULL OR ${table.repo} ~ '^https?://'`,
    ),
    check(
      "published_projects_live_url_http_url",
      sql`${table.liveUrl} IS NULL OR ${table.liveUrl} ~ '^https?://'`,
    ),
    check(
      "published_projects_markdown_non_blank",
      sql`${table.longDescriptionMarkdown} IS NULL OR btrim(${table.longDescriptionMarkdown}) <> ''`,
    ),
    check(
      "published_projects_group_order_positive",
      sql`${table.groupOrder} > 0`,
    ),
    unique("published_projects_category_group_order_unique").on(
      table.category,
      table.groupOrder,
    ),
  ],
);

export const publishedProjectMedia = pgTable(
  "published_project_media",
  {
    projectId: uuid("project_id")
      .$type<ProjectId>()
      .notNull()
      .references(() => publishedProjects.projectId, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => mediaAssets.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    position: integer("position").notNull(),
    altText: text("alt_text").notNull(),
    isCover: boolean("is_cover").notNull(),
  },
  (table) => [
    unique("published_project_media_project_media_unique").on(
      table.projectId,
      table.mediaId,
    ),
    unique("published_project_media_project_position_unique").on(
      table.projectId,
      table.position,
    ),
    uniqueIndex("published_project_media_one_cover_per_project")
      .on(table.projectId)
      .where(sql`${table.isCover}`),
    check(
      "published_project_media_position_positive",
      sql`${table.position} > 0`,
    ),
    check(
      "published_project_media_alt_text_non_blank",
      sql`btrim(${table.altText}) <> ''`,
    ),
  ],
);

export const projectOperations = pgTable(
  "project_operations",
  {
    operationId: text("operation_id").primaryKey(),
    kind: projectOperationKindEnum("kind").notNull(),
    projectId: uuid("project_id")
      .$type<ProjectId>()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    contentSectionKey: contentSectionKeyEnum(
      "content_section_key",
    ).$type<ContentSectionKey>(),
    requestFingerprint: text("request_fingerprint").notNull(),
    status: projectOperationStatusEnum("status").default("pending").notNull(),
    outcomeCode: text("outcome_code"),
    resultRevision: bigint("result_revision", { mode: "bigint" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "project_operations_operation_id_non_blank",
      sql`btrim(${table.operationId}) <> ''`,
    ),
    check(
      "project_operations_fingerprint_non_blank",
      sql`btrim(${table.requestFingerprint}) <> ''`,
    ),
    check(
      "project_operations_target_matches_kind",
      sql`(${table.kind}::text = 'save_project_draft' AND ${table.projectId} IS NOT NULL AND ${table.contentSectionKey} IS NULL) OR (${table.kind}::text = 'save_content_draft' AND ${table.projectId} IS NULL AND ${table.contentSectionKey} IS NOT NULL) OR (${table.kind}::text IN ('save_featured_draft', 'publish') AND ${table.projectId} IS NULL AND ${table.contentSectionKey} IS NULL)`,
    ),
    check(
      "project_operations_result_revision_positive",
      sql`${table.resultRevision} IS NULL OR ${table.resultRevision} > 0`,
    ),
    check(
      "project_operations_outcome_code_non_blank",
      sql`${table.outcomeCode} IS NULL OR btrim(${table.outcomeCode}) <> ''`,
    ),
    check(
      "project_operations_completion_matches_status",
      sql`(${table.status} = 'pending' AND ${table.completedAt} IS NULL AND ${table.outcomeCode} IS NULL AND ${table.resultRevision} IS NULL) OR (${table.status} <> 'pending' AND ${table.completedAt} IS NOT NULL)`,
    ),
  ],
);

export const contentSectionDrafts = pgTable(
  "content_section_drafts",
  {
    sectionKey: contentSectionKeyEnum("section_key")
      .$type<ContentSectionKey>()
      .primaryKey(),
    document: jsonb("document").$type<ContentDocument>().notNull(),
    revision: bigint("revision", { mode: "bigint" })
      .default(sql`1`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "content_section_drafts_revision_positive",
      sql`${table.revision} > 0`,
    ),
    check(
      "content_section_drafts_document_object",
      sql`jsonb_typeof(${table.document}) = 'object'`,
    ),
  ],
);

export const publishedContentSections = pgTable(
  "published_content_sections",
  {
    sectionKey: contentSectionKeyEnum("section_key")
      .$type<ContentSectionKey>()
      .primaryKey(),
    document: jsonb("document").$type<ContentDocument>().notNull(),
  },
  (table) => [
    check(
      "published_content_sections_document_object",
      sql`jsonb_typeof(${table.document}) = 'object'`,
    ),
  ],
);

export const publishedState = pgTable(
  "published_state",
  {
    singletonId: integer("singleton_id").default(1).primaryKey(),
    snapshotRevision: bigint("snapshot_revision", { mode: "bigint" }).notNull(),
    operationId: text("operation_id")
      .notNull()
      .references(() => projectOperations.operationId, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    slot1ProjectId: uuid("slot_1_project_id").$type<ProjectId>().notNull(),
    slot2ProjectId: uuid("slot_2_project_id").$type<ProjectId>().notNull(),
    slot3ProjectId: uuid("slot_3_project_id").$type<ProjectId>().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    foreignKey({
      name: "published_state_featured_slot_1_project_fk",
      columns: [table.slot1ProjectId],
      foreignColumns: [publishedProjects.projectId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    foreignKey({
      name: "published_state_featured_slot_2_project_fk",
      columns: [table.slot2ProjectId],
      foreignColumns: [publishedProjects.projectId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    foreignKey({
      name: "published_state_featured_slot_3_project_fk",
      columns: [table.slot3ProjectId],
      foreignColumns: [publishedProjects.projectId],
    })
      .onDelete("restrict")
      .onUpdate("restrict"),
    check("published_state_singleton", sql`${table.singletonId} = 1`),
    check(
      "published_state_snapshot_revision_positive",
      sql`${table.snapshotRevision} > 0`,
    ),
    check(
      "published_state_featured_projects_distinct",
      sql`${table.slot1ProjectId} <> ${table.slot2ProjectId} AND ${table.slot1ProjectId} <> ${table.slot3ProjectId} AND ${table.slot2ProjectId} <> ${table.slot3ProjectId}`,
    ),
  ],
);

export const publishedSlugs = pgTable(
  "published_slugs",
  {
    slug: text("slug").primaryKey(),
    projectId: uuid("project_id")
      .$type<ProjectId>()
      .notNull()
      .references(() => projects.id, {
        onDelete: "restrict",
        onUpdate: "restrict",
      }),
    kind: publishedSlugKindEnum("kind").notNull(),
  },
  (table) => [
    check(
      "published_slugs_slug_format",
      sql`${table.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`,
    ),
    uniqueIndex("published_slugs_one_current_per_project")
      .on(table.projectId)
      .where(sql`${table.kind} = 'current'`),
  ],
);
