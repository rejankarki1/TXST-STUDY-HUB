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
  requestPayload,
  resetDatabase,
  seedCatalog,
  sessionPayload,
  type TestUser,
} from "./helpers.js";

let course: { id: string };
let organizer: TestUser;
let participant: TestUser;
let outsider: TestUser;

beforeAll(() => {
  migrateTestDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  ({ course } = await seedCatalog());
  organizer = await createUser("organizer");
  participant = await createUser("participant");
  outsider = await createUser("outsider");
  await onboard(organizer, ["CS 3358"]);
  await onboard(participant, ["CS 3358"]);
  await onboard(outsider, ["CS 3358"]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

/** Posts a request, has `participant` join, and converts it into a session. */
async function sessionFromRequest(convertOverrides: Record<string, unknown> = {}) {
  const created = await request(api)
    .post(`/api/courses/${course.id}/study-requests`)
    .set("Authorization", auth(organizer))
    .send(requestPayload())
    .expect(201);

  const studyRequest = created.body.data.studyRequest;

  await request(api)
    .post(`/api/study-requests/${studyRequest.id}/join`)
    .set("Authorization", auth(participant))
    .send({ timeOptionIds: [studyRequest.timeOptions[0].id] })
    .expect(201);

  const converted = await request(api)
    .post(`/api/study-requests/${studyRequest.id}/convert-to-session`)
    .set("Authorization", auth(organizer))
    .send({
      timeOptionId: studyRequest.timeOptions[0].id,
      mode: "IN_PERSON",
      location: "Alkek Library",
      ...convertOverrides,
    })
    .expect(201);

  return { studyRequest, session: converted.body.data.session };
}

describe("converting a request into a session", () => {
  it("creates the session, RSVPs the organizer GOING and everyone else MAYBE", async () => {
    const { session } = await sessionFromRequest();

    expect(session.studyRequestId).toBeTruthy();
    expect(session.circleId).toBeNull();
    expect(session.status).toBe("PLANNED");

    const statuses = Object.fromEntries(
      session.attendees.map((a: { id: string; status: string }) => [a.id, a.status]),
    );
    expect(statuses[organizer.id]).toBe("GOING");
    expect(statuses[participant.id]).toBe("MAYBE");
  });

  it("marks the request CONVERTED and links it to the session", async () => {
    const { studyRequest, session } = await sessionFromRequest();

    const after = await request(api)
      .get(`/api/study-requests/${studyRequest.id}`)
      .set("Authorization", auth(organizer))
      .expect(200);

    expect(after.body.data.studyRequest.status).toBe("CONVERTED");
    expect(after.body.data.studyRequest.sessionId).toBe(session.id);
  });

  /* The unique index on StudySession.studyRequestId is the real guard; this
     proves the API surfaces it as a clean 409 rather than a second meeting. */
  it("refuses a second conversion and never creates a duplicate session", async () => {
    const { studyRequest } = await sessionFromRequest();

    const second = await request(api)
      .post(`/api/study-requests/${studyRequest.id}/convert-to-session`)
      .set("Authorization", auth(organizer))
      .send({
        timeOptionId: studyRequest.timeOptions[1].id,
        mode: "IN_PERSON",
        location: "Somewhere else",
      })
      .expect(409);

    expect(second.body.message).toMatch(/already became a session/i);
    expect(await prisma.studySession.count({ where: { studyRequestId: studyRequest.id } })).toBe(1);
  });

  it("rejects a conversion by anyone but the creator", async () => {
    const created = await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(organizer))
      .send(requestPayload())
      .expect(201);
    const studyRequest = created.body.data.studyRequest;

    await request(api)
      .post(`/api/study-requests/${studyRequest.id}/convert-to-session`)
      .set("Authorization", auth(participant))
      .send({
        timeOptionId: studyRequest.timeOptions[0].id,
        mode: "IN_PERSON",
        location: "Alkek",
      })
      .expect(403);
  });

  /* If any step of the transaction is rejected, nothing may survive: no session,
     no RSVPs, and the request must stay OPEN. */
  it("rolls the whole transaction back when the chosen time is not one of the options", async () => {
    const created = await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(organizer))
      .send(requestPayload())
      .expect(201);
    const studyRequest = created.body.data.studyRequest;

    const other = await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(organizer))
      .send(requestPayload({ topic: "An unrelated second request" }))
      .expect(201);

    await request(api)
      .post(`/api/study-requests/${studyRequest.id}/convert-to-session`)
      .set("Authorization", auth(organizer))
      .send({
        timeOptionId: other.body.data.studyRequest.timeOptions[0].id,
        mode: "IN_PERSON",
        location: "Alkek",
      })
      .expect(400);

    expect(await prisma.studySession.count({ where: { studyRequestId: studyRequest.id } })).toBe(0);
    expect(await prisma.sessionRsvp.count()).toBe(0);

    const untouched = await request(api)
      .get(`/api/study-requests/${studyRequest.id}`)
      .set("Authorization", auth(organizer))
      .expect(200);
    expect(untouched.body.data.studyRequest.status).toBe("OPEN");
  });

  it("requires a meeting link for an online session", async () => {
    const created = await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(organizer))
      .send(requestPayload())
      .expect(201);
    const studyRequest = created.body.data.studyRequest;

    await request(api)
      .post(`/api/study-requests/${studyRequest.id}/convert-to-session`)
      .set("Authorization", auth(organizer))
      .send({ timeOptionId: studyRequest.timeOptions[0].id, mode: "ONLINE", location: "Zoom" })
      .expect(400);
  });
});

describe("circle sessions", () => {
  async function createCircle() {
    const response = await request(api)
      .post("/api/circles")
      .set("Authorization", auth(organizer))
      .send(circlePayload(course.id))
      .expect(201);
    return response.body.data.circle;
  }

  it("lets any member schedule one", async () => {
    const circle = await createCircle();
    await request(api).post(`/api/circles/${circle.id}/join`).set("Authorization", auth(participant)).expect(201);

    const response = await request(api)
      .post(`/api/circles/${circle.id}/sessions`)
      .set("Authorization", auth(participant))
      .send(sessionPayload())
      .expect(201);

    expect(response.body.data.session.circleId).toBe(circle.id);
    expect(response.body.data.session.myRsvp).toBe("GOING");
  });

  it("rejects a non-member scheduling one", async () => {
    const circle = await createCircle();

    await request(api)
      .post(`/api/circles/${circle.id}/sessions`)
      .set("Authorization", auth(outsider))
      .send(sessionPayload())
      .expect(403);
  });

  it("rejects scheduling into an archived circle", async () => {
    const circle = await createCircle();
    await request(api)
      .patch(`/api/circles/${circle.id}/archive`)
      .set("Authorization", auth(organizer))
      .send({ archived: true })
      .expect(200);

    await request(api)
      .post(`/api/circles/${circle.id}/sessions`)
      .set("Authorization", auth(organizer))
      .send(sessionPayload())
      .expect(409);
  });
});

describe("RSVP", () => {
  it("lets a participant change their answer and updates the counts", async () => {
    const { session } = await sessionFromRequest();

    const response = await request(api)
      .put(`/api/sessions/${session.id}/rsvp`)
      .set("Authorization", auth(participant))
      .send({ status: "GOING" })
      .expect(200);

    expect(response.body.data.session.myRsvp).toBe("GOING");
    expect(response.body.data.session.goingCount).toBe(2);
    expect(response.body.data.session.maybeCount).toBe(0);
  });

  it("rejects an RSVP from someone not in the session", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .put(`/api/sessions/${session.id}/rsvp`)
      .set("Authorization", auth(outsider))
      .send({ status: "GOING" })
      .expect(403);
  });

  it("rejects an unknown RSVP value", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .put(`/api/sessions/${session.id}/rsvp`)
      .set("Authorization", auth(participant))
      .send({ status: "PROBABLY" })
      .expect(400);
  });

  it("stops taking RSVPs once the session is cancelled", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .patch(`/api/sessions/${session.id}/cancel`)
      .set("Authorization", auth(organizer))
      .expect(200);

    await request(api)
      .put(`/api/sessions/${session.id}/rsvp`)
      .set("Authorization", auth(participant))
      .send({ status: "GOING" })
      .expect(409);
  });
});

describe("meeting-link privacy", () => {
  it("shows the link to a participant", async () => {
    const { session } = await sessionFromRequest({
      mode: "ONLINE",
      location: "Zoom",
      meetingLink: "https://txstate.zoom.us/j/123456",
    });

    const response = await request(api)
      .get(`/api/sessions/${session.id}`)
      .set("Authorization", auth(participant))
      .expect(200);

    expect(response.body.data.session.meetingLink).toBe("https://txstate.zoom.us/j/123456");
    expect(response.body.data.session.canAccessDetails).toBe(true);
  });

  /* A join link is a door. Somebody in the course who is not in the session can
     see that it exists and nothing more. */
  it("withholds the link and the attendee list from everyone else", async () => {
    const { session } = await sessionFromRequest({
      mode: "ONLINE",
      location: "Zoom",
      meetingLink: "https://txstate.zoom.us/j/123456",
    });

    const response = await request(api)
      .get(`/api/sessions/${session.id}`)
      .set("Authorization", auth(outsider))
      .expect(200);

    const body = response.body.data.session;
    expect(body.meetingLink).toBeNull();
    expect(body.attendees).toHaveLength(0);
    expect(body.canAccessDetails).toBe(false);
    /* Counts stay public so the session still reads as real. */
    expect(body.goingCount).toBe(1);
    expect(JSON.stringify(response.body)).not.toContain("zoom.us");
  });
});

describe("session lifecycle", () => {
  it("lets the organizer edit", async () => {
    const { session } = await sessionFromRequest();

    const response = await request(api)
      .patch(`/api/sessions/${session.id}`)
      .set("Authorization", auth(organizer))
      .send({ title: "Renamed study session" })
      .expect(200);

    expect(response.body.data.session.title).toBe("Renamed study session");
  });

  it("rejects an edit from a participant", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .patch(`/api/sessions/${session.id}`)
      .set("Authorization", auth(participant))
      .send({ title: "Participant takeover" })
      .expect(403);
  });

  it("rejects an edit that inverts the times", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .patch(`/api/sessions/${session.id}`)
      .set("Authorization", auth(organizer))
      .send({ endsAt: new Date(Date.now() - 86_400_000).toISOString() })
      .expect(400);
  });

  it("cancels", async () => {
    const { session } = await sessionFromRequest();

    const response = await request(api)
      .patch(`/api/sessions/${session.id}/cancel`)
      .set("Authorization", auth(organizer))
      .expect(200);

    expect(response.body.data.session.status).toBe("CANCELLED");
  });

  it("rejects a cancel from a participant", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .patch(`/api/sessions/${session.id}/cancel`)
      .set("Authorization", auth(participant))
      .expect(403);
  });

  it("completes with a recap", async () => {
    const { session } = await sessionFromRequest();

    const response = await request(api)
      .patch(`/api/sessions/${session.id}/complete`)
      .set("Authorization", auth(organizer))
      .send({ topicsCompleted: "Traversals", recap: "Got through Q1-Q5." })
      .expect(200);

    expect(response.body.data.session.status).toBe("COMPLETED");
    expect(response.body.data.session.recap).toBe("Got through Q1-Q5.");
    expect(response.body.data.questionId).toBeNull();
  });

  /* The unresolved question is only posted on an explicit opt-in. */
  it("does not post a course question unless saveAsQuestion is true", async () => {
    const { session } = await sessionFromRequest();

    const response = await request(api)
      .patch(`/api/sessions/${session.id}/complete`)
      .set("Authorization", auth(organizer))
      .send({ unresolvedQuestion: "When does an array decay to a pointer?" })
      .expect(200);

    expect(response.body.data.questionId).toBeNull();
    expect(await prisma.courseQuestion.count()).toBe(0);
  });

  it("posts the unresolved question when explicitly confirmed", async () => {
    const { session } = await sessionFromRequest();

    const response = await request(api)
      .patch(`/api/sessions/${session.id}/complete`)
      .set("Authorization", auth(organizer))
      .send({
        unresolvedQuestion: "When does an array decay to a pointer?",
        saveAsQuestion: true,
      })
      .expect(200);

    expect(response.body.data.questionId).toEqual(expect.any(String));

    const question = await prisma.courseQuestion.findUniqueOrThrow({
      where: { id: response.body.data.questionId },
    });
    expect(question.courseId).toBe(course.id);
    expect(question.status).toBe("OPEN");
  });

  it("rejects saveAsQuestion with no question text", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .patch(`/api/sessions/${session.id}/complete`)
      .set("Authorization", auth(organizer))
      .send({ saveAsQuestion: true })
      .expect(400);
  });

  it("refuses to complete a cancelled session", async () => {
    const { session } = await sessionFromRequest();

    await request(api)
      .patch(`/api/sessions/${session.id}/cancel`)
      .set("Authorization", auth(organizer))
      .expect(200);

    await request(api)
      .patch(`/api/sessions/${session.id}/complete`)
      .set("Authorization", auth(organizer))
      .send({ recap: "Too late" })
      .expect(409);
  });
});

describe("GET /api/sessions/mine", () => {
  it("includes sessions the student was matched into", async () => {
    await sessionFromRequest();

    const response = await request(api)
      .get("/api/sessions/mine")
      .set("Authorization", auth(participant))
      .expect(200);

    expect(response.body.data.sessions).toHaveLength(1);
  });

  it("excludes sessions the student has nothing to do with", async () => {
    await sessionFromRequest();

    const response = await request(api)
      .get("/api/sessions/mine")
      .set("Authorization", auth(outsider))
      .expect(200);

    expect(response.body.data.sessions).toHaveLength(0);
  });
});
