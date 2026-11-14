import { describe, expect, it, vi } from "vitest";

import { createEnvironmentFixture } from "./environment-fixture.ts";

const TEST_GLOBAL_KEY = "__portfolioCmsFixtureTest__";
const testGlobal = globalThis as typeof globalThis & Record<string, unknown>;
const originalConsoleError = console.error;
const originalHost = process.env.HOST;
const originalPort = process.env.PORT;
const originalGlobalValue = testGlobal[TEST_GLOBAL_KEY];

describe("createEnvironmentFixture", () => {
  it("creates deterministic local environment values", () => {
    expect(createEnvironmentFixture()).toEqual({
      ADMIN_ORIGIN: "http://127.0.0.1:5174",
      DATABASE_URL:
        "postgresql://portfolio_cms_dev:strong-test-password@127.0.0.1:5432/portfolio_cms_dev",
      GITHUB_ADMIN_USER_ID: "12345678",
      GITHUB_CALLBACK_URL: "http://127.0.0.1:3000/api/auth/github/callback",
      GITHUB_CLIENT_ID: "test-github-client-id",
      GITHUB_CLIENT_SECRET: "test-github-client-secret-value",
      HOST: "127.0.0.1",
      PORT: "3000",
      PUBLIC_ORIGIN: "http://127.0.0.1:5173",
    });
  });

  it("applies overrides without changing later fixtures", () => {
    const overriddenEnvironment = createEnvironmentFixture({ PORT: "5175" });
    const defaultEnvironment = createEnvironmentFixture();

    expect(overriddenEnvironment).toEqual({
      ADMIN_ORIGIN: "http://127.0.0.1:5174",
      DATABASE_URL:
        "postgresql://portfolio_cms_dev:strong-test-password@127.0.0.1:5432/portfolio_cms_dev",
      GITHUB_ADMIN_USER_ID: "12345678",
      GITHUB_CALLBACK_URL: "http://127.0.0.1:3000/api/auth/github/callback",
      GITHUB_CLIENT_ID: "test-github-client-id",
      GITHUB_CLIENT_SECRET: "test-github-client-secret-value",
      HOST: "127.0.0.1",
      PORT: "5175",
      PUBLIC_ORIGIN: "http://127.0.0.1:5173",
    });
    expect(defaultEnvironment).toEqual({
      ADMIN_ORIGIN: "http://127.0.0.1:5174",
      DATABASE_URL:
        "postgresql://portfolio_cms_dev:strong-test-password@127.0.0.1:5432/portfolio_cms_dev",
      GITHUB_ADMIN_USER_ID: "12345678",
      GITHUB_CALLBACK_URL: "http://127.0.0.1:3000/api/auth/github/callback",
      GITHUB_CLIENT_ID: "test-github-client-id",
      GITHUB_CLIENT_SECRET: "test-github-client-secret-value",
      HOST: "127.0.0.1",
      PORT: "3000",
      PUBLIC_ORIGIN: "http://127.0.0.1:5173",
    });
    expect(overriddenEnvironment).not.toBe(defaultEnvironment);
  });
});

describe("Vitest isolation", () => {
  it("uses temporary mock, environment, and global state", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubEnv("HOST", "public.example");
    vi.stubEnv("PORT", "65535");
    vi.stubGlobal(TEST_GLOBAL_KEY, "temporary");

    expect(console.error).not.toBe(originalConsoleError);
    expect(process.env.HOST).toBe("public.example");
    expect(process.env.PORT).toBe("65535");
    expect(testGlobal[TEST_GLOBAL_KEY]).toBe("temporary");
    expect(createEnvironmentFixture()).toEqual({
      ADMIN_ORIGIN: "http://127.0.0.1:5174",
      DATABASE_URL:
        "postgresql://portfolio_cms_dev:strong-test-password@127.0.0.1:5432/portfolio_cms_dev",
      GITHUB_ADMIN_USER_ID: "12345678",
      GITHUB_CALLBACK_URL: "http://127.0.0.1:3000/api/auth/github/callback",
      GITHUB_CLIENT_ID: "test-github-client-id",
      GITHUB_CLIENT_SECRET: "test-github-client-secret-value",
      HOST: "127.0.0.1",
      PORT: "3000",
      PUBLIC_ORIGIN: "http://127.0.0.1:5173",
    });
  });

  it("restores mock, environment, and global state between tests", () => {
    expect(console.error).toBe(originalConsoleError);
    expect(process.env.HOST).toBe(originalHost);
    expect(process.env.PORT).toBe(originalPort);
    expect(testGlobal[TEST_GLOBAL_KEY]).toBe(originalGlobalValue);
  });
});
