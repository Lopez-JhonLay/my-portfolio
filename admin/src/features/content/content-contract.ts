export const CONTENT_SECTION_KEYS = [
  "hero",
  "about",
  "projects-presentation",
  "timeline",
  "technologies",
  "contact",
  "media-resume",
] as const;

export type ContentSectionKey = (typeof CONTENT_SECTION_KEYS)[number];

export type ContentSectionSummary = {
  readonly sectionKey: ContentSectionKey;
  readonly revision: string;
  readonly isPublished: boolean;
};

export const EDITABLE_CONTENT_SECTION_KEYS = [
  "hero",
  "about",
  "timeline",
  "technologies",
  "contact",
  "media-resume",
] as const;
export type EditableContentSectionKey =
  (typeof EDITABLE_CONTENT_SECTION_KEYS)[number];

export type HeroDocument = {
  name: string;
  role: string;
  heroRole: string;
  location: string;
  description: string;
};

export type AboutDocument = {
  paragraphs: string[];
  facts: Array<{ label: string; value: string }>;
};

export type ContactDocument = {
  availability: string;
  noteBody: string;
  email: string;
  socialLinks: Array<{
    label: string;
    href: string;
    iconKey: "facebook" | "github" | "linkedin" | "external";
  }>;
};

export type TimelineDocument = {
  entries: Array<{
    role: string;
    organization: string;
    location: string;
    date: string;
    detail: string;
  }>;
};

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

export type TechnologyIconKey = (typeof TECHNOLOGY_ICON_KEYS)[number];

export type TechnologiesDocument = {
  groups: Array<{
    category: string;
    technologies: Array<{ name: string; iconKey?: TechnologyIconKey }>;
  }>;
};

export type MediaResumeDocument = {
  profileImageMediaId: string | null;
  resumeMediaId: string | null;
};

export type EditableContentDocument =
  | HeroDocument
  | AboutDocument
  | TimelineDocument
  | TechnologiesDocument
  | ContactDocument
  | MediaResumeDocument;

export type AdminContentSection = {
  readonly sectionKey: EditableContentSectionKey;
  readonly revision: string;
  readonly isPublished: boolean;
  readonly document: EditableContentDocument;
};

export type ContentSaveOperation =
  | {
      readonly operationId: string;
      readonly kind: "save_content_draft";
      readonly sectionKey: EditableContentSectionKey;
      readonly status: "pending";
    }
  | {
      readonly operationId: string;
      readonly kind: "save_content_draft";
      readonly sectionKey: EditableContentSectionKey;
      readonly status: "succeeded" | "failed";
      readonly outcomeCode: "content_draft_saved" | "stale_revision";
      readonly resultRevision: string;
    };

export type ContentSaveResult = AdminContentSection | ContentSaveOperation;

export type ContentFieldErrors = Readonly<Record<string, string>>;
