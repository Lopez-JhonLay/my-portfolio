import assert from "node:assert/strict";
import test from "node:test";

import type { ContentSectionSummary } from "../content/content-contract.ts";
import {
  getOverviewAttention,
  getPublishedSectionCount,
} from "./overview-model.ts";

const sections: readonly ContentSectionSummary[] = [
  { sectionKey: "hero", revision: "2", isPublished: true },
  { sectionKey: "about", revision: "3", isPublished: false },
];

void test("summarizes published content without inventing missing state", () => {
  const readiness = { status: "ready" as const, sections };

  assert.equal(getPublishedSectionCount(readiness), 1);
  assert.equal(
    getPublishedSectionCount({ status: "loading", sections: [] }),
    0,
  );
});

void test("prioritizes failed reads and uncertain operations", () => {
  assert.deepEqual(
    getOverviewAttention({
      hasUnsavedChanges: true,
      pendingOperationCount: 2,
      readiness: { status: "error", sections: [] },
    }),
    {
      kind: "error",
      message:
        "Published content status could not be loaded. Reload this page to try again.",
    },
  );

  assert.deepEqual(
    getOverviewAttention({
      hasUnsavedChanges: true,
      pendingOperationCount: 1,
      readiness: { status: "ready", sections },
    }),
    {
      kind: "warning",
      message: "One save or publish operation needs its status checked.",
    },
  );
});

void test("reports a clear all-published state", () => {
  const publishedSections = sections.map((section) => ({
    ...section,
    isPublished: true,
  }));

  assert.deepEqual(
    getOverviewAttention({
      hasUnsavedChanges: false,
      pendingOperationCount: 0,
      readiness: { status: "ready", sections: publishedSections },
    }),
    {
      kind: "success",
      message: "Everything saved in the CMS is published.",
    },
  );
});
