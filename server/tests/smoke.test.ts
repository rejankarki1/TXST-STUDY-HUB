import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  api,
  auth,
  createUser,
  migrateTestDatabase,
  prisma,
  request,
  resetDatabase,
  seedCatalog,
  type TestUser,
} from "./helpers.js";

/**
 * The whole product journey, in order, as one narrative.
 *
 * signup -> onboarding -> add a course -> post a study request -> a second
 * student joins and picks times -> the organiser confirms a session -> RSVP ->
 * complete it -> the unresolved question becomes a course question -> someone
 * answers it -> the asker accepts.
 *
 * Every step depends on the previous one, so this fails loudly if any seam in
 * the Course Hub -> Request -> Session -> Question chain comes apart.
 */
describe("end-to-end study journey", () => {
  let course: { id: string };
  let alex: TestUser;
  let bailey: TestUser;

  let requestId: string;
  let timeOptionIds: string[];
  let sessionId: string;
  let questionId: string;
  let answerId: string;

  beforeAll(async () => {
    migrateTestDatabase();
    await resetDatabase();
    ({ course } = await seedCatalog());
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("1. two students sign up with TXST addresses", async () => {
    alex = await createUser("alex");
    bailey = await createUser("bailey");

    expect(alex.email).toMatch(/@txstate\.edu$/);
    expect(bailey.email).toMatch(/@txstate\.edu$/);
  });

  it("2. both complete onboarding with a course", async () => {
    for (const student of [alex, bailey]) {
      const response = await request(api)
        .patch("/api/auth/me")
        .set("Authorization", auth(student))
        .send({
          major: "Computer Science",
          gradYear: new Date().getFullYear() + 2,
          courseCodes: ["CS 3358"],
        })
        .expect(200);

      expect(response.body.data.user.onboardingCompleted).toBe(true);
    }
  });

  it("3. both appear in the Course Hub People tab", async () => {
    const response = await request(api)
      .get(`/api/courses/${course.id}/people`)
      .set("Authorization", auth(alex))
      .expect(200);

    const ids = response.body.data.people.map((p: { id: string }) => p.id);
    expect(ids).toContain(alex.id);
    expect(ids).toContain(bailey.id);
    expect(JSON.stringify(response.body)).not.toContain(bailey.email);
  });

  it("4. alex posts a study request with two proposed times", async () => {
    const response = await request(api)
      .post(`/api/courses/${course.id}/study-requests`)
      .set("Authorization", auth(alex))
      .send({
        topic: "Tree traversals before the midterm",
        details: "I can code them but I cannot trace them by hand.",
        intent: "NEED_HELP",
        meetingStyle: "IN_PERSON",
        location: "Alkek Library",
        maxParticipants: 4,
        timeOptions: [
          {
            startsAt: new Date(Date.now() + 86_400_000).toISOString(),
            endsAt: new Date(Date.now() + 93_600_000).toISOString(),
          },
          {
            startsAt: new Date(Date.now() + 172_800_000).toISOString(),
            endsAt: new Date(Date.now() + 180_000_000).toISOString(),
          },
        ],
      })
      .expect(201);

    const studyRequest = response.body.data.studyRequest;
    requestId = studyRequest.id;
    timeOptionIds = studyRequest.timeOptions.map((o: { id: string }) => o.id);

    expect(studyRequest.status).toBe("OPEN");
    expect(studyRequest.participantCount).toBe(1);
  });

  it("5. bailey sees it as an opportunity in their courses", async () => {
    const response = await request(api)
      .get("/api/study-requests/opportunities")
      .set("Authorization", auth(bailey))
      .expect(200);

    expect(response.body.data.studyRequests.map((r: { id: string }) => r.id)).toContain(requestId);
  });

  it("6. bailey joins, saying they can only make the second time", async () => {
    const response = await request(api)
      .post(`/api/study-requests/${requestId}/join`)
      .set("Authorization", auth(bailey))
      .send({ timeOptionIds: [timeOptionIds[1]] })
      .expect(201);

    const options = response.body.data.studyRequest.timeOptions;
    expect(options.find((o: { id: string }) => o.id === timeOptionIds[0]).availableCount).toBe(1);
    expect(options.find((o: { id: string }) => o.id === timeOptionIds[1]).availableCount).toBe(2);
  });

  it("7. alex confirms the time everyone can make, creating a session", async () => {
    const response = await request(api)
      .post(`/api/study-requests/${requestId}/convert-to-session`)
      .set("Authorization", auth(alex))
      .send({
        timeOptionId: timeOptionIds[1],
        mode: "IN_PERSON",
        location: "Alkek Library",
        locationDetail: "4th floor group room B",
        agenda: "Trace the three traversal orders by hand.",
      })
      .expect(201);

    sessionId = response.body.data.session.id;

    expect(response.body.data.studyRequest.status).toBe("CONVERTED");
    expect(response.body.data.session.goingCount).toBe(1);
    expect(response.body.data.session.maybeCount).toBe(1);
  });

  it("8. the converted request no longer shows as an opportunity", async () => {
    const response = await request(api)
      .get("/api/study-requests/opportunities")
      .set("Authorization", auth(bailey))
      .expect(200);

    expect(response.body.data.studyRequests.map((r: { id: string }) => r.id)).not.toContain(
      requestId,
    );
  });

  it("9. the session appears on both students' schedules", async () => {
    for (const student of [alex, bailey]) {
      const response = await request(api)
        .get("/api/sessions/mine")
        .set("Authorization", auth(student))
        .expect(200);

      expect(response.body.data.sessions.map((s: { id: string }) => s.id)).toContain(sessionId);
    }
  });

  it("10. bailey RSVPs going", async () => {
    const response = await request(api)
      .put(`/api/sessions/${sessionId}/rsvp`)
      .set("Authorization", auth(bailey))
      .send({ status: "GOING" })
      .expect(200);

    expect(response.body.data.session.goingCount).toBe(2);
    expect(response.body.data.session.myRsvp).toBe("GOING");
  });

  it("11. alex completes the session and posts what they could not solve", async () => {
    const response = await request(api)
      .patch(`/api/sessions/${sessionId}/complete`)
      .set("Authorization", auth(alex))
      .send({
        topicsCompleted: "Pre-order, in-order, post-order tracing",
        recap: "Traversals click now. Deletion is still shaky.",
        unresolvedQuestion: "Why does BST deletion use the in-order successor?",
        saveAsQuestion: true,
      })
      .expect(200);

    questionId = response.body.data.questionId;

    expect(response.body.data.session.status).toBe("COMPLETED");
    expect(questionId).toEqual(expect.any(String));
  });

  it("12. the question is searchable in the Course Hub", async () => {
    const response = await request(api)
      .get(`/api/courses/${course.id}/questions?search=successor`)
      .set("Authorization", auth(bailey))
      .expect(200);

    expect(response.body.data.questions).toHaveLength(1);
    expect(response.body.data.questions[0].id).toBe(questionId);
    expect(response.body.data.questions[0].status).toBe("OPEN");
  });

  it("13. bailey answers it", async () => {
    const response = await request(api)
      .post(`/api/questions/${questionId}/answers`)
      .set("Authorization", auth(bailey))
      .send({
        body: "Either works — successor and predecessor are symmetric. Both sit next to the deleted value in sorted order, so both preserve the BST ordering.",
      })
      .expect(201);

    answerId = response.body.data.question.answers[0].id;
    expect(response.body.data.question.answerCount).toBe(1);
  });

  it("14. alex accepts the answer and the question becomes solved", async () => {
    const response = await request(api)
      .patch(`/api/questions/${questionId}/answers/${answerId}/accept`)
      .set("Authorization", auth(alex))
      .send({ accepted: true })
      .expect(200);

    expect(response.body.data.question.status).toBe("SOLVED");
    expect(response.body.data.question.answers[0].isAccepted).toBe(true);
  });

  it("15. the solved answer is what the next student taking the course finds", async () => {
    const newcomer = await createUser("newcomer");
    await request(api)
      .patch("/api/auth/me")
      .set("Authorization", auth(newcomer))
      .send({
        major: "Computer Science",
        gradYear: new Date().getFullYear() + 3,
        courseCodes: ["CS 3358"],
      })
      .expect(200);

    const response = await request(api)
      .get(`/api/courses/${course.id}/questions?status=SOLVED`)
      .set("Authorization", auth(newcomer))
      .expect(200);

    expect(response.body.data.questions).toHaveLength(1);
    expect(response.body.data.questions[0].answers[0].isAccepted).toBe(true);
  });
});
