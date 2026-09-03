import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  api,
  auth,
  createUser,
  migrateTestDatabase,
  onboard,
  prisma,
  request,
  resetDatabase,
  seedCatalog,
} from "./helpers.js";

beforeAll(() => {
  migrateTestDatabase();
});

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /api/courses", () => {
  it("is readable without a session, because signup needs the catalog", async () => {
    await seedCatalog();
    const response = await request(api).get("/api/courses").expect(200);

    expect(response.body.data.courses).toHaveLength(2);
  });

  it("searches by code", async () => {
    await seedCatalog();
    const response = await request(api).get("/api/courses?search=3358").expect(200);

    expect(response.body.data.courses).toHaveLength(1);
    expect(response.body.data.courses[0].code).toBe("CS 3358");
  });

  it("searches by title for longer queries", async () => {
    await seedCatalog();
    const response = await request(api).get("/api/courses?search=Algorithms").expect(200);

    expect(response.body.data.courses[0].code).toBe("CS 3358");
  });
});

describe("course membership", () => {
  it("adds and removes a course from My Courses", async () => {
    const { course } = await seedCatalog();
    const user = await createUser("member");

    const added = await request(api)
      .post(`/api/courses/${course.id}/join`)
      .set("Authorization", auth(user))
      .expect(201);
    expect(added.body.data.user.courses).toHaveLength(1);

    const removed = await request(api)
      .delete(`/api/courses/${course.id}/leave`)
      .set("Authorization", auth(user))
      .expect(200);
    expect(removed.body.data.user.courses).toHaveLength(0);
  });

  it("is idempotent — joining twice does not duplicate the enrolment", async () => {
    const { course } = await seedCatalog();
    const user = await createUser("idem");

    await request(api).post(`/api/courses/${course.id}/join`).set("Authorization", auth(user));
    const second = await request(api)
      .post(`/api/courses/${course.id}/join`)
      .set("Authorization", auth(user))
      .expect(201);

    expect(second.body.data.user.courses).toHaveLength(1);
  });

  it("404s for a course that does not exist", async () => {
    const user = await createUser("missing");
    await request(api)
      .post("/api/courses/2b1e4d0e-0000-4000-8000-000000000000/join")
      .set("Authorization", auth(user))
      .expect(404);
  });

  it("400s on a malformed course id instead of failing deeper in", async () => {
    const user = await createUser("badid");
    await request(api)
      .post("/api/courses/not-a-uuid/join")
      .set("Authorization", auth(user))
      .expect(400);
  });
});

describe("GET /api/courses/:courseId/people", () => {
  it("lists students who opted in", async () => {
    const { course } = await seedCatalog();
    const visible = await createUser("visible");
    const viewer = await createUser("viewer");

    await onboard(visible, ["CS 3358"]);
    await onboard(viewer, ["CS 3358"]);

    const response = await request(api)
      .get(`/api/courses/${course.id}/people`)
      .set("Authorization", auth(viewer))
      .expect(200);

    expect(response.body.data.people).toHaveLength(2);
  });

  /* Discovery is opt-in. A student who turned their profile off must not appear
     at all, not merely be shown with fewer fields. */
  it("omits students who hid their study profile", async () => {
    const { course } = await seedCatalog();
    const hidden = await createUser("hidden");
    const viewer = await createUser("looker");

    await onboard(hidden, ["CS 3358"]);
    await onboard(viewer, ["CS 3358"]);

    await request(api)
      .patch("/api/auth/me")
      .set("Authorization", auth(hidden))
      .send({ studyProfileVisible: false })
      .expect(200);

    const response = await request(api)
      .get(`/api/courses/${course.id}/people`)
      .set("Authorization", auth(viewer))
      .expect(200);

    expect(response.body.data.people.map((p: { id: string }) => p.id)).not.toContain(hidden.id);
  });

  it("never exposes an email address or password hash", async () => {
    const { course } = await seedCatalog();
    const student = await createUser("private");
    const viewer = await createUser("nosy");

    await onboard(student, ["CS 3358"]);
    await onboard(viewer, ["CS 3358"]);

    const response = await request(api)
      .get(`/api/courses/${course.id}/people`)
      .set("Authorization", auth(viewer))
      .expect(200);

    const body = JSON.stringify(response.body);
    expect(body).not.toContain(student.email);
    expect(body).not.toContain("passwordHash");
    expect(body).not.toContain("@txstate.edu");
  });

  it("surfaces a student's current open study intent", async () => {
    const { course } = await seedCatalog();
    const asker = await createUser("asker");
    const viewer = await createUser("peer");
    await onboard(asker, ["CS 3358"]);
    await onboard(viewer, ["CS 3358"]);

    await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(asker))
      .send({
        topic: "Pointer diagrams",
        intent: "NEED_HELP",
        meetingStyle: "ONLINE",
        maxParticipants: 3,
        timeOptions: [
          {
            startsAt: new Date(Date.now() + 86_400_000).toISOString(),
            endsAt: new Date(Date.now() + 93_600_000).toISOString(),
          },
        ],
      })
      .expect(201);

    const response = await request(api)
      .get(`/api/courses/${course.id}/people`)
      .set("Authorization", auth(viewer))
      .expect(200);

    const entry = response.body.data.people.find((p: { id: string }) => p.id === asker.id);
    expect(entry.currentIntent.intent).toBe("NEED_HELP");
  });

  it("requires a session", async () => {
    const { course } = await seedCatalog();
    await request(api).get(`/api/courses/${course.id}/people`).expect(401);
  });
});
