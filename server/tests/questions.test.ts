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
  type TestUser,
} from "./helpers.js";

let course: { id: string };
let other: { id: string };
let asker: TestUser;
let answerer: TestUser;
let bystander: TestUser;

const questionBody = {
  title: "Why does deletion use the in-order successor?",
  body: "The predecessor looks symmetric to me and I cannot see why one is preferred.",
};

beforeAll(() => {
  migrateTestDatabase();
});

beforeEach(async () => {
  await resetDatabase();
  const catalog = await seedCatalog();
  course = catalog.course;
  other = catalog.other;
  asker = await createUser("asker");
  answerer = await createUser("answerer");
  bystander = await createUser("bystander");
  await onboard(asker, ["CS 3358"]);
  await onboard(answerer, ["CS 3358"]);
});

afterAll(async () => {
  await prisma.$disconnect();
});

async function ask(overrides: Record<string, unknown> = {}, courseId = course.id) {
  const response = await request(api)
    .post(`/api/courses/${courseId}/questions`)
    .set("Authorization", auth(asker))
    .send({ ...questionBody, ...overrides })
    .expect(201);

  return response.body.data.question;
}

async function answer(questionId: string, body = "Both work — they are symmetric.") {
  const response = await request(api)
    .post(`/api/questions/${questionId}/answers`)
    .set("Authorization", auth(answerer))
    .send({ body })
    .expect(201);

  return response.body.data.question;
}

describe("asking", () => {
  it("creates an open question attributed to the author", async () => {
    const question = await ask();

    expect(question.status).toBe("OPEN");
    expect(question.isAuthor).toBe(true);
    expect(question.answerCount).toBe(0);
    expect(question.acceptedAnswerId).toBeNull();
  });

  it("rejects a title that is too short to be a question", async () => {
    await request(api)
      .post(`/api/courses/${course.id}/questions`)
      .set("Authorization", auth(asker))
      .send({ title: "help", body: "I am completely stuck on this problem." })
      .expect(400);
  });

  it("rejects an empty body", async () => {
    await request(api)
      .post(`/api/courses/${course.id}/questions`)
      .set("Authorization", auth(asker))
      .send({ title: "A perfectly reasonable question title", body: "" })
      .expect(400);
  });

  it("requires a session — nothing here is anonymous", async () => {
    await request(api)
      .post(`/api/courses/${course.id}/questions`)
      .send(questionBody)
      .expect(401);
  });
});

describe("listing and searching", () => {
  it("lists questions for one course only", async () => {
    await ask();
    await ask({ title: "A question about the other course entirely" }, other.id);

    const response = await request(api)
      .get(`/api/courses/${course.id}/questions`)
      .set("Authorization", auth(answerer))
      .expect(200);

    expect(response.body.data.questions).toHaveLength(1);
  });

  it("searches the title and body", async () => {
    await ask();
    await ask({ title: "Something completely different about graphs", body: "Adjacency lists." });

    const response = await request(api)
      .get(`/api/courses/${course.id}/questions?search=adjacency`)
      .set("Authorization", auth(answerer))
      .expect(200);

    expect(response.body.data.questions).toHaveLength(1);
  });

  it("filters to solved questions", async () => {
    const solved = await ask();
    const withAnswer = await answer(solved.id);
    await request(api)
      .patch(`/api/questions/${solved.id}/answers/${withAnswer.answers[0].id}/accept`)
      .set("Authorization", auth(asker))
      .send({ accepted: true })
      .expect(200);

    await ask({ title: "A second question that is still open" });

    const response = await request(api)
      .get(`/api/courses/${course.id}/questions?status=SOLVED`)
      .set("Authorization", auth(answerer))
      .expect(200);

    expect(response.body.data.questions).toHaveLength(1);
    expect(response.body.data.questions[0].status).toBe("SOLVED");
  });

  it("rejects an unknown status filter", async () => {
    await request(api)
      .get(`/api/courses/${course.id}/questions?status=MAYBE`)
      .set("Authorization", auth(answerer))
      .expect(400);
  });
});

describe("answering", () => {
  it("adds an answer and bumps the count", async () => {
    const question = await ask();
    const updated = await answer(question.id);

    expect(updated.answerCount).toBe(1);
    expect(updated.answers[0].author.id).toBe(answerer.id);
    expect(updated.answers[0].isAccepted).toBe(false);
  });

  it("lets the answer author edit their own answer", async () => {
    const question = await ask();
    const withAnswer = await answer(question.id);

    const updated = await request(api)
      .patch(`/api/questions/${question.id}/answers/${withAnswer.answers[0].id}`)
      .set("Authorization", auth(answerer))
      .send({ body: "Rewritten and clearer answer text." })
      .expect(200);

    expect(updated.body.data.question.answers[0].body).toBe("Rewritten and clearer answer text.");
  });

  it("rejects an edit from someone else", async () => {
    const question = await ask();
    const withAnswer = await answer(question.id);

    await request(api)
      .patch(`/api/questions/${question.id}/answers/${withAnswer.answers[0].id}`)
      .set("Authorization", auth(bystander))
      .send({ body: "Not my answer to edit." })
      .expect(403);
  });
});

describe("accepting an answer", () => {
  it("marks the question solved and the answer accepted", async () => {
    const question = await ask();
    const withAnswer = await answer(question.id);
    const answerId = withAnswer.answers[0].id;

    const response = await request(api)
      .patch(`/api/questions/${question.id}/answers/${answerId}/accept`)
      .set("Authorization", auth(asker))
      .send({ accepted: true })
      .expect(200);

    const updated = response.body.data.question;
    expect(updated.status).toBe("SOLVED");
    expect(updated.acceptedAnswerId).toBe(answerId);
    expect(updated.answers[0].isAccepted).toBe(true);
  });

  /* The failure mode this guards: an answer author marking their own answer
     correct. */
  it("rejects an accept from anyone but the asker", async () => {
    const question = await ask();
    const withAnswer = await answer(question.id);

    await request(api)
      .patch(`/api/questions/${question.id}/answers/${withAnswer.answers[0].id}/accept`)
      .set("Authorization", auth(answerer))
      .send({ accepted: true })
      .expect(403);
  });

  /* Without this check one course's answer could be attached to another
     course's question. */
  it("rejects an answer id belonging to a different question", async () => {
    const question = await ask();
    const otherQuestion = await ask({ title: "An entirely separate question here" });
    const otherAnswer = await answer(otherQuestion.id);

    const response = await request(api)
      .patch(`/api/questions/${question.id}/answers/${otherAnswer.answers[0].id}/accept`)
      .set("Authorization", auth(asker))
      .send({ accepted: true })
      .expect(400);

    expect(response.body.message).toMatch(/different question/i);
  });

  it("reopens the question when the answer is unaccepted", async () => {
    const question = await ask();
    const withAnswer = await answer(question.id);
    const answerId = withAnswer.answers[0].id;

    await request(api)
      .patch(`/api/questions/${question.id}/answers/${answerId}/accept`)
      .set("Authorization", auth(asker))
      .send({ accepted: true })
      .expect(200);

    const reopened = await request(api)
      .patch(`/api/questions/${question.id}/answers/${answerId}/accept`)
      .set("Authorization", auth(asker))
      .send({ accepted: false })
      .expect(200);

    expect(reopened.body.data.question.status).toBe("OPEN");
    expect(reopened.body.data.question.acceptedAnswerId).toBeNull();
  });

  it("sorts the accepted answer to the top", async () => {
    const question = await ask();
    await answer(question.id, "The first answer, which is not accepted.");
    const withSecond = await answer(question.id, "The second answer, which is the good one.");
    const secondId = withSecond.answers[1].id;

    const response = await request(api)
      .patch(`/api/questions/${question.id}/answers/${secondId}/accept`)
      .set("Authorization", auth(asker))
      .send({ accepted: true })
      .expect(200);

    expect(response.body.data.question.answers[0].id).toBe(secondId);
  });

  /* A SOLVED question pointing at a deleted answer would be a dead end. */
  it("reopens the question if its accepted answer is deleted", async () => {
    const question = await ask();
    const withAnswer = await answer(question.id);
    const answerId = withAnswer.answers[0].id;

    await request(api)
      .patch(`/api/questions/${question.id}/answers/${answerId}/accept`)
      .set("Authorization", auth(asker))
      .send({ accepted: true })
      .expect(200);

    const afterDelete = await request(api)
      .delete(`/api/questions/${question.id}/answers/${answerId}`)
      .set("Authorization", auth(answerer))
      .expect(200);

    expect(afterDelete.body.data.question.status).toBe("OPEN");
    expect(afterDelete.body.data.question.acceptedAnswerId).toBeNull();
  });
});

describe("ownership", () => {
  it("lets the author edit their question", async () => {
    const question = await ask();

    const response = await request(api)
      .patch(`/api/questions/${question.id}`)
      .set("Authorization", auth(asker))
      .send({ title: "A revised and clearer question title" })
      .expect(200);

    expect(response.body.data.question.title).toBe("A revised and clearer question title");
  });

  it("rejects an edit from someone else", async () => {
    const question = await ask();

    await request(api)
      .patch(`/api/questions/${question.id}`)
      .set("Authorization", auth(bystander))
      .send({ title: "Hijacking this question title" })
      .expect(403);
  });

  it("deletes a question and its answers together", async () => {
    const question = await ask();
    await answer(question.id);

    await request(api)
      .delete(`/api/questions/${question.id}`)
      .set("Authorization", auth(asker))
      .expect(200);

    expect(await prisma.courseAnswer.count()).toBe(0);
  });

  it("rejects a delete from someone else", async () => {
    const question = await ask();

    await request(api)
      .delete(`/api/questions/${question.id}`)
      .set("Authorization", auth(bystander))
      .expect(403);
  });
});
