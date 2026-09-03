import { execSync } from "node:child_process";
import request from "supertest";
import type { Express } from "express";

import app from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

/** Applies the committed migrations to the test database. */
export function migrateTestDatabase() {
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  });
}

/**
 * Wipes every table between suites.
 *
 * TRUNCATE ... CASCADE rather than deleteMany per model: it does not care about
 * FK ordering, so adding a model never breaks the reset.
 */
export async function resetDatabase() {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
     WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) return;

  const list = tables.map((row) => `"public"."${row.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${list} CASCADE;`);
}

export const api: Express = app;

let userSeq = 0;

export type TestUser = {
  id: string;
  email: string;
  name: string;
  token: string;
  cookie: string;
};

export const password = "TestPass!2026";

/** Departments and courses the fixtures below reference. */
export async function seedCatalog() {
  const department = await prisma.department.upsert({
    where: { code: "CS" },
    update: {},
    create: { code: "CS", name: "Computer Science" },
  });

  const course = await prisma.course.upsert({
    where: { code: "CS 3358" },
    update: {},
    create: {
      code: "CS 3358",
      title: "Data Structures and Algorithms",
      departmentId: department.id,
    },
  });

  const other = await prisma.course.upsert({
    where: { code: "CS 2308" },
    update: {},
    create: {
      code: "CS 2308",
      title: "Foundations of Computer Science II",
      departmentId: department.id,
    },
  });

  return { department, course, other };
}

/** Signs up a fresh student and returns their token and refresh cookie. */
export async function createUser(label = "student"): Promise<TestUser> {
  const email = `${label}-${++userSeq}-${Date.now()}@txstate.edu`;

  const response = await request(api)
    .post("/api/auth/signup")
    .send({ email, name: `Test ${label}`, password })
    .expect(201);

  const cookies = response.headers["set-cookie"] as unknown as string[];

  return {
    id: response.body.data.user.id,
    email,
    name: `Test ${label}`,
    token: response.body.data.accessToken,
    cookie: cookies[0]!,
  };
}

/** Completes onboarding so the user counts as enrolled in a course. */
export async function onboard(user: TestUser, courseCodes: string[]) {
  await request(api)
    .patch("/api/auth/me")
    .set("Authorization", `Bearer ${user.token}`)
    .send({ major: "Computer Science", gradYear: new Date().getFullYear() + 2, courseCodes })
    .expect(200);
}

export const auth = (user: TestUser) => `Bearer ${user.token}`;

const hours = (n: number) => new Date(Date.now() + n * 3600_000).toISOString();

export function timeWindows(count = 2) {
  return Array.from({ length: count }, (_, index) => ({
    startsAt: hours(24 * (index + 1)),
    endsAt: hours(24 * (index + 1) + 2),
  }));
}

export const requestPayload = (overrides: Record<string, unknown> = {}) => ({
  topic: "Linked lists and pointer diagrams",
  intent: "NEED_HELP",
  meetingStyle: "IN_PERSON",
  location: "Alkek 4th floor",
  maxParticipants: 4,
  timeOptions: timeWindows(2),
  ...overrides,
});

export const circlePayload = (courseId: string, overrides: Record<string, unknown> = {}) => ({
  courseId,
  name: "CS 3358 Tuesday Crew",
  description: "We work the problem set together every Tuesday.",
  purpose: "WEEKLY_STUDYING",
  meetingStyle: "IN_PERSON",
  maxMembers: 4,
  term: "Fall 2026",
  ...overrides,
});

export const sessionPayload = (overrides: Record<string, unknown> = {}) => ({
  title: "Problem set 4",
  description: "Trees and traversals",
  startsAt: hours(48),
  endsAt: hours(50),
  mode: "IN_PERSON",
  location: "Alkek Library",
  ...overrides,
});

export { prisma, request };
