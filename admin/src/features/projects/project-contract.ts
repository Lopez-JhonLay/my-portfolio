export const PROJECT_CATEGORIES = [
  "Personal Project",
  "Work Project",
  "Capstone Project",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export type ProjectDraft = {
  readonly number: string;
  readonly name: string;
  readonly category: ProjectCategory;
  readonly description: string;
  readonly role?: string;
  readonly tech: readonly string[];
  readonly repo?: string;
  readonly liveUrl?: string;
  readonly slug: string;
  readonly longDescriptionMarkdown?: string;
  readonly groupOrder: number;
};

export type ProjectGalleryItem = {
  readonly mediaId: string;
  readonly altText: string;
  readonly isCover: boolean;
};

export type ProjectGallery = readonly ProjectGalleryItem[];

export type AdminProject = {
  readonly id: string;
  readonly lifecycle: "active" | "trashed";
  readonly publicationIntent: "include" | "exclude";
  readonly revision: string;
  readonly draft: ProjectDraft;
  readonly gallery?: ProjectGallery;
};

export type ProjectList = {
  readonly projects: readonly AdminProject[];
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
};

export type DraftOperation =
  | {
      readonly operationId: string;
      readonly kind: "save_project_draft" | "save_featured_draft";
      readonly projectId: string | null;
      readonly status: "pending";
    }
  | {
      readonly operationId: string;
      readonly kind: "save_project_draft" | "save_featured_draft";
      readonly projectId: string | null;
      readonly status: "succeeded" | "failed";
      readonly outcomeCode:
        | "project_draft_created"
        | "project_draft_saved"
        | "featured_draft_saved"
        | "stale_revision"
        | "invalid_featured_reference"
        | "invalid_gallery_reference";
      readonly resultRevision: string;
    };

export type SaveResult = AdminProject | DraftOperation;

export type PublicationOperation =
  | {
      readonly operationId: string;
      readonly kind: "publish";
      readonly status: "pending";
    }
  | {
      readonly operationId: string;
      readonly kind: "publish";
      readonly status: "succeeded";
      readonly outcomeCode: "published";
      readonly snapshotRevision: string;
    }
  | {
      readonly operationId: string;
      readonly kind: "publish";
      readonly status: "failed";
      readonly outcomeCode: "publish_not_ready";
    };

export type FeaturedDraft = {
  readonly revision: string;
  readonly slots: readonly [string | null, string | null, string | null];
};

export type SaveFeaturedResult = FeaturedDraft | DraftOperation;

export type ProjectFormValue = {
  readonly number: string;
  readonly name: string;
  readonly category: ProjectCategory;
  readonly description: string;
  readonly role: string;
  readonly tech: string;
  readonly repo: string;
  readonly liveUrl: string;
  readonly slug: string;
  readonly longDescriptionMarkdown: string;
  readonly groupOrder: string;
  readonly gallery: ProjectGallery;
};

export type ProjectFormErrors = Partial<Record<keyof ProjectFormValue, string>>;

export const EMPTY_PROJECT_FORM: ProjectFormValue = {
  number: "",
  name: "",
  category: "Personal Project",
  description: "",
  role: "",
  tech: "",
  repo: "",
  liveUrl: "",
  slug: "",
  longDescriptionMarkdown: "",
  groupOrder: "1",
  gallery: [],
};

export function projectToForm(project: AdminProject): ProjectFormValue {
  return {
    number: project.draft.number,
    name: project.draft.name,
    category: project.draft.category,
    description: project.draft.description,
    role: project.draft.role ?? "",
    tech: project.draft.tech.join("\n"),
    repo: project.draft.repo ?? "",
    liveUrl: project.draft.liveUrl ?? "",
    slug: project.draft.slug,
    longDescriptionMarkdown: project.draft.longDescriptionMarkdown ?? "",
    groupOrder: String(project.draft.groupOrder),
    gallery: project.gallery ?? [],
  };
}

function optionalText(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

function isHttpUrl(value: string): boolean {
  if (!URL.canParse(value)) return false;
  const protocol = new URL(value).protocol;
  return protocol === "http:" || protocol === "https:";
}

export function validateProjectForm(value: ProjectFormValue): {
  readonly draft?: ProjectDraft;
  readonly gallery?: ProjectGallery;
  readonly errors: ProjectFormErrors;
} {
  const errors: ProjectFormErrors = {};
  const required = [
    ["number", "Display number"],
    ["name", "Name"],
    ["description", "Short description"],
  ] as const;

  for (const [field, label] of required) {
    if (value[field].trim().length === 0)
      errors[field] = `${label} is required.`;
  }
  const technologies = value.tech
    .split(/[,\n]/)
    .map((technology) => technology.trim())
    .filter((technology) => technology.length > 0);
  if (technologies.length === 0) errors.tech = "Add at least one technology.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug.trim()))
    errors.slug = "Use lowercase letters, numbers, and single hyphens.";
  const groupOrder = Number(value.groupOrder);
  if (!Number.isInteger(groupOrder) || groupOrder <= 0)
    errors.groupOrder = "Order must be a positive whole number.";
  for (const field of ["repo", "liveUrl"] as const) {
    const url = value[field].trim();
    if (url.length > 0 && !isHttpUrl(url))
      errors[field] = "Use a complete HTTP or HTTPS URL.";
  }
  if (
    value.longDescriptionMarkdown.trim().length === 0 &&
    value.longDescriptionMarkdown.length > 0
  )
    errors.longDescriptionMarkdown = "Markdown cannot contain only spaces.";
  if (value.gallery.length > 5)
    errors.gallery = "Use no more than five images.";
  if (
    value.gallery.some(({ altText }) => altText.trim().length === 0) ||
    (value.gallery.length > 0 &&
      value.gallery.filter(({ isCover }) => isCover).length !== 1) ||
    new Set(value.gallery.map(({ mediaId }) => mediaId)).size !==
      value.gallery.length
  )
    errors.gallery =
      "Gallery images need distinct files, alt text, and exactly one cover.";

  if (Object.keys(errors).length > 0) return { errors };

  return {
    errors,
    gallery: value.gallery.map((item) => ({
      ...item,
      altText: item.altText.trim(),
    })),
    draft: {
      number: value.number.trim(),
      name: value.name.trim(),
      category: value.category,
      description: value.description.trim(),
      ...(optionalText(value.role) === undefined
        ? {}
        : { role: optionalText(value.role) }),
      tech: technologies,
      ...(optionalText(value.repo) === undefined
        ? {}
        : { repo: optionalText(value.repo) }),
      ...(optionalText(value.liveUrl) === undefined
        ? {}
        : { liveUrl: optionalText(value.liveUrl) }),
      slug: value.slug.trim(),
      ...(optionalText(value.longDescriptionMarkdown) === undefined
        ? {}
        : {
            longDescriptionMarkdown: optionalText(
              value.longDescriptionMarkdown,
            ),
          }),
      groupOrder,
    },
  };
}
