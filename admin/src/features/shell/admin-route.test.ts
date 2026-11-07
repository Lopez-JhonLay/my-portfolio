import assert from "node:assert/strict";
import test from "node:test";

import { resolveAdminView } from "./admin-route.ts";

void test("maps Admin paths to their workspace views", () => {
  assert.equal(resolveAdminView("/"), "overview");
  assert.equal(resolveAdminView("/projects"), "projects");
  assert.equal(resolveAdminView("/projects/example"), "projects");
  assert.equal(resolveAdminView("/featured"), "featured");
  assert.equal(resolveAdminView("/publish"), "publish");
});

void test("returns null for an unknown Admin path", () => {
  assert.equal(resolveAdminView("/settings"), null);
});
