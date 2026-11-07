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
