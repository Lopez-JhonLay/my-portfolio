import { z } from "zod";

const nonEmptyTextSchema = z.string().trim().min(1);
const markdownSourceSchema = z
  .string()
  .refine((value) => value.trim().length > 0, "Markdown must not be blank");
const externalHttpUrlSchema = z.url().refine((value) => {
  if (!URL.canParse(value)) return false;

  const protocol = new URL(value).protocol;

  return protocol === "http:" || protocol === "https:";
}, "URL must use HTTP or HTTPS");

/** Stable category presentation order for the existing public portfolio. */
export const PROJECT_CATEGORY_ORDER = [
  "Personal Project",
  "Work Project",
  "Capstone Project",
] as const;

export const projectIdSchema = nonEmptyTextSchema.brand<"ProjectId">();
export const projectCategorySchema = z.enum(PROJECT_CATEGORY_ORDER);
export const projectLifecycleSchema = z.enum(["active", "trashed"]);
export const projectPublicationIntentSchema = z.enum(["include", "exclude"]);
export const projectGalleryItemSchema = z
  .strictObject({
    mediaId: z.uuid(),
    altText: nonEmptyTextSchema.max(300),
    isCover: z.boolean(),
  })
  .readonly();
export const projectGallerySchema = z
  .array(projectGalleryItemSchema)
  .max(5)
  .superRefine((gallery, context) => {
    if (
      new Set(gallery.map(({ mediaId }) => mediaId)).size !== gallery.length
    ) {
      context.addIssue({
        code: "custom",
        message: "Project gallery media must be distinct",
      });
    }
    const coverCount = gallery.filter(({ isCover }) => isCover).length;
    if (gallery.length > 0 && coverCount !== 1) {
      context.addIssue({
        code: "custom",
        message: "A non-empty Project gallery requires exactly one cover",
      });
    }
  })
  .readonly();

/** Transport-neutral content for one draft or published Project version. */
export const projectVersionSchema = z
  .strictObject({
    number: nonEmptyTextSchema,
    name: nonEmptyTextSchema,
    category: projectCategorySchema,
    description: nonEmptyTextSchema,
    role: nonEmptyTextSchema.optional(),
    tech: z.array(nonEmptyTextSchema).min(1).readonly(),
    repo: externalHttpUrlSchema.optional(),
    liveUrl: externalHttpUrlSchema.optional(),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid Project slug"),
    longDescriptionMarkdown: markdownSourceSchema.optional(),
    groupOrder: z.number().int().positive(),
  })
  .readonly();

/**
 * Protected Project state. Draft content remains independent from the current
 * public representation until an authorized publication operation succeeds.
 */
export const projectRecordSchema = z
  .strictObject({
    id: projectIdSchema,
    lifecycle: projectLifecycleSchema,
    publicationIntent: projectPublicationIntentSchema,
    draft: projectVersionSchema,
    published: projectVersionSchema.nullable(),
  })
  .superRefine((project, context) => {
    if (
      project.lifecycle === "trashed" &&
      project.publicationIntent !== "exclude"
    ) {
      context.addIssue({
        code: "custom",
        message: "Trashed Projects must be excluded from publication",
        path: ["publicationIntent"],
      });
    }
  })
  .readonly();

export const draftFeaturedSlotsSchema = z
  .tuple([
    projectIdSchema.nullable(),
    projectIdSchema.nullable(),
    projectIdSchema.nullable(),
  ])
  .readonly();

export const publishedFeaturedSlotsSchema = z
  .tuple([projectIdSchema, projectIdSchema, projectIdSchema])
  .superRefine((projectIds, context) => {
    if (new Set(projectIds).size !== projectIds.length) {
      context.addIssue({
        code: "custom",
        message: "Published featured slots must reference distinct Projects",
      });
    }
  })
  .readonly();

/**
 * Validates domain invariants for a complete publication candidate. It does
 * not define an API payload or decide the unresolved linkless-Project policy.
 */
export const projectPublishCandidateSchema = z
  .strictObject({
    projects: z.array(projectRecordSchema).readonly(),
    featuredProjectIds: publishedFeaturedSlotsSchema,
  })
  .superRefine((candidate, context) => {
    const projectIds = new Set<string>();

    for (const [index, project] of candidate.projects.entries()) {
      if (projectIds.has(project.id)) {
        context.addIssue({
          code: "custom",
          message: "Project IDs must be unique",
          path: ["projects", index, "id"],
        });
      }
      projectIds.add(project.id);
    }

    const eligibleProjects = candidate.projects.filter(
      (project) =>
        project.lifecycle === "active" &&
        project.publicationIntent === "include",
    );
    const eligibleProjectIds = new Set(
      eligibleProjects.map((project) => project.id),
    );
    const slugs = new Set<string>();
    const categoryPositions = new Set<string>();

    for (const project of eligibleProjects) {
      if (slugs.has(project.draft.slug)) {
        context.addIssue({
          code: "custom",
          message: "Included Project slugs must be unique",
          path: ["projects"],
        });
      }
      slugs.add(project.draft.slug);

      const categoryPosition = `${project.draft.category}:${project.draft.groupOrder}`;
      if (categoryPositions.has(categoryPosition)) {
        context.addIssue({
          code: "custom",
          message: "Project group order must be unique within each category",
          path: ["projects"],
        });
      }
      categoryPositions.add(categoryPosition);
    }

    for (const [
      slotIndex,
      projectId,
    ] of candidate.featuredProjectIds.entries()) {
      if (!eligibleProjectIds.has(projectId)) {
        context.addIssue({
          code: "custom",
          message: "Featured slots must reference eligible Projects",
          path: ["featuredProjectIds", slotIndex],
        });
      }
    }
  })
  .readonly();

export type ProjectId = z.output<typeof projectIdSchema>;
export type ProjectCategory = z.output<typeof projectCategorySchema>;
export type ProjectLifecycle = z.output<typeof projectLifecycleSchema>;
export type ProjectPublicationIntent = z.output<
  typeof projectPublicationIntentSchema
>;
export type ProjectGallery = z.output<typeof projectGallerySchema>;
export type ProjectVersion = z.output<typeof projectVersionSchema>;
export type ProjectRecord = z.output<typeof projectRecordSchema>;
export type DraftFeaturedSlots = z.output<typeof draftFeaturedSlotsSchema>;
export type PublishedFeaturedSlots = z.output<
  typeof publishedFeaturedSlotsSchema
>;
export type ProjectPublishCandidate = z.output<
  typeof projectPublishCandidateSchema
>;
