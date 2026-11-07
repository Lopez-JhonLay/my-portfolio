import assert from "node:assert/strict";
import test from "node:test";

import type { HeroDocument } from "./content-contract.ts";
import { validateEditableContent } from "./content-validation.ts";

const hero: HeroDocument = {
  browserTitle: " Portfolio ",
  name: " Jhon ",
  brand: " JL ",
  role: " Developer ",
  heroRole: " Engineer ",
  location: " Pasay ",
  sectionTag: " Open File ",
  title: " Web ",
  description: " Description ",
  resumeButtonLabel: " Download ",
  scrollCue: " Descend ",
  navigation: [
    "home",
    "about",
    "projects",
    "experience",
    "skills",
    "contact",
  ].map((destination) => ({ label: destination, href: `/#${destination}` })),
};

void test("normalizes a valid Hero document", () => {
  const result = validateEditableContent("hero", hero);
  assert.deepEqual(result.errors, {});
  assert.equal((result.document as HeroDocument).name, "Jhon");
});

void test("reports required and fixed-navigation validation errors", () => {
  const result = validateEditableContent("hero", {
    ...hero,
    title: " ",
    navigation: hero.navigation.map((item) => ({ ...item, href: "/#home" })),
  });
  assert.equal(result.document, undefined);
  assert.equal(result.errors.title, "This field is required.");
  assert.match(result.errors.navigation ?? "", /fixed portfolio destination/);
});
