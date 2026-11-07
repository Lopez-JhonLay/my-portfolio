import { describe, expect, it, vi } from "vitest";

import {
  createDrizzleSnapshotSessionBoundary,
  type ProjectDatabase,
  type ProjectDatabaseTransaction,
  type SnapshotConsistentSessionBoundary,
} from "../db/database-session.ts";
import {
  createPublishedProjectReadRepository,
  PublishedSnapshotConsistencyError,
  type PublishedProjectRecord,
  type PublishedProjectReadQueries,
  type PublishedSlugRecord,
  type PublishedStateRecord,
} from "./published-project-repository.ts";
import { projectIdSchema, type ProjectVersion } from "./project-contract.ts";

type FakeSession = {
  readonly name: string;
};

function createUnavailableRepository() {
  const session: FakeSession = { name: "snapshot-session" };
  const sessions: SnapshotConsistentSessionBoundary<FakeSession> = {
    withSnapshot: async (read) => read(session),
  };
  const queries: PublishedProjectReadQueries = {
    readPublishedState: () => Promise.resolve(null),
    readPublishedProjects: () => Promise.resolve([]),
    readPublishedProjectsByIds: () => Promise.resolve([]),
    readPublishedSlug: () => Promise.resolve(null),
  };

  return createPublishedProjectReadRepository(sessions, () => queries);
}

function createProject(
  overrides: Partial<ProjectVersion> = {},
): ProjectVersion {
  return {
    number: "File 01",
    name: "Project One",
    category: "Personal Project",
    description: "Published description",
    tech: ["TypeScript", "PostgreSQL"],
    repo: "https://example.com/repository",
    liveUrl: "https://example.com/project",
    slug: "project-one",
    longDescriptionMarkdown: "## Published details",
    groupOrder: 1,
    ...overrides,
  };
}

function createRecord(
  projectId: string,
  overrides: Partial<ProjectVersion> = {},
): PublishedProjectRecord {
  return {
    projectId: projectIdSchema.parse(projectId),
    project: createProject(overrides),
  };
}

function createFakeRepository(options: {
  state: PublishedStateRecord | null;
  projects?: readonly PublishedProjectRecord[];
  featuredProjects?: readonly PublishedProjectRecord[];
  slugRecord?: PublishedSlugRecord | null;
}) {
  const session: FakeSession = { name: "snapshot-session" };
  let snapshotCount = 0;
  const querySessions: FakeSession[] = [];
  const sessions: SnapshotConsistentSessionBoundary<FakeSession> = {
    withSnapshot: async (read) => {
      snapshotCount += 1;
      return read(session);
    },
  };

  const repository = createPublishedProjectReadRepository(
    sessions,
    (querySession) => {
      const recordSession = () => querySessions.push(querySession);
      return {
        readPublishedState: () => {
          recordSession();
          return Promise.resolve(options.state);
        },
        readPublishedProjects: () => {
          recordSession();
          return Promise.resolve(options.projects ?? []);
        },
        readPublishedProjectsByIds: () => {
          recordSession();
          return Promise.resolve(options.featuredProjects ?? []);
        },
        readPublishedSlug: () => {
          recordSession();
          return Promise.resolve(options.slugRecord ?? null);
        },
      };
    },
  );

  return {
    getQuerySessions: () => querySessions,
    getSnapshotCount: () => snapshotCount,
    repository,
    session,
  };
}

describe("published Project read repository", () => {
  it("runs reads in one injected read-only repeatable-read transaction", async () => {
    const transactionSession = {
      name: "drizzle-transaction",
    } as unknown as ProjectDatabaseTransaction;
    const transaction = vi.fn(
      <Result>(
        read: (session: ProjectDatabaseTransaction) => Promise<Result>,
        config: unknown,
      ) => {
        expect(config).toEqual({
          accessMode: "read only",
          isolationLevel: "repeatable read",
        });
        return read(transactionSession);
      },
    );
    const database = { transaction } as unknown as ProjectDatabase;
    const sessions = createDrizzleSnapshotSessionBoundary(database);

    const result = await sessions.withSnapshot((session) =>
      Promise.resolve(session),
    );

    expect(result).toBe(transactionSession);
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("returns the approved unavailable result when no published state exists", async () => {
    const repository = createUnavailableRepository();

    await expect(repository.readGroups()).resolves.toEqual({
      status: "unavailable",
    });
    await expect(repository.readFeatured()).resolves.toEqual({
      status: "unavailable",
    });
    await expect(repository.readBySlug("project-one")).resolves.toEqual({
      status: "unavailable",
    });
  });

  it("returns fixed categories and published within-category order as public DTOs", async () => {
    const state: PublishedStateRecord = {
      featuredProjectIds: [
        projectIdSchema.parse("personal-two"),
        projectIdSchema.parse("work-one"),
        projectIdSchema.parse("capstone-one"),
      ],
    };
    const context = createFakeRepository({
      state,
      projects: [
        createRecord("personal-two", {
          groupOrder: 2,
          name: "Personal Two",
          slug: "personal-two",
        }),
        createRecord("capstone-one", {
          category: "Capstone Project",
          name: "Capstone One",
          slug: "capstone-one",
        }),
        createRecord("work-one", {
          category: "Work Project",
          name: "Work One",
          slug: "work-one",
        }),
        createRecord("personal-one", {
          name: "Personal One",
          slug: "personal-one",
        }),
      ],
    });

    const result = await context.repository.readGroups();

    expect(result).toMatchObject({
      status: "available",
      data: [
        {
          category: "Personal Project",
          projects: [{ slug: "personal-one" }, { slug: "personal-two" }],
        },
        { category: "Work Project", projects: [{ slug: "work-one" }] },
        {
          category: "Capstone Project",
          projects: [{ slug: "capstone-one" }],
        },
      ],
    });
    expect(JSON.stringify(result)).not.toMatch(
      /groupOrder|longDescriptionMarkdown|projectId/,
    );
    expect(context.getSnapshotCount()).toBe(1);
    expect(context.getQuerySessions()).toEqual([
      context.session,
      context.session,
    ]);
  });

  it("returns featured cards in slot order rather than query order", async () => {
    const state: PublishedStateRecord = {
      featuredProjectIds: [
        projectIdSchema.parse("capstone-one"),
        projectIdSchema.parse("personal-one"),
        projectIdSchema.parse("work-one"),
      ],
    };
    const context = createFakeRepository({
      state,
      featuredProjects: [
        createRecord("personal-one", { slug: "personal-one" }),
        createRecord("work-one", {
          category: "Work Project",
          slug: "work-one",
        }),
        createRecord("capstone-one", {
          category: "Capstone Project",
          slug: "capstone-one",
        }),
      ],
    });

    const result = await context.repository.readFeatured();

    expect(result).toMatchObject({
      status: "available",
      data: {
        projects: [
          { slug: "capstone-one" },
          { slug: "personal-one" },
          { slug: "work-one" },
        ],
      },
    });
    expect(JSON.stringify(result)).not.toMatch(
      /groupOrder|longDescriptionMarkdown|projectId/,
    );
  });

  it("returns current details, safe redirects, and public not-found outcomes", async () => {
    const project = createProject({ slug: "current-project" });
    const state: PublishedStateRecord = {
      featuredProjectIds: [
        projectIdSchema.parse("one"),
        projectIdSchema.parse("two"),
        projectIdSchema.parse("three"),
      ],
    };
    const current = createFakeRepository({
      state,
      slugRecord: { kind: "current", project },
    });
    const redirect = createFakeRepository({
      state,
      slugRecord: { kind: "redirect", project },
    });
    const missing = createFakeRepository({ state });

    await expect(
      current.repository.readBySlug("current-project"),
    ).resolves.toEqual({
      status: "available",
      data: {
        number: "File 01",
        name: "Project One",
        category: "Personal Project",
        description: "Published description",
        tech: ["TypeScript", "PostgreSQL"],
        repo: "https://example.com/repository",
        liveUrl: "https://example.com/project",
        slug: "current-project",
        longDescriptionMarkdown: "## Published details",
      },
    });
    await expect(
      redirect.repository.readBySlug("prior-project"),
    ).resolves.toEqual({
      status: "redirect",
      slug: "current-project",
    });
    await expect(
      missing.repository.readBySlug("missing-project"),
    ).resolves.toEqual({
      status: "not-found",
    });
  });

  it("rejects a published snapshot with a missing featured Project", async () => {
    const state: PublishedStateRecord = {
      featuredProjectIds: [
        projectIdSchema.parse("one"),
        projectIdSchema.parse("two"),
        projectIdSchema.parse("three"),
      ],
    };
    const context = createFakeRepository({
      state,
      featuredProjects: [
        createRecord("one", { slug: "one" }),
        createRecord("two", { slug: "two" }),
      ],
    });

    await expect(context.repository.readFeatured()).rejects.toBeInstanceOf(
      PublishedSnapshotConsistencyError,
    );
  });
});
