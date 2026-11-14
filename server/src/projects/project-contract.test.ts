import { describe, expect, it } from "vitest";

import {
  PROJECT_CATEGORY_ORDER,
  draftFeaturedSlotsSchema,
  projectPublishCandidateSchema,
  projectGallerySchema,
  projectRecordSchema,
  projectVersionSchema,
  publishedFeaturedSlotsSchema,
} from "./project-contract.ts";

const legacyProjects = [
  {
    id: "ya-gameela",
    lifecycle: "active",
    publicationIntent: "include",
    draft: {
      number: "File 01",
      name: "Ya Gameela",
      category: "Personal Project",
      description:
        "A product catalog and custom content management system for a lifestyle brand, built around storefront and publishing workflows.",
      tech: ["Next.js", "TypeScript", "Prisma", "Neon", "Cloudinary"],
      repo: "https://github.com/Lopez-JhonLay/ya-gameela",
      liveUrl: "https://ya-gameela-web.vercel.app/",
      slug: "ya-gameela",
      groupOrder: 1,
    },
    published: null,
  },
  {
    id: "devflow",
    lifecycle: "active",
    publicationIntent: "include",
    draft: {
      number: "File 02",
      name: "DevFlow",
      category: "Personal Project",
      description:
        "A full-stack developer workspace for organizing projects, Markdown documentation, assets, and reusable code snippets.",
      tech: ["React", "NestJS", "PostgreSQL"],
      repo: "https://github.com/Lopez-JhonLay/devflow",
      liveUrl: "https://devflow-five-iota.vercel.app/login",
      slug: "devflow",
      groupOrder: 2,
    },
    published: null,
  },
  {
    id: "rental-bill-management-system",
    lifecycle: "active",
    publicationIntent: "include",
    draft: {
      number: "File 03",
      name: "Rental Bill Management System",
      category: "Personal Project",
      description:
        "A rental management app for tracking units, tenants, utility readings, and monthly bills with saved rate details.",
      tech: ["React", "NestJS", "Prisma"],
      repo: "https://github.com/Lopez-JhonLay/rental-bill-management-system",
      liveUrl: "https://rental-bill-management-system.vercel.app/",
      slug: "rental-bill-management-system",
      groupOrder: 3,
    },
    published: null,
  },
  {
    id: "classroom-randomizer",
    lifecycle: "active",
    publicationIntent: "include",
    draft: {
      number: "File 04",
      name: "Classroom Randomizer",
      category: "Personal Project",
      description:
        "A classroom tool for managing student lists and selecting students fairly with an animated result.",
      tech: ["Next.js", "Prisma", "PostgreSQL"],
      repo: "https://github.com/Lopez-JhonLay/classroom-randomizer",
      liveUrl: "https://classroom-randomizer.vercel.app/",
      slug: "classroom-randomizer",
      groupOrder: 4,
    },
    published: null,
  },
  {
    id: "lottomatik-marketing-website",
    lifecycle: "active",
    publicationIntent: "include",
    draft: {
      number: "File 05",
      name: "LottoMatik Marketing Website",
      category: "Work Project",
      description:
        "Developed and maintained responsive public pages and interactive features, including an Agent Locator with Google Maps, location search, filtering, and API-driven agent data.",
      role: "Application Developer at DFNN Inc.",
      tech: ["Next.js", "Material UI", "Google Maps API"],
      liveUrl: "https://lottomatik.com/",
      slug: "lottomatik-marketing-website",
      groupOrder: 1,
    },
    published: null,
  },
  {
    id: "barangay-information-system",
    lifecycle: "active",
    publicationIntent: "include",
    draft: {
      number: "File 06",
      name: "Barangay Information System",
      category: "Capstone Project",
      description:
        "A team-built information system for Brgy. Central Bicutan, Taguig, focused on practical local-service workflows.",
      role: "Capstone contributor",
      tech: ["React", "Full-stack", "Records"],
      repo: "https://github.com/PUPT-2025-CAPRO-BIS",
      slug: "barangay-information-system",
      groupOrder: 1,
    },
    published: null,
  },
] as const;

function createProjectRecord(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "project-one",
    lifecycle: "active",
    publicationIntent: "include",
    draft: {
      number: "File 01",
      name: "Project One",
      category: "Personal Project",
      description: "A plain-text card description.",
      tech: ["TypeScript"],
      slug: "project-one",
      groupOrder: 1,
    },
    published: null,
    ...overrides,
  };
}

describe("Project domain contract", () => {
  it("preserves all six legacy projects and their existing ordering", () => {
    const result = projectPublishCandidateSchema.safeParse({
      projects: legacyProjects,
      featuredProjectIds: [
        "ya-gameela",
        "devflow",
        "rental-bill-management-system",
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.projects.map(({ draft }) => draft.number)).toEqual([
      "File 01",
      "File 02",
      "File 03",
      "File 04",
      "File 05",
      "File 06",
    ]);
    expect(result.data.projects[0]?.draft.tech).toEqual([
      "Next.js",
      "TypeScript",
      "Prisma",
      "Neon",
      "Cloudinary",
    ]);
    expect(result.data.projects[4]?.draft.role).toBe(
      "Application Developer at DFNN Inc.",
    );
    expect(result.data.projects[5]?.draft.repo).toBe(
      "https://github.com/PUPT-2025-CAPRO-BIS",
    );
  });

  it("keeps the category presentation order stable", () => {
    expect(PROJECT_CATEGORY_ORDER).toEqual([
      "Personal Project",
      "Work Project",
      "Capstone Project",
    ]);
  });

  it("permits a project without repository or live URLs", () => {
    expect(projectRecordSchema.safeParse(createProjectRecord()).success).toBe(
      true,
    );
  });

  it("keeps draft content separate from the current published version", () => {
    const published = {
      number: "File 01",
      name: "Published name",
      category: "Personal Project",
      description: "Published description.",
      tech: ["JavaScript"],
      slug: "published-name",
      groupOrder: 1,
    };
    const result = projectRecordSchema.safeParse(
      createProjectRecord({ published }),
    );

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.draft.name).toBe("Project One");
    expect(result.data.published?.name).toBe("Published name");
  });

  it("represents queued unpublish and published Trash removal without dropping published content", () => {
    const published = createProjectRecord().draft;
    const queuedUnpublish = projectRecordSchema.safeParse(
      createProjectRecord({ publicationIntent: "exclude", published }),
    );
    const queuedTrashRemoval = projectRecordSchema.safeParse(
      createProjectRecord({
        lifecycle: "trashed",
        publicationIntent: "exclude",
        published,
      }),
    );

    expect(queuedUnpublish.success).toBe(true);
    expect(queuedTrashRemoval.success).toBe(true);
    if (!queuedTrashRemoval.success) return;
    expect(queuedTrashRemoval.data.published).not.toBeNull();
  });

  it("rejects a Trashed project that remains included for publication", () => {
    const result = projectRecordSchema.safeParse(
      createProjectRecord({ lifecycle: "trashed" }),
    );

    expect(result.success).toBe(false);
  });

  it("validates required fields, categories, slugs, ordering, URLs, and unknown keys", () => {
    const validVersion = createProjectRecord().draft as Record<string, unknown>;
    const invalidVersions = [
      { ...validVersion, name: "   " },
      { ...validVersion, category: "Side Project" },
      { ...validVersion, tech: [] },
      { ...validVersion, slug: "Project One" },
      { ...validVersion, groupOrder: 0 },
      { ...validVersion, repo: "/relative" },
      { ...validVersion, liveUrl: "javascript:alert(1)" },
      { ...validVersion, unexpected: true },
    ];

    for (const version of invalidVersions) {
      expect(projectVersionSchema.safeParse(version).success).toBe(false);
    }
  });

  it("preserves optional Markdown source without interpreting it", () => {
    const markdown = "## Details\n\n- First item\n- Second item";
    const result = projectVersionSchema.safeParse({
      ...(createProjectRecord().draft as Record<string, unknown>),
      longDescriptionMarkdown: markdown,
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.longDescriptionMarkdown).toBe(markdown);
  });

  it("allows incomplete and duplicate featured choices in draft state", () => {
    expect(
      draftFeaturedSlotsSchema.safeParse(["project-one", null, "project-one"])
        .success,
    ).toBe(true);
  });

  it("requires exactly three distinct featured choices for publication", () => {
    expect(
      publishedFeaturedSlotsSchema.safeParse(["project-one", "project-two"])
        .success,
    ).toBe(false);
    expect(
      publishedFeaturedSlotsSchema.safeParse([
        "project-one",
        "project-one",
        "project-three",
      ]).success,
    ).toBe(false);
  });

  it("orders featured projects independently of category and group order", () => {
    const result = projectPublishCandidateSchema.safeParse({
      projects: legacyProjects,
      featuredProjectIds: [
        "barangay-information-system",
        "ya-gameela",
        "lottomatik-marketing-website",
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.featuredProjectIds).toEqual([
      "barangay-information-system",
      "ya-gameela",
      "lottomatik-marketing-website",
    ]);
  });

  it.each([
    ["missing", "missing-project"],
    ["excluded", "devflow"],
    ["Trashed", "devflow"],
  ])("rejects a %s featured project", (scenario, featuredProjectId) => {
    const projects = legacyProjects.map((project) => {
      if (project.id !== "devflow" || scenario === "missing") return project;

      return {
        ...project,
        lifecycle: scenario === "Trashed" ? "trashed" : "active",
        publicationIntent: "exclude",
      };
    });
    const result = projectPublishCandidateSchema.safeParse({
      projects,
      featuredProjectIds: [
        "ya-gameela",
        featuredProjectId,
        "rental-bill-management-system",
      ],
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate project IDs, publishable slugs, and category positions", () => {
    const duplicateId = {
      ...legacyProjects[1],
      id: legacyProjects[0].id,
    };
    const duplicateSlug = {
      ...legacyProjects[1],
      draft: {
        ...legacyProjects[1].draft,
        slug: legacyProjects[0].draft.slug,
      },
    };
    const duplicateOrder = {
      ...legacyProjects[1],
      draft: {
        ...legacyProjects[1].draft,
        groupOrder: legacyProjects[0].draft.groupOrder,
      },
    };

    for (const replacement of [duplicateId, duplicateSlug, duplicateOrder]) {
      const result = projectPublishCandidateSchema.safeParse({
        projects: [legacyProjects[0], replacement, ...legacyProjects.slice(2)],
        featuredProjectIds: [
          "ya-gameela",
          "devflow",
          "rental-bill-management-system",
        ],
      });

      expect(result.success).toBe(false);
    }
  });
});

describe("Project gallery contract", () => {
  it("requires distinct media, alt text, and exactly one cover", () => {
    const firstId = "11111111-1111-4111-8111-111111111111";
    const secondId = "22222222-2222-4222-8222-222222222222";
    expect(
      projectGallerySchema.safeParse([
        { mediaId: firstId, altText: "Dashboard", isCover: true },
        { mediaId: secondId, altText: "Project details", isCover: false },
      ]).success,
    ).toBe(true);
    expect(
      projectGallerySchema.safeParse([
        { mediaId: firstId, altText: "Dashboard", isCover: false },
        { mediaId: firstId, altText: "Duplicate", isCover: false },
      ]).success,
    ).toBe(false);
  });
});
