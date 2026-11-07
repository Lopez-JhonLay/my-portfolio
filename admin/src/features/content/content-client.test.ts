import assert from "node:assert/strict";
import test from "node:test";

import { parseContentSummaries } from "./content-client.ts";

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
