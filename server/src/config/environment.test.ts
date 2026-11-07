import { describe, expect, it } from "vitest";

import { createEnvironmentFixture } from "../../tests/fixtures/environment-fixture.ts";
import { validateEnvironment } from "./environment.ts";

describe("validateEnvironment", () => {
  it("uses loopback and port 3000 with complete local feature configuration", () => {
    const environment = createEnvironmentFixture();

    expect(validateEnvironment(environment)).toEqual({
      success: true,
      data: {
        adminOrigin: environment.ADMIN_ORIGIN,
        adminUserId: environment.GITHUB_ADMIN_USER_ID,
        databaseUrl: environment.DATABASE_URL,
        githubCallbackUrl: environment.GITHUB_CALLBACK_URL,
        githubClientId: environment.GITHUB_CLIENT_ID,
        githubClientSecret: environment.GITHUB_CLIENT_SECRET,
        host: "127.0.0.1",
        port: 3000,
        sessionTtlMs: 28_800_000,
      },
    });
  });

  it.each(["1", "5175", "65535"])("accepts local port %s", (port) => {
    expect(
      validateEnvironment(createEnvironmentFixture({ PORT: port })),
    ).toEqual({
      success: true,
      data: {
        adminOrigin: "http://127.0.0.1:5174",
        adminUserId: "12345678",
        databaseUrl:
          "postgresql://portfolio_cms_dev:strong-test-password@127.0.0.1:5432/portfolio_cms_dev",
        githubCallbackUrl: "http://127.0.0.1:3000/api/auth/github/callback",
        githubClientId: "test-github-client-id",
        githubClientSecret: "test-github-client-secret-value",
        host: "127.0.0.1",
        port: Number(port),
        sessionTtlMs: 28_800_000,
      },
    });
  });

  it("fails closed when protected feature configuration is missing", () => {
    expect(validateEnvironment({})).toEqual({
      success: false,
      invalidFields: [
        "ADMIN_ORIGIN",
        "DATABASE_URL",
        "GITHUB_ADMIN_USER_ID",
        "GITHUB_CALLBACK_URL",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET",
      ],
    });
  });

  it.each([
    ["ADMIN_ORIGIN", "https://admin.example.com"],
    ["DATABASE_URL", "postgresql://user:password@database.example.com/cms"],
    ["GITHUB_CALLBACK_URL", "https://api.example.com/api/auth/github/callback"],
  ] as const)("rejects non-local %s", (field, value) => {
    const result = validateEnvironment(
      createEnvironmentFixture({ [field]: value }),
    );

    expect(result).toEqual({ success: false, invalidFields: [field] });
    expect(JSON.stringify(result)).not.toContain(value);
  });

  it.each(["localhost", "0.0.0.0", "::1", ""])(
    "rejects unsafe host %j without returning its value",
    (host) => {
      const result = validateEnvironment(
        createEnvironmentFixture({ HOST: host }),
      );

      expect(result).toEqual({ success: false, invalidFields: ["HOST"] });
      expect(JSON.stringify(result)).not.toContain(host || '"HOST":""');
    },
  );

  it.each(["0", "65536", "3000.5", "+3000", " 3000", "3000 ", ""])(
    "rejects malformed or out-of-range port %j",
    (port) => {
      expect(
        validateEnvironment(createEnvironmentFixture({ PORT: port })),
      ).toEqual({
        success: false,
        invalidFields: ["PORT"],
      });
    },
  );

  it("reports only field names when multiple values are invalid", () => {
    const result = validateEnvironment(
      createEnvironmentFixture({
        HOST: "public.example",
        PORT: "nope",
      }),
    );
    const serializedResult = JSON.stringify(result);

    expect(result).toEqual({
      success: false,
      invalidFields: ["HOST", "PORT"],
    });
    expect(serializedResult).not.toContain("public.example");
    expect(serializedResult).not.toContain("nope");
  });
});
