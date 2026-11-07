import { describe, expect, it } from "vitest";

import type { ProjectVersion } from "./project-contract.ts";
import {
  mapPublicFeaturedProjects,
  mapPublicProjectCard,
  mapPublicProjectDetail,
  mapPublicProjectGroups,
} from "./public-project-mapper.ts";

const legacyProjects = [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
] as const satisfies readonly ProjectVersion[];

function createProject(
  overrides: Partial<ProjectVersion> = {},
): ProjectVersion {
  return {
    number: "File 07",
    name: "Project Seven",
    category: "Personal Project",
    description: "A plain-text card description.",
    tech: ["TypeScript"],
    slug: "project-seven",
    groupOrder: 7,
    ...overrides,
  };
}

describe("Public Project compatibility mapper", () => {
  it("maps all six legacy Projects with their fields and ordering intact", () => {
    const source = [...legacyProjects].reverse();
    const sourceBeforeMapping = structuredClone(source);
    const groups = mapPublicProjectGroups(source);

    expect(groups.map(({ category }) => category)).toEqual([
      "Personal Project",
      "Work Project",
      "Capstone Project",
    ]);
    expect(groups[0].projects.map(({ number }) => number)).toEqual([
      "File 01",
      "File 02",
      "File 03",
      "File 04",
    ]);
    expect(groups[1].projects.map(({ number }) => number)).toEqual(["File 05"]);
    expect(groups[2].projects.map(({ number }) => number)).toEqual(["File 06"]);
    expect(groups[0].projects[0]).toEqual({
      number: "File 01",
      name: "Ya Gameela",
      category: "Personal Project",
      description:
        "A product catalog and custom content management system for a lifestyle brand, built around storefront and publishing workflows.",
      tech: ["Next.js", "TypeScript", "Prisma", "Neon", "Cloudinary"],
      repo: "https://github.com/Lopez-JhonLay/ya-gameela",
      liveUrl: "https://ya-gameela-web.vercel.app/",
      slug: "ya-gameela",
    });
    expect(groups[1].projects[0]?.role).toBe(
      "Application Developer at DFNN Inc.",
    );
    expect(groups[1].projects[0]).not.toHaveProperty("repo");
    expect(groups[2].projects[0]).not.toHaveProperty("liveUrl");
    expect(source).toEqual(sourceBeforeMapping);
  });

  it("copies only allowlisted public fields from canonical input", () => {
    const source = {
      ...legacyProjects[0],
      id: "internal-id",
      lifecycle: "active",
      publicationIntent: "include",
      draft: legacyProjects[1],
      published: legacyProjects[0],
      operationId: "internal-operation",
    };
    const card = mapPublicProjectCard(source);

    expect(card).not.toHaveProperty("id");
    expect(card).not.toHaveProperty("groupOrder");
    expect(card).not.toHaveProperty("lifecycle");
    expect(card).not.toHaveProperty("publicationIntent");
    expect(card).not.toHaveProperty("draft");
    expect(card).not.toHaveProperty("published");
    expect(card).not.toHaveProperty("operationId");
  });

  it("preserves both URLs so presentation can retain liveUrl-first priority", () => {
    const card = mapPublicProjectCard(legacyProjects[0]);

    expect(card.liveUrl).toBe("https://ya-gameela-web.vercel.app/");
    expect(card.repo).toBe("https://github.com/Lopez-JhonLay/ya-gameela");
  });

  it("supports linkless cards and optional Markdown detail source", () => {
    const source = createProject({
      longDescriptionMarkdown: "## Details\n\n- First item",
    });
    const card = mapPublicProjectCard(source);
    const detail = mapPublicProjectDetail(source);

    expect(card).not.toHaveProperty("repo");
    expect(card).not.toHaveProperty("liveUrl");
    expect(card).not.toHaveProperty("longDescriptionMarkdown");
    expect(detail.longDescriptionMarkdown).toBe("## Details\n\n- First item");
  });

  it("preserves explicit featured-slot order independently of category and group order", () => {
    const featured = mapPublicFeaturedProjects([
      legacyProjects[5],
      legacyProjects[0],
      legacyProjects[4],
    ]);

    expect(featured.projects.map(({ slug }) => slug)).toEqual([
      "barangay-information-system",
      "ya-gameela",
      "lottomatik-marketing-website",
    ]);
  });
});
