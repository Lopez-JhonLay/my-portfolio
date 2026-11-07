import assert from "node:assert/strict";
import test from "node:test";

import {
  applyAdminTheme,
  getNextAdminTheme,
  readStoredAdminTheme,
  setAdminTheme,
  writeStoredAdminTheme,
} from "./admin-theme.ts";

void test("the theme toggle switches between light and dark", () => {
  assert.equal(getNextAdminTheme("light"), "dark");
  assert.equal(getNextAdminTheme("dark"), "light");
});

function createThemeRoot() {
  const classes = new Set<string>();
  const style = { colorScheme: "" };

  return {
    classes,
    root: {
      classList: {
        toggle(token: string, force?: boolean) {
          const enabled = force ?? !classes.has(token);
          if (enabled) classes.add(token);
          else classes.delete(token);
          return enabled;
        },
      },
      style,
    },
    style,
  };
}

void test("missing or invalid theme preferences default to light", () => {
  const missing = { getItem: () => null };
  const invalid = { getItem: () => "system" };

  assert.equal(readStoredAdminTheme(missing), "light");
  assert.equal(readStoredAdminTheme(invalid), "light");
});

void test("the saved dark preference applies dark controls and color scheme", () => {
  const { classes, root, style } = createThemeRoot();

  applyAdminTheme(root, "dark");

  assert.equal(classes.has("dark"), true);
  assert.equal(style.colorScheme, "dark");
});

void test("applying light removes the dark theme", () => {
  const { classes, root, style } = createThemeRoot();
  classes.add("dark");

  applyAdminTheme(root, "light");

  assert.equal(classes.has("dark"), false);
  assert.equal(style.colorScheme, "light");
});

void test("theme persistence uses the Admin-only storage key", () => {
  const saved = new Map<string, string>();
  const storage = {
    setItem(key: string, value: string) {
      saved.set(key, value);
    },
  };

  writeStoredAdminTheme(storage, "dark");

  assert.deepEqual([...saved], [["portfolio-cms:admin-theme", "dark"]]);
});

void test("unavailable storage falls back to light", () => {
  const storage = {
    getItem() {
      throw new Error("Storage unavailable");
    },
  };

  assert.equal(readStoredAdminTheme(storage), "light");
});

void test("setting a theme applies and persists the same preference", () => {
  const { classes, root, style } = createThemeRoot();
  const saved = new Map<string, string>();
  const storage = {
    setItem(key: string, value: string) {
      saved.set(key, value);
    },
  };

  setAdminTheme(root, storage, "dark");

  assert.equal(classes.has("dark"), true);
  assert.equal(style.colorScheme, "dark");
  assert.equal(saved.get("portfolio-cms:admin-theme"), "dark");
});
