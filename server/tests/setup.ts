import "dotenv/config";

/**
 * Point the whole process at the test database before anything imports
 * config/env.ts, which reads process.env once at module load.
 *
 * The guard below is the important part: this suite truncates every table it
 * touches, so it must never run against the development database.
 */
const testDatabaseUrl = process.env.DATABASE_URL_TEST;

if (!testDatabaseUrl) {
  throw new Error(
    "DATABASE_URL_TEST is not set. Start the test database with `docker compose up -d postgres-test` and copy .env.example.",
  );
}

if (testDatabaseUrl === process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL_TEST must differ from DATABASE_URL — refusing to run destructive tests against development data.",
  );
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "test-secret-that-is-at-least-32-characters-long";
process.env.CROSS_SITE_COOKIES = "false";
