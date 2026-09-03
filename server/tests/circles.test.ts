import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  api,
  auth,
  circlePayload,
  createUser,
  migrateTestDatabase,
  onboard,
  prisma,
  request,
  resetDatabase,
  seedCatalog,
  type TestUser,
} from "./helpers.js";

let course: { id: string };
let owner: TestUser;
let member: TestUser;
let outsider: TestUser;

beforeAll(() => {
  migrateTestDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  ({ course } = await seedCatalog());
  owner = await createUser("owner");
  member = await createUser("member");
  outsider = await createUser("outsider");
  await onboard(owner, ["CS 3358"]);
  await onboard(member, ["CS 3358"]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createCircle(overrides: Record<string, unknown> = {}) {
  const response = await request(api)
    .post("/api/circles")
    .set("Authorization", auth(owner))
    .send(circlePayload(course.id, overrides))
    .expect(201);

  return response.body.data.circle;
}

describe("creating a circle", () => {
  it("makes the creator the owner and first member", async () => {
    const circle = await createCircle();

    expect(circle.isOwner).toBe(true);
    expect(circle.isMember).toBe(true);
    expect(circle.memberCount).toBe(1);
    expect(circle.members[0].role).toBe("OWNER");
  });

  it("carries a term and starts active", async () => {
    const circle = await createCircle();

    expect(circle.term).toBe("Fall 2026");
    expect(circle.status).toBe("ACTIVE");
  });

  it("rejects a malformed term", async () => {
    await request(api)
      .post("/api/circles")
      .set("Authorization", auth(owner))
      .send(circlePayload(course.id, { term: "sometime next year" }))
      .expect(400);
  });

  it("rejects an external link that is not a URL", async () => {
    await request(api)
      .post("/api/circles")
      .set("Authorization", auth(owner))
      .send(circlePayload(course.id, { externalLink: "not a link" }))
      .expect(400);
  });

  it("enrols the creator in the course", async () => {
    const fresh = await createUser("fresh");
    await request(api)
      .post("/api/circles")
      .set("Authorization", auth(fresh))
      .send(circlePayload(course.id))
      .expect(201);

    expect(await prisma.userCourse.count({ where: { userId: fresh.id } })).toBe(1);
  });
});

describe("membership", () => {
  it("lets a student join and appear on the roster", async () => {
    const circle = await createCircle();

    const response = await request(api)
      .post(`/api/circles/${circle.id}/join`)
      .set("Authorization", auth(member))
      .expect(201);

    expect(response.body.data.circle.memberCount).toBe(2);
    expect(response.body.data.circle.isMember).toBe(true);
  });

  it("rejects a duplicate join", async () => {
    const circle = await createCircle();

    await request(api).post(`/api/circles/${circle.id}/join`).set("Authorization", auth(member)).expect(201);
    await request(api).post(`/api/circles/${circle.id}/join`).set("Authorization", auth(member)).expect(409);
  });

  it("enforces the member cap", async () => {
    const circle = await createCircle({ maxMembers: 2 });

    await request(api).post(`/api/circles/${circle.id}/join`).set("Authorization", auth(member)).expect(201);

    const response = await request(api)
      .post(`/api/circles/${circle.id}/join`)
      .set("Authorization", auth(outsider))
      .expect(409);

    expect(response.body.message).toMatch(/full/i);
  });

  it("lets a member leave", async () => {
    const circle = await createCircle();
    await request(api).post(`/api/circles/${circle.id}/join`).set("Authorization", auth(member)).expect(201);

    const response = await request(api)
      .delete(`/api/circles/${circle.id}/leave`)
      .set("Authorization", auth(member))
      .expect(200);

    expect(response.body.data.circle.memberCount).toBe(1);
  });

  /* An owner walking out would leave a circle nobody can edit or archive. */
  it("refuses to let the owner leave", async () => {
    const circle = await createCircle();

    const response = await request(api)
      .delete(`/api/circles/${circle.id}/leave`)
      .set("Authorization", auth(owner))
      .expect(403);

    expect(response.body.message).toMatch(/archive or delete/i);
  });

  it("404s when a non-member tries to leave", async () => {
    const circle = await createCircle();

    await request(api)
      .delete(`/api/circles/${circle.id}/leave`)
      .set("Authorization", auth(outsider))
      .expect(404);
  });
});

describe("owner controls", () => {
  it("lets the owner edit", async () => {
    const circle = await createCircle();

    const response = await request(api)
      .patch(`/api/circles/${circle.id}`)
      .set("Authorization", auth(owner))
      .send({ name: "Renamed problem set crew" })
      .expect(200);

    expect(response.body.data.circle.name).toBe("Renamed problem set crew");
  });

  it("rejects an edit from a member", async () => {
    const circle = await createCircle();
    await request(api).post(`/api/circles/${circle.id}/join`).set("Authorization", auth(member)).expect(201);

    await request(api)
      .patch(`/api/circles/${circle.id}`)
      .set("Authorization", auth(member))
      .send({ name: "Member takeover attempt" })
      .expect(403);
  });

  it("archives, and an archived circle cannot be joined", async () => {
    const circle = await createCircle();

    const archived = await request(api)
      .patch(`/api/circles/${circle.id}/archive`)
      .set("Authorization", auth(owner))
      .send({ archived: true })
      .expect(200);

    expect(archived.body.data.circle.status).toBe("ARCHIVED");

    await request(api)
      .post(`/api/circles/${circle.id}/join`)
      .set("Authorization", auth(member))
      .expect(409);
  });

  it("reopens an archived circle", async () => {
    const circle = await createCircle();
    await request(api)
      .patch(`/api/circles/${circle.id}/archive`)
      .set("Authorization", auth(owner))
      .send({ archived: true })
      .expect(200);

    const reopened = await request(api)
      .patch(`/api/circles/${circle.id}/archive`)
      .set("Authorization", auth(owner))
      .send({ archived: false })
      .expect(200);

    expect(reopened.body.data.circle.status).toBe("ACTIVE");
  });

  it("hides archived circles from the default listing", async () => {
    const circle = await createCircle();
    await request(api)
      .patch(`/api/circles/${circle.id}/archive`)
      .set("Authorization", auth(owner))
      .send({ archived: true })
      .expect(200);

    const response = await request(api)
      .get(`/api/circles?courseId=${course.id}`)
      .set("Authorization", auth(member))
      .expect(200);

    expect(response.body.data.circles).toHaveLength(0);
  });

  it("rejects an archive from a non-owner", async () => {
    const circle = await createCircle();

    await request(api)
      .patch(`/api/circles/${circle.id}/archive`)
      .set("Authorization", auth(member))
      .send({ archived: true })
      .expect(403);
  });

  it("lets the owner delete", async () => {
    const circle = await createCircle();

    await request(api)
      .delete(`/api/circles/${circle.id}`)
      .set("Authorization", auth(owner))
      .expect(200);

    await request(api)
      .get(`/api/circles/${circle.id}`)
      .set("Authorization", auth(owner))
      .expect(404);
  });

  it("rejects a delete from a member", async () => {
    const circle = await createCircle();
    await request(api).post(`/api/circles/${circle.id}/join`).set("Authorization", auth(member)).expect(201);

    await request(api)
      .delete(`/api/circles/${circle.id}`)
      .set("Authorization", auth(member))
      .expect(403);
  });

  /* Deleting a circle must not delete meetings people already committed to. */
  it("keeps sessions alive when the circle is deleted", async () => {
    const circle = await createCircle();

    const session = await request(api)
      .post(`/api/circles/${circle.id}/sessions`)
      .set("Authorization", auth(owner))
      .send({
        title: "Problem set 4",
        description: "Trees",
        startsAt: new Date(Date.now() + 172_800_000).toISOString(),
        endsAt: new Date(Date.now() + 180_000_000).toISOString(),
        mode: "IN_PERSON",
        location: "Alkek",
      })
      .expect(201);

    await request(api)
      .delete(`/api/circles/${circle.id}`)
      .set("Authorization", auth(owner))
      .expect(200);

    const kept = await request(api)
      .get(`/api/sessions/${session.body.data.session.id}`)
      .set("Authorization", auth(owner))
      .expect(200);

    expect(kept.body.data.session.circleId).toBeNull();
  });
});

describe("GET /api/circles/mine", () => {
  it("returns only the circles the student belongs to", async () => {
    await createCircle();

    const mine = await request(api)
      .get("/api/circles/mine")
      .set("Authorization", auth(owner))
      .expect(200);
    expect(mine.body.data.circles).toHaveLength(1);

    const theirs = await request(api)
      .get("/api/circles/mine")
      .set("Authorization", auth(outsider))
      .expect(200);
    expect(theirs.body.data.circles).toHaveLength(0);
  });
});
