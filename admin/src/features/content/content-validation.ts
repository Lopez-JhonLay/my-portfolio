import type {
  AboutDocument,
  ContactDocument,
  ContentFieldErrors,
  EditableContentDocument,
  EditableContentSectionKey,
  HeroDocument,
  MediaResumeDocument,
  TechnologiesDocument,
  TimelineDocument,
} from "./content-contract";

const SOCIAL_ICON_KEYS = [
  "facebook",
  "github",
  "linkedin",
  "external",
] as const;

function required(
  value: string,
  maximum: number,
  path: string,
  errors: Record<string, string>,
) {
  const normalized = value.trim();
  if (normalized.length === 0) errors[path] = "This field is required.";
  else if (normalized.length > maximum)
    errors[path] = `Use ${maximum} characters or fewer.`;
  return normalized;
}

function safeHttpUrl(value: string): boolean {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function validateHero(
  document: HeroDocument,
  errors: Record<string, string>,
): HeroDocument {
  return {
    name: required(document.name, 120, "name", errors),
    role: required(document.role, 160, "role", errors),
    heroRole: required(document.heroRole, 120, "heroRole", errors),
    location: required(document.location, 160, "location", errors),
    description: required(document.description, 2_000, "description", errors),
  };
}

function validateAbout(
  document: AboutDocument,
  errors: Record<string, string>,
): AboutDocument {
  if (document.paragraphs.length < 1 || document.paragraphs.length > 12)
    errors.paragraphs = "Keep between 1 and 12 paragraphs.";
  if (document.facts.length < 1 || document.facts.length > 12)
    errors.facts = "Keep between 1 and 12 facts.";
  return {
    paragraphs: document.paragraphs.map((paragraph, index) =>
      required(paragraph, 2_000, `paragraphs.${index}`, errors),
    ),
    facts: document.facts.map((fact, index) => ({
      label: required(fact.label, 80, `facts.${index}.label`, errors),
      value: required(fact.value, 240, `facts.${index}.value`, errors),
    })),
  };
}

function validateContact(
  document: ContactDocument,
  errors: Record<string, string>,
): ContactDocument {
  const email = document.email.trim();
  if (!/^\S+@\S+\.\S+$/.test(email))
    errors.email = "Enter a valid email address.";
  if (document.socialLinks.length > 12)
    errors.socialLinks = "Keep 12 social links or fewer.";
  return {
    availability: required(
      document.availability,
      2_000,
      "availability",
      errors,
    ),
    noteBody: required(document.noteBody, 2_000, "noteBody", errors),
    email,
    socialLinks: document.socialLinks.map((link, index) => {
      const href = link.href.trim();
      if (!safeHttpUrl(href))
        errors[`socialLinks.${index}.href`] = "Use a valid HTTP(S) URL.";
      if (!SOCIAL_ICON_KEYS.includes(link.iconKey))
        errors[`socialLinks.${index}.iconKey`] = "Choose an available icon.";
      return {
        label: required(link.label, 80, `socialLinks.${index}.label`, errors),
        href,
        iconKey: link.iconKey,
      };
    }),
  };
}

function validateTimeline(
  document: TimelineDocument,
  errors: Record<string, string>,
): TimelineDocument {
  if (document.entries.length < 1 || document.entries.length > 30)
    errors.entries = "Keep between 1 and 30 timeline entries.";
  return {
    entries: document.entries.map((entry, index) => ({
      role: required(entry.role, 160, `entries.${index}.role`, errors),
      organization: required(
        entry.organization,
        160,
        `entries.${index}.organization`,
        errors,
      ),
      location: required(
        entry.location,
        160,
        `entries.${index}.location`,
        errors,
      ),
      date: required(entry.date, 160, `entries.${index}.date`, errors),
      detail: required(entry.detail, 2_000, `entries.${index}.detail`, errors),
    })),
  };
}

function validateTechnologies(
  document: TechnologiesDocument,
  errors: Record<string, string>,
): TechnologiesDocument {
  if (document.groups.length < 1 || document.groups.length > 20)
    errors.groups = "Keep between 1 and 20 categories.";
  const groups = document.groups.map((group, groupIndex) => {
    if (group.technologies.length < 1 || group.technologies.length > 40)
      errors[`groups.${groupIndex}.technologies`] =
        "Keep between 1 and 40 technologies.";
    const technologies = group.technologies.map(
      (technology, technologyIndex) => ({
        name: required(
          technology.name,
          120,
          `groups.${groupIndex}.technologies.${technologyIndex}.name`,
          errors,
        ),
        ...(technology.iconKey ? { iconKey: technology.iconKey } : {}),
      }),
    );
    if (
      new Set(technologies.map(({ name }) => name.toLowerCase())).size !==
      technologies.length
    )
      errors[`groups.${groupIndex}.technologies`] =
        "Technology names must be unique in this category.";
    return {
      category: required(
        group.category,
        120,
        `groups.${groupIndex}.category`,
        errors,
      ),
      technologies,
    };
  });
  if (
    new Set(groups.map(({ category }) => category.toLowerCase())).size !==
    groups.length
  )
    errors.groups = "Category names must be unique.";
  return { groups };
}

export function validateEditableContent(
  sectionKey: EditableContentSectionKey,
  document: EditableContentDocument,
): {
  readonly document?: EditableContentDocument;
  readonly errors: ContentFieldErrors;
} {
  const errors: Record<string, string> = {};
  const normalized =
    sectionKey === "hero"
      ? validateHero(document as HeroDocument, errors)
      : sectionKey === "about"
        ? validateAbout(document as AboutDocument, errors)
        : sectionKey === "timeline"
          ? validateTimeline(document as TimelineDocument, errors)
          : sectionKey === "technologies"
            ? validateTechnologies(document as TechnologiesDocument, errors)
            : sectionKey === "media-resume"
              ? (document as MediaResumeDocument)
              : validateContact(document as ContactDocument, errors);
  return Object.keys(errors).length === 0
    ? { document: normalized, errors }
    : { errors };
}
