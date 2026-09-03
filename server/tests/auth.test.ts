import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  api,
  createUser,
  migrateTestDatabase,
  password,
  prisma,
  request,
  resetDatabase,
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

describe("POST /api/auth/signup", () => {
  it("creates an account and returns an access token plus a refresh cookie", async () => {
    const response = await request(api)
      .post("/api/auth/signup")
      .send({ email: "new.student@txstate.edu", name: "New Student", password })
      .expect(201);

    expect(response.body.data.accessToken).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe("new.student@txstate.edu");

    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies[0]).toContain("refreshToken=");
    expect(cookies[0]).toContain("HttpOnly");
  });

  it("rejects an email outside the allowed domain", async () => {
    const response = await request(api)
      .post("/api/auth/signup")
      .send({ email: "someone@gmail.com", name: "Outsider", password })
      .expect(400);

    expect(response.body.errors.email[0]).toMatch(/txstate\.edu/);
  });

  it("normalizes case and surrounding whitespace before storing the email", async () => {
    await request(api)
      .post("/api/auth/signup")
      .send({ email: "  MiXeD.Case@TXState.EDU  ", name: "Mixed", password })
      .expect(201);

    const user = await prisma.user.findUnique({ where: { email: "mixed.case@txstate.edu" } });
    expect(user).not.toBeNull();
  });

  it("treats a differently-cased address as the same account", async () => {
    await request(api)
      .post("/api/auth/signup")
      .send({ email: "dup@txstate.edu", password })
      .expect(201);

    await request(api)
      .post("/api/auth/signup")
      .send({ email: "DUP@txstate.edu", password })
      .expect(409);
  });

  it("rejects a weak password", async () => {
    const response = await request(api)
      .post("/api/auth/signup")
      .send({ email: "weak@txstate.edu", password: "password" })
      .expect(400);

    expect(response.body.errors.password).toBeDefined();
  });

  it("never returns the password hash", async () => {
    const response = await request(api)
      .post("/api/auth/signup")
      .send({ email: "safe@txstate.edu", password })
      .expect(201);

    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with a normalized email", async () => {
    const user = await createUser("login");

    const response = await request(api)
      .post("/api/auth/login")
      .send({ email: user.email.toUpperCase(), password })
      .expect(200);

    expect(response.body.data.user.id).toBe(user.id);
  });

  it("returns the same generic message for a wrong password and an unknown account", async () => {
    const user = await createUser("generic");

    const wrongPassword = await request(api)
      .post("/api/auth/login")
      .send({ email: user.email, password: "Wrong!Pass1" })
      .expect(401);

    const unknownAccount = await request(api)
      .post("/api/auth/login")
      .send({ email: "ghost@txstate.edu", password: "Wrong!Pass1" })
      .expect(401);

    expect(wrongPassword.body.message).toBe(unknownAccount.body.message);
    expect(wrongPassword.body.message).toBe("Invalid email or password");
  });
});

describe("POST /api/auth/refresh", () => {
  it("rotates the refresh token and issues a new access token", async () => {
    const user = await createUser("rotate");

    const response = await request(api)
      .post("/api/auth/refresh")
      .set("Cookie", user.cookie)
      .expect(200);

    const cookies = response.headers["set-cookie"] as unknown as string[];
    expect(cookies[0]).not.toBe(user.cookie);
    expect(response.body.data.user.id).toBe(user.id);
  });

  /* Two tabs, or React StrictMode, present the same cookie microseconds apart.
     Signing one of them out is the bug the grace window exists to prevent. */
  it("honours concurrent refreshes with the same cookie", async () => {
    const user = await createUser("concurrent");

    const responses = await Promise.all([
      request(api).post("/api/auth/refresh").set("Cookie", user.cookie),
      request(api).post("/api/auth/refresh").set("Cookie", user.cookie),
      request(api).post("/api/auth/refresh").set("Cookie", user.cookie),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    }
  });

  it("treats reuse after the grace window as theft and revokes every session", async () => {
    const user = await createUser("reuse");

    await request(api).post("/api/auth/refresh").set("Cookie", user.cookie).expect(200);

    /* Age the rotation past the 30s grace window. */
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, rotatedAt: { not: null } },
      data: { rotatedAt: new Date(Date.now() - 60_000) },
    });

    await request(api).post("/api/auth/refresh").set("Cookie", user.cookie).expect(401);

    expect(await prisma.refreshToken.count({ where: { userId: user.id } })).toBe(0);
  });

  it("rejects a request with no refresh cookie", async () => {
    await request(api).post("/api/auth/refresh").expect(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("deletes the presented refresh token", async () => {
    const user = await createUser("logout");

    await request(api).post("/api/auth/logout").set("Cookie", user.cookie).expect(200);
    await request(api).post("/api/auth/refresh").set("Cookie", user.cookie).expect(401);
  });
});

describe("protected routes", () => {
  it("rejects a request with no token", async () => {
    await request(api).get("/api/auth/me").expect(401);
  });

  it("rejects a malformed token", async () => {
    await request(api)
      .get("/api/auth/me")
      .set("Authorization", "Bearer not-a-real-token")
      .expect(401);
  });

  it("accepts a valid token", async () => {
    const user = await createUser("protected");

    const response = await request(api)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${user.token}`)
      .expect(200);

    expect(response.body.data.user.email).toBe(user.email);
  });
});

describe("PATCH /api/auth/me", () => {
  it("completes onboarding when major, year and courses arrive together", async () => {
    const user = await createUser("onboard");
    await prisma.department.create({ data: { code: "CS", name: "Computer Science" } });
    await prisma.course.create({
      data: { code: "CS 3358", title: "Data Structures", department: { connect: { code: "CS" } } },
    });

    const response = await request(api)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ major: "Computer Science", gradYear: new Date().getFullYear() + 2, courseCodes: ["CS 3358"] })
      .expect(200);

    expect(response.body.data.user.onboardingCompleted).toBe(true);
    expect(response.body.data.user.courses).toHaveLength(1);
  });

  it("updates a single field without touching onboarding state", async () => {
    const user = await createUser("partial");

    const response = await request(api)
      .patch("/api/auth/me")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ studyProfileVisible: false })
      .expect(200);

    expect(response.body.data.user.studyProfileVisible).toBe(false);
    expect(response.body.data.user.onboardingCompleted).toBe(false);
  });
});
