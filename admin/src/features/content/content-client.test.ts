import assert from "node:assert/strict";
import test from "node:test";

import {
  parseAdminContentSection,
  parseContentOperation,
  parseContentSummaries,
} from "./content-client.ts";

const hero = {
  browserTitle: "Portfolio",
  name: "Jhon",
  brand: "JL",
  role: "Software Engineer",
  heroRole: "Developer",
  location: "Pasay",
  navigation: [
    "home",
    "about",
    "projects",
    "experience",
    "skills",
    "contact",
  ].map((destination) => ({ label: destination, href: `/#${destination}` })),
  sectionTag: "Open File",
  title: "Web & Mobile",
  description: "Practical applications.",
  resumeButtonLabel: "Download",
  scrollCue: "Descend",
};

void test("parses content readiness without retaining draft documents", () => {
  assert.deepEqual(
    parseContentSummaries({
      sections: [
        {
          sectionKey: "hero",
          revision: "2",
          isPublished: true,
          document: { title: "Portfolio" },
        },
      ],
    }),
    [{ sectionKey: "hero", revision: "2", isPublished: true }],
  );
});

void test("rejects unregistered content sections and response metadata", () => {
  assert.throws(() =>
    parseContentSummaries({
      sections: [
        {
          sectionKey: "secrets",
          revision: "1",
          isPublished: false,
          document: {},
        },
      ],
    }),
  );
  assert.throws(() => parseContentSummaries({ sections: [], internal: true }));
});

void test("parses an editable section without accepting response metadata", () => {
  assert.deepEqual(
    parseAdminContentSection({
      sectionKey: "hero",
      revision: "2",
      isPublished: false,
      document: hero,
    }),
    { sectionKey: "hero", revision: "2", isPublished: false, document: hero },
  );
  assert.throws(() =>
    parseAdminContentSection({
      sectionKey: "hero",
      revision: "2",
      isPublished: false,
      document: hero,
      secret: true,
    }),
  );
});

void test("parses pending and terminal content operations", () => {
  const operationId = "00000000-0000-4000-8000-000000000001";
  assert.equal(
    parseContentOperation({
      operationId,
      kind: "save_content_draft",
      sectionKey: "hero",
      status: "pending",
    }).status,
    "pending",
  );
  assert.equal(
    parseContentOperation({
      operationId,
      kind: "save_content_draft",
      sectionKey: "hero",
      status: "succeeded",
      outcomeCode: "content_draft_saved",
      resultRevision: "3",
    }).status,
    "succeeded",
  );
});
