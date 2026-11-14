const DEFAULT_TEST_ENVIRONMENT = Object.freeze({
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

type EnvironmentFixture = {
  ADMIN_ORIGIN: string;
  DATABASE_URL: string;
  GITHUB_ADMIN_USER_ID: string;
  GITHUB_CALLBACK_URL: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  HOST: string;
  PORT: string;
  PUBLIC_ORIGIN: string;
};

export function createEnvironmentFixture(
  overrides: Readonly<Partial<EnvironmentFixture>> = {},
): NodeJS.ProcessEnv {
  return { ...DEFAULT_TEST_ENVIRONMENT, ...overrides };
}
