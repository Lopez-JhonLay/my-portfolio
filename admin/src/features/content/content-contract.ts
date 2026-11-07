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
  "contact",
] as const;
export type EditableContentSectionKey =
  (typeof EDITABLE_CONTENT_SECTION_KEYS)[number];

export type HeroDocument = {
  browserTitle: string;
  name: string;
  brand: string;
  role: string;
  heroRole: string;
  location: string;
  navigation: Array<{ label: string; href: string }>;
  sectionTag: string;
  title: string;
  description: string;
  resumeButtonLabel: string;
  scrollCue: string;
};

export type AboutDocument = {
  eyebrow: string;
  title: string;
  lead: string;
  paragraphs: string[];
  facts: Array<{ label: string; value: string }>;
  stamp: string;
  photoCaptionPrefix: string;
};

export type ContactDocument = {
  eyebrow: string;
  title: string;
  availability: string;
  noteTitle: string;
  noteBody: string;
  email: string;
  socialLinks: Array<{
    label: string;
    href: string;
    iconKey: "facebook" | "github" | "linkedin" | "external";
  }>;
  footerPrimary: string;
  footerSecondary: string;
};

export type EditableContentDocument =
  HeroDocument | AboutDocument | ContactDocument;

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
