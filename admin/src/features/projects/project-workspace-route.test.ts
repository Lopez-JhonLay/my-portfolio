import assert from "node:assert/strict";
import test from "node:test";

import { resolveProjectWorkspaceRoute } from "./project-workspace-route.ts";

void test("resolves list, create, and edit Project workspace paths", () => {
  assert.deepEqual(resolveProjectWorkspaceRoute("/projects"), { kind: "list" });
  assert.deepEqual(resolveProjectWorkspaceRoute("/projects/new"), {
    kind: "new",
  });
  assert.deepEqual(resolveProjectWorkspaceRoute("/projects/abc-123"), {
    kind: "edit",
    projectId: "abc-123",
  });
});

void test("rejects nested or malformed Project workspace paths", () => {
  assert.equal(resolveProjectWorkspaceRoute("/projects/"), null);
  assert.equal(resolveProjectWorkspaceRoute("/projects/a/b"), null);
  assert.equal(resolveProjectWorkspaceRoute("/featured"), null);
});
