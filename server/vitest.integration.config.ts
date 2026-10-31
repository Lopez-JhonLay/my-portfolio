import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    exclude: configDefaults.exclude,
    include: ["tests/integration/**/*.test.ts"],
    maxWorkers: 1,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
});
