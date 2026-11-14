import { z } from "zod";

import {
  PROJECT_CATEGORY_ORDER,
  projectVersionSchema,
} from "./project-contract.ts";

const projectVersionObjectSchema = projectVersionSchema.unwrap();
export const publicProjectImageSchema = z
  .strictObject({
    mediaId: z.uuid(),
    altText: z.string().trim().min(1).max(300),
  })
  .readonly();
const publicProjectCardObjectSchema = projectVersionObjectSchema
  .omit({
    groupOrder: true,
    longDescriptionMarkdown: true,
  })
  .extend({ cover: publicProjectImageSchema.optional() });

/** Published Project fields allowed on public collection responses. */
export const publicProjectCardSchema = publicProjectCardObjectSchema.readonly();

/** Published Project fields allowed on the public detail response. */
export const publicProjectDetailSchema = publicProjectCardObjectSchema
  .extend({
    longDescriptionMarkdown:
      projectVersionObjectSchema.shape.longDescriptionMarkdown,
    gallery: z.array(publicProjectImageSchema).max(5).default([]).readonly(),
  })
  .readonly();

function createPublicProjectGroupSchema<
  Category extends (typeof PROJECT_CATEGORY_ORDER)[number],
>(category: Category) {
  return z
    .strictObject({
      category: z.literal(category),
      projects: z
        .array(
          publicProjectCardObjectSchema
            .extend({ category: z.literal(category) })
            .readonly(),
        )
        .readonly(),
    })
    .readonly();
}

/** Public grouped response in fixed Personal, Work, then Capstone order. */
export const publicProjectGroupsSchema = z
  .tuple([
    createPublicProjectGroupSchema(PROJECT_CATEGORY_ORDER[0]),
    createPublicProjectGroupSchema(PROJECT_CATEGORY_ORDER[1]),
    createPublicProjectGroupSchema(PROJECT_CATEGORY_ORDER[2]),
  ])
  .readonly();

const featuredProjectsSchema = z
  .tuple([
    publicProjectCardSchema,
    publicProjectCardSchema,
    publicProjectCardSchema,
  ])
  .superRefine((projects, context) => {
    const slugs = new Set<string>();

    for (const [index, project] of projects.entries()) {
      if (slugs.has(project.slug)) {
        context.addIssue({
          code: "custom",
          message: "Featured Projects must have distinct published slugs",
          path: [index, "slug"],
        });
      }
      slugs.add(project.slug);
    }
  })
  .readonly();

/** Exactly three independently ordered public featured Project cards. */
export const publicFeaturedProjectsSchema = z
  .strictObject({ projects: featuredProjectsSchema })
  .readonly();

/** Public source-authority state without publication operation metadata. */
export const publicProjectStatusSchema = z
  .strictObject({ status: z.enum(["never-published", "published"]) })
  .readonly();

export type PublicProjectCardDto = z.output<typeof publicProjectCardSchema>;
export type PublicProjectDetailDto = z.output<typeof publicProjectDetailSchema>;
export type PublicProjectGroupsDto = z.output<typeof publicProjectGroupsSchema>;
export type PublicProjectStatusDto = z.output<typeof publicProjectStatusSchema>;
export type PublicFeaturedProjectsDto = z.output<
  typeof publicFeaturedProjectsSchema
>;
