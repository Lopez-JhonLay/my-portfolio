import type {
  AboutDocument,
  ContactDocument,
  ContentFieldErrors,
  EditableContentDocument,
  EditableContentSectionKey,
  HeroDocument,
} from "./content-contract";

const NAVIGATION_DESTINATIONS = [
  "/#home",
  "/#about",
  "/#projects",
  "/#experience",
  "/#skills",
  "/#contact",
] as const;
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
  const navigation = document.navigation.map((item, index) => ({
    label: required(item.label, 80, `navigation.${index}.label`, errors),
    href: item.href,
  }));
  if (
    navigation.length !== 6 ||
    new Set(navigation.map(({ href }) => href)).size !== 6 ||
    navigation.some(
      ({ href }) =>
        !NAVIGATION_DESTINATIONS.includes(
          href as (typeof NAVIGATION_DESTINATIONS)[number],
        ),
    )
  ) {
    errors.navigation = "Keep one label for each fixed portfolio destination.";
  }
  return {
    browserTitle: required(document.browserTitle, 120, "browserTitle", errors),
    name: required(document.name, 120, "name", errors),
    brand: required(document.brand, 12, "brand", errors),
    role: required(document.role, 160, "role", errors),
    heroRole: required(document.heroRole, 120, "heroRole", errors),
    location: required(document.location, 160, "location", errors),
    navigation,
    sectionTag: required(document.sectionTag, 80, "sectionTag", errors),
    title: required(document.title, 160, "title", errors),
    description: required(document.description, 2_000, "description", errors),
    resumeButtonLabel: required(
      document.resumeButtonLabel,
      80,
      "resumeButtonLabel",
      errors,
    ),
    scrollCue: required(document.scrollCue, 80, "scrollCue", errors),
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
    eyebrow: required(document.eyebrow, 80, "eyebrow", errors),
    title: required(document.title, 160, "title", errors),
    lead: required(document.lead, 2_000, "lead", errors),
    paragraphs: document.paragraphs.map((paragraph, index) =>
      required(paragraph, 2_000, `paragraphs.${index}`, errors),
    ),
    facts: document.facts.map((fact, index) => ({
      label: required(fact.label, 80, `facts.${index}.label`, errors),
      value: required(fact.value, 240, `facts.${index}.value`, errors),
    })),
    stamp: required(document.stamp, 80, "stamp", errors),
    photoCaptionPrefix: required(
      document.photoCaptionPrefix,
      160,
      "photoCaptionPrefix",
      errors,
    ),
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
    eyebrow: required(document.eyebrow, 80, "eyebrow", errors),
    title: required(document.title, 160, "title", errors),
    availability: required(
      document.availability,
      2_000,
      "availability",
      errors,
    ),
    noteTitle: required(document.noteTitle, 160, "noteTitle", errors),
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
    footerPrimary: required(
      document.footerPrimary,
      240,
      "footerPrimary",
      errors,
    ),
    footerSecondary: required(
      document.footerSecondary,
      240,
      "footerSecondary",
      errors,
    ),
  };
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
        : validateContact(document as ContactDocument, errors);
  return Object.keys(errors).length === 0
    ? { document: normalized, errors }
    : { errors };
}
