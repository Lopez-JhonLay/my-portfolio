import assert from "node:assert/strict";
import test from "node:test";

import { moveContentItem } from "./content-ordering.ts";

void test("moves ordered content without mutating the original list", () => {
  const original = ["first", "second", "third"];

  assert.deepEqual(moveContentItem(original, 2, 0), [
    "third",
    "first",
    "second",
  ]);
  assert.deepEqual(original, ["first", "second", "third"]);
});

void test("leaves ordered content unchanged for out-of-range moves", () => {
  const original = ["first", "second"];

  assert.deepEqual(moveContentItem(original, -1, 0), original);
  assert.deepEqual(moveContentItem(original, 0, 2), original);
});
