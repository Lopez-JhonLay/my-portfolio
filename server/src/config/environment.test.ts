import { describe, expect, it } from "vitest";

import { validateEnvironment } from "./environment.ts";

describe("validateEnvironment", () => {
  it("uses loopback and port 3000 when configuration is absent", () => {
    expect(validateEnvironment({})).toEqual({
      success: true,
      data: { host: "127.0.0.1", port: 3000 },
    });
  });

  it.each(["1", "5175", "65535"])("accepts local port %s", (port) => {
    expect(validateEnvironment({ HOST: "127.0.0.1", PORT: port })).toEqual({
      success: true,
      data: { host: "127.0.0.1", port: Number(port) },
    });
  });

  it.each(["localhost", "0.0.0.0", "::1", ""])(
    "rejects unsafe host %j without returning its value",
    (host) => {
      const result = validateEnvironment({ HOST: host });

      expect(result).toEqual({ success: false, invalidFields: ["HOST"] });
      expect(JSON.stringify(result)).not.toContain(host || '"HOST":""');
    },
  );

  it.each(["0", "65536", "3000.5", "+3000", " 3000", "3000 ", ""])(
    "rejects malformed or out-of-range port %j",
    (port) => {
      expect(validateEnvironment({ PORT: port })).toEqual({
        success: false,
        invalidFields: ["PORT"],
      });
    },
  );

  it("reports only field names when multiple values are invalid", () => {
    const result = validateEnvironment({
      HOST: "public.example",
      PORT: "nope",
    });
    const serializedResult = JSON.stringify(result);

    expect(result).toEqual({
      success: false,
      invalidFields: ["HOST", "PORT"],
    });
    expect(serializedResult).not.toContain("public.example");
    expect(serializedResult).not.toContain("nope");
  });
});
