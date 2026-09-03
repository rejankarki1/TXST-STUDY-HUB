import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  api,
  auth,
  createUser,
  migrateTestDatabase,
  onboard,
  prisma,
  request,
  requestPayload,
  resetDatabase,
  seedCatalog,
  timeWindows,
  type TestUser,
} from "./helpers.js";

let course: { id: string };
let creator: TestUser;
let joiner: TestUser;
let outsider: TestUser;

beforeAll(() => {
  migrateTestDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  ({ course } = await seedCatalog());
  creator = await createUser("creator");
  joiner = await createUser("joiner");
  outsider = await createUser("outsider");
  await onboard(creator, ["CS 3358"]);
  await onboard(joiner, ["CS 3358"]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function createRequest(overrides: Record<string, unknown> = {}, user = creator) {
  const response = await request(api)
    .post(`/api/courses/${course.id}/study-requests`)
    .set("Authorization", auth(user))
    .send(requestPayload(overrides))
    .expect(201);

  return response.body.data.studyRequest;
}

describe("creating a study request", () => {
  it("returns the request with the creator already a participant", async () => {
    const created = await createRequest();

    expect(created.participantCount).toBe(1);
    expect(created.participants[0].isCreator).toBe(true);
    expect(created.isCreator).toBe(true);
    expect(created.status).toBe("OPEN");
  });

  /* The creator proposed every window, so availableCount must reflect that from
     the first render rather than showing zero. */
  it("marks the creator available for every window they proposed", async () => {
    const created = await createRequest();

    for (const option of created.timeOptions) {
      expect(option.availableCount).toBe(1);
      expect(option.selectedByMe).toBe(true);
    }
  });

  it("enrols the creator in the course", async () => {
    const fresh = await createUser("fresh");
    await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(fresh))
      .send(requestPayload())
      .expect(201);

    const enrolments = await prisma.userCourse.count({ where: { userId: fresh.id } });
    expect(enrolments).toBe(1);
  });

  it("rejects a request with no proposed times", async () => {
    await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(creator))
      .send(requestPayload({ timeOptions: [] }))
      .expect(400);
  });

  it("rejects more than three proposed times", async () => {
    await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(creator))
      .send(requestPayload({ timeOptions: timeWindows(4) }))
      .expect(400);
  });

  it("rejects a window that ends before it starts", async () => {
    await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(creator))
      .send(
        requestPayload({
          timeOptions: [
            {
              startsAt: new Date(Date.now() + 90_000_000).toISOString(),
              endsAt: new Date(Date.now() + 86_400_000).toISOString(),
            },
          ],
        }),
      )
      .expect(400);
  });

  it("requires a location for an in-person request", async () => {
    const response = await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(creator))
      .send(requestPayload({ meetingStyle: "IN_PERSON", location: "" }))
      .expect(400);

    expect(response.body.errors.location).toBeDefined();
  });

  it("rejects an unknown intent", async () => {
    await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(creator))
      .send(requestPayload({ intent: "NEEDS_A_FRIEND" }))
      .expect(400);
  });
});

describe("joining a study request", () => {
  it("adds the participant with the windows they selected", async () => {
    const created = await createRequest();
    const chosen = created.timeOptions[1].id;

    const response = await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [chosen] })
      .expect(201);

    const body = response.body.data.studyRequest;
    expect(body.participantCount).toBe(2);
    expect(body.timeOptions.find((o: { id: string }) => o.id === chosen).availableCount).toBe(2);
    expect(body.timeOptions.find((o: { id: string }) => o.id !== chosen).availableCount).toBe(1);
  });

  it("rejects a second join from the same student", async () => {
    const created = await createRequest();
    const ids = created.timeOptions.map((o: { id: string }) => o.id);

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: ids })
      .expect(201);

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: ids })
      .expect(409);
  });

  it("rejects the creator joining their own request again", async () => {
    const created = await createRequest();

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(creator))
      .send({ timeOptionIds: [created.timeOptions[0].id] })
      .expect(409);
  });

  it("enforces capacity", async () => {
    const created = await createRequest({ maxParticipants: 2 });
    const ids = [created.timeOptions[0].id];

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: ids })
      .expect(201);

    const response = await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(outsider))
      .send({ timeOptionIds: ids })
      .expect(409);

    expect(response.body.message).toMatch(/full/i);
  });

  it("rejects a time option belonging to a different request", async () => {
    const created = await createRequest();
    const other = await createRequest({ topic: "A different topic entirely" });

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [other.timeOptions[0].id] })
      .expect(400);
  });

  it("requires at least one selected time", async () => {
    const created = await createRequest();

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [] })
      .expect(400);
  });

  it("lets a participant change which windows they can make", async () => {
    const created = await createRequest();
    const [first, second] = created.timeOptions;

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [first.id] })
      .expect(201);

    const updated = await request(api)
      .put(`/api/study-requests/${created.id}/availability`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [second.id] })
      .expect(200);

    const options = updated.body.data.studyRequest.timeOptions;
    expect(options.find((o: { id: string }) => o.id === first.id).availableCount).toBe(1);
    expect(options.find((o: { id: string }) => o.id === second.id).availableCount).toBe(2);
  });
});

describe("withdrawing", () => {
  it("frees the participant's spot", async () => {
    const created = await createRequest();

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [created.timeOptions[0].id] })
      .expect(201);

    const response = await request(api)
      .delete(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .expect(200);

    expect(response.body.data.studyRequest.participantCount).toBe(1);
  });

  it("refuses to let the creator withdraw — cancelling is the honest action", async () => {
    const created = await createRequest();

    const response = await request(api)
      .delete(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(creator))
      .expect(403);

    expect(response.body.message).toMatch(/cancel/i);
  });

  it("404s when the student never joined", async () => {
    const created = await createRequest();

    await request(api)
      .delete(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(outsider))
      .expect(404);
  });
});

describe("editing and cancelling", () => {
  it("lets the creator edit", async () => {
    const created = await createRequest();

    const response = await request(api)
      .patch(`/api/study-requests/${created.id}`)
      .set("Authorization", auth(creator))
      .send({ topic: "Updated topic for the session" })
      .expect(200);

    expect(response.body.data.studyRequest.topic).toBe("Updated topic for the session");
  });

  it("rejects an edit from anyone else", async () => {
    const created = await createRequest();

    await request(api)
      .patch(`/api/study-requests/${created.id}`)
      .set("Authorization", auth(joiner))
      .send({ topic: "Hijacked topic here" })
      .expect(403);
  });

  it("refuses to shrink capacity below the people already in", async () => {
    const created = await createRequest({ maxParticipants: 4 });
    const times = [created.timeOptions[0].id];

    /* Three participants, so a shrink to 2 is both schema-valid and genuinely
       below the roster — the case the service guard exists for. */
    for (const participant of [joiner, outsider]) {
      await request(api)
        .post(`/api/study-requests/${created.id}/join`)
        .set("Authorization", auth(participant))
        .send({ timeOptionIds: times })
        .expect(201);
    }

    /* Shrinking to exactly the current roster is allowed. */
    await request(api)
      .patch(`/api/study-requests/${created.id}`)
      .set("Authorization", auth(creator))
      .send({ maxParticipants: 3 })
      .expect(200);

    const response = await request(api)
      .patch(`/api/study-requests/${created.id}`)
      .set("Authorization", auth(creator))
      .send({ maxParticipants: 2 })
      .expect(409);

    expect(response.body.message).toMatch(/already joined/i);
  });

  it("cancels, and a cancelled request cannot be joined", async () => {
    const created = await createRequest();

    await request(api)
      .patch(`/api/study-requests/${created.id}/cancel`)
      .set("Authorization", auth(creator))
      .expect(200);

    await request(api)
      .post(`/api/study-requests/${created.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [created.timeOptions[0].id] })
      .expect(409);
  });

  it("rejects a cancel from a non-creator", async () => {
    const created = await createRequest();

    await request(api)
      .patch(`/api/study-requests/${created.id}/cancel`)
      .set("Authorization", auth(joiner))
      .expect(403);
  });
});

describe("listing", () => {
  it("hides converted requests from the open list", async () => {
    const created = await createRequest();

    await request(api)
      .post(`/api/study-requests/${created.id}/convert-to-session`)
      .set("Authorization", auth(creator))
      .send({
        timeOptionId: created.timeOptions[0].id,
        mode: "IN_PERSON",
        location: "Alkek Library",
      })
      .expect(201);

    const response = await request(api)
      .get(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(joiner))
      .expect(200);

    expect(response.body.data.studyRequests).toHaveLength(0);
  });

  it("filters by intent", async () => {
    await createRequest({ intent: "NEED_HELP" });
    await createRequest({ intent: "CAN_HELP", topic: "Happy to explain Big-O" });

    const response = await request(api)
      .get(`/api/courses/${course.id}/study-requests?intent=CAN_HELP`)
      .set("Authorization", auth(joiner))
      .expect(200);

    expect(response.body.data.studyRequests).toHaveLength(1);
    expect(response.body.data.studyRequests[0].intent).toBe("CAN_HELP");
  });

  it("filters out full requests when openSpotsOnly is set", async () => {
    const full = await createRequest({ maxParticipants: 2, topic: "Nearly full request" });
    await request(api)
      .post(`/api/study-requests/${full.id}/join`)
      .set("Authorization", auth(joiner))
      .send({ timeOptionIds: [full.timeOptions[0].id] })
      .expect(201);

    await createRequest({ topic: "Plenty of room in here" });

    const response = await request(api)
      .get(`/api/courses/${course.id}/study-requests?openSpotsOnly=true`)
      .set("Authorization", auth(outsider))
      .expect(200);

    expect(response.body.data.studyRequests).toHaveLength(1);
    expect(response.body.data.studyRequests[0].topic).toBe("Plenty of room in here");
  });

  it("rejects an invalid filter value rather than ignoring it", async () => {
    await request(api)
      .get(`/api/courses/${course.id}/study-requests?intent=WHATEVER`)
      .set("Authorization", auth(joiner))
      .expect(400);
  });

  it("marks an expired request EXPIRED on read", async () => {
    const created = await createRequest();
    await prisma.studyRequest.update({
      where: { id: created.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await request(api)
      .get(`/api/study-requests/${created.id}`)
      .set("Authorization", auth(joiner))
      .expect(200);

    expect(response.body.data.studyRequest.status).toBe("EXPIRED");
  });
});
