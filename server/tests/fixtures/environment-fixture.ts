const DEFAULT_TEST_ENVIRONMENT = Object.freeze({
  HOST: "127.0.0.1",
  PORT: "3000",
});

type EnvironmentFixture = {
  HOST: string;
  PORT: string;
};

export function createEnvironmentFixture(
  overrides: Readonly<Partial<EnvironmentFixture>> = {},
): NodeJS.ProcessEnv {
  return { ...DEFAULT_TEST_ENVIRONMENT, ...overrides };
}
