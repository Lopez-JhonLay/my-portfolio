import { describe, expect, it } from "vitest";

import {
  publicFeaturedProjectsSchema,
  publicProjectCardSchema,
  publicProjectDetailSchema,
  publicProjectGroupsSchema,
} from "./public-project-contract.ts";

function createCard(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    number: "File 01",
    name: "Project One",
    category: "Personal Project",
    description: "A plain-text card description.",
    tech: ["TypeScript", "Zod"],
    slug: "project-one",
    ...overrides,
  };
}

function createGroups(): [
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>,
] {
  return [
    {
      category: "Personal Project",
      projects: [
        createCard({ name: "Second", slug: "second" }),
        createCard({ name: "First", slug: "first" }),
      ],
    },
    {
      category: "Work Project",
      projects: [
        createCard({
          name: "Work",
          category: "Work Project",
          slug: "work",
        }),
      ],
    },
    {
      category: "Capstone Project",
      projects: [
        createCard({
          name: "Capstone",
          category: "Capstone Project",
          slug: "capstone",
        }),
      ],
    },
  ];
}

describe("Public Project DTO contract", () => {
  it("accepts the exact card fields, optional HTTP(S) URLs, and linkless projects", () => {
    const linkedCard = publicProjectCardSchema.safeParse(
      createCard({
        role: "Developer",
        repo: "http://example.com/repository",
        liveUrl: "https://example.com/live",
      }),
    );
    const linklessCard = publicProjectCardSchema.safeParse(createCard());

    expect(linkedCard.success).toBe(true);
    expect(linklessCard.success).toBe(true);
    if (!linklessCard.success) return;
    expect(linklessCard.data).not.toHaveProperty("repo");
    expect(linklessCard.data).not.toHaveProperty("liveUrl");
  });

  it("allows optional Markdown only on the detail DTO", () => {
    const markdown = "## Details\n\n- First item";
    const detail = publicProjectDetailSchema.safeParse(
      createCard({ longDescriptionMarkdown: markdown }),
    );
    const card = publicProjectCardSchema.safeParse(
      createCard({ longDescriptionMarkdown: markdown }),
    );

    expect(detail.success).toBe(true);
    if (detail.success) {
      expect(detail.data.longDescriptionMarkdown).toBe(markdown);
    }
    expect(card.success).toBe(false);
  });

  it.each([
    ["id", "project-one"],
    ["groupOrder", 1],
    ["lifecycle", "active"],
    ["publicationIntent", "include"],
    ["draft", createCard()],
    ["published", createCard()],
    ["revision", "revision-one"],
    ["operationId", "operation-one"],
    ["authenticatedUserId", "admin-one"],
  ])("rejects the protected or internal %s field", (field, value) => {
    expect(
      publicProjectCardSchema.safeParse(createCard({ [field]: value })).success,
    ).toBe(false);
  });

  it("rejects unsafe URL protocols", () => {
    expect(
      publicProjectCardSchema.safeParse(
        createCard({ repo: "javascript:alert(1)" }),
      ).success,
    ).toBe(false);
  });

  it("requires fixed category order and matching card categories", () => {
    const groups = createGroups();
    const valid = publicProjectGroupsSchema.safeParse(groups);
    const reordered = publicProjectGroupsSchema.safeParse([
      groups[1],
      groups[0],
      groups[2],
    ]);
    const mismatched = publicProjectGroupsSchema.safeParse([
      {
        category: "Personal Project",
        projects: [createCard({ category: "Work Project" })],
      },
      groups[1],
      groups[2],
    ]);

    expect(valid.success).toBe(true);
    expect(reordered.success).toBe(false);
    expect(mismatched.success).toBe(false);
  });

  it("preserves project order within each category", () => {
    const result = publicProjectGroupsSchema.safeParse(createGroups());

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data[0].projects.map(({ name }) => name)).toEqual([
      "Second",
      "First",
    ]);
  });

  it("requires exactly three featured cards with distinct slugs", () => {
    const featuredCards = [
      createCard({
        name: "Capstone",
        category: "Capstone Project",
        slug: "capstone",
      }),
      createCard({ name: "Personal", slug: "personal" }),
      createCard({
        name: "Work",
        category: "Work Project",
        slug: "work",
      }),
    ];
    const valid = publicFeaturedProjectsSchema.safeParse({
      projects: featuredCards,
    });
    const incomplete = publicFeaturedProjectsSchema.safeParse({
      projects: featuredCards.slice(0, 2),
    });
    const duplicate = publicFeaturedProjectsSchema.safeParse({
      projects: [featuredCards[0], featuredCards[0], featuredCards[2]],
    });

    expect(valid.success).toBe(true);
    expect(incomplete.success).toBe(false);
    expect(duplicate.success).toBe(false);
  });

  it("preserves featured slot order independently of category", () => {
    const result = publicFeaturedProjectsSchema.safeParse({
      projects: [
        createCard({
          category: "Capstone Project",
          slug: "slot-one",
        }),
        createCard({ slug: "slot-two" }),
        createCard({ category: "Work Project", slug: "slot-three" }),
      ],
    });

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.projects.map(({ slug }) => slug)).toEqual([
      "slot-one",
      "slot-two",
      "slot-three",
    ]);
  });
});
