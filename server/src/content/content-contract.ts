import { z } from "zod";

export const CONTENT_SECTION_KEYS = [
  "hero",
  "about",
  "projects-presentation",
  "timeline",
  "technologies",
  "contact",
  "media-resume",
] as const;

export const contentSectionKeySchema = z.enum(CONTENT_SECTION_KEYS);

const requiredText = (maximum: number) => z.string().trim().min(1).max(maximum);
const label = requiredText(80);
const paragraph = requiredText(2_000);
const httpUrl = z.url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}, "URL must use HTTP or HTTPS");

export const heroContentSchema = z.object({
  name: requiredText(120),
  role: requiredText(160),
  heroRole: requiredText(120),
  location: requiredText(160),
  description: paragraph,
});

export const aboutContentSchema = z.object({
  paragraphs: z.array(paragraph).min(1).max(12),
  facts: z
    .array(z.strictObject({ label, value: requiredText(240) }))
    .min(1)
    .max(12),
});

const projectGroupPresentationSchema = z.strictObject({
  category: z.enum(["Personal Project", "Work Project", "Capstone Project"]),
  eyebrow: label,
  title: requiredText(160),
  emptyText: paragraph.optional(),
});

export const projectsPresentationContentSchema = z
  .strictObject({
    eyebrow: label,
    title: requiredText(160),
    lead: paragraph,
    allProjectsLinkLabel: label,
    backLinkLabel: label,
    groups: z.tuple([
      projectGroupPresentationSchema,
      projectGroupPresentationSchema,
      projectGroupPresentationSchema,
    ]),
  })
  .superRefine((value, context) => {
    const expected = ["Personal Project", "Work Project", "Capstone Project"];
    if (
      value.groups.some((group, index) => group.category !== expected[index])
    ) {
      context.addIssue({
        code: "custom",
        message:
          "Project presentation groups must use the fixed category order",
        path: ["groups"],
      });
    }
  });

export const timelineContentSchema = z.object({
  entries: z
    .array(
      z.strictObject({
        role: requiredText(160),
        organization: requiredText(160),
        location: requiredText(160),
        date: requiredText(160),
        detail: paragraph,
      }),
    )
    .min(1)
    .max(30),
});

export const TECHNOLOGY_ICON_KEYS = [
  "bigquery",
  "cloudflare",
  "cloudflare-workers",
  "git",
  "github",
  "github-actions",
  "google-cloud",
  "javascript",
  "jwt",
  "material-ui",
  "nestjs",
  "nextjs",
  "nodejs",
  "postgresql",
  "react",
  "tailwind-css",
  "typescript",
  "vue",
] as const;

const technologySchema = z.strictObject({
  name: requiredText(120),
  iconKey: z.enum(TECHNOLOGY_ICON_KEYS).optional(),
});

export const technologiesContentSchema = z
  .object({
    groups: z
      .array(
        z.strictObject({
          category: requiredText(120),
          technologies: z.array(technologySchema).min(1).max(40),
        }),
      )
      .min(1)
      .max(20),
  })
  .superRefine((value, context) => {
    const categories = value.groups.map(({ category }) =>
      category.toLowerCase(),
    );
    if (new Set(categories).size !== categories.length) {
      context.addIssue({
        code: "custom",
        message: "Technology categories must be unique",
        path: ["groups"],
      });
    }
    value.groups.forEach((group, groupIndex) => {
      const names = group.technologies.map(({ name }) => name.toLowerCase());
      if (new Set(names).size !== names.length) {
        context.addIssue({
          code: "custom",
          message: "Technology names must be unique within a category",
          path: ["groups", groupIndex, "technologies"],
        });
      }
    });
  });

export const SOCIAL_ICON_KEYS = [
  "facebook",
  "github",
  "linkedin",
  "external",
] as const;

export const contactContentSchema = z.object({
  availability: paragraph,
  noteBody: paragraph,
  email: z.email(),
  socialLinks: z
    .array(
      z.strictObject({
        label,
        href: httpUrl,
        iconKey: z.enum(SOCIAL_ICON_KEYS),
      }),
    )
    .max(12),
});

export const mediaResumeContentSchema = z.strictObject({
  profileImageMediaId: z.uuid().nullable(),
  resumeMediaId: z.uuid().nullable(),
});

export const contentDocumentSchemas = {
  hero: heroContentSchema,
  about: aboutContentSchema,
  "projects-presentation": projectsPresentationContentSchema,
  timeline: timelineContentSchema,
  technologies: technologiesContentSchema,
  contact: contactContentSchema,
  "media-resume": mediaResumeContentSchema,
} as const;

export type ContentSectionKey = z.output<typeof contentSectionKeySchema>;
export type ContentDocument = z.output<
  (typeof contentDocumentSchemas)[ContentSectionKey]
>;

export function parseContentDocument(
  sectionKey: ContentSectionKey,
  document: unknown,
): ContentDocument {
  return contentDocumentSchemas[sectionKey].parse(document);
}

export type ContentSectionRecord = {
  readonly sectionKey: ContentSectionKey;
  readonly revision: bigint;
  readonly document: ContentDocument;
};
