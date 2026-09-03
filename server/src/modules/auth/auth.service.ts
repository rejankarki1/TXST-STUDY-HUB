import bcrypt from "bcryptjs";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type { UserRole } from "../../generated/prisma/enums.js";
import {
  createRefreshToken,
  hashRefreshToken,
  refreshTokenGraceMs,
  refreshTokenMaxAgeMs,
  signAccessToken,
} from "../../utils/authTokens.js";
import type { LoginInput, SignupInput, UpdateMeInput } from "./auth.schema.js";

const passwordSaltRounds = 12;
const demoEmail = "demo.student@txstate.edu";

type SafeUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

type CurrentUser = SafeUser & {
  major: string | null;
  gradYear: number | null;
  onboardingCompleted: boolean;
  studyProfileVisible: boolean;
  courses: {
    id: string;
    code: string;
    title: string;
    department: { id: string; code: string; name: string } | null;
  }[];
};

type AuthSession = {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
};

const currentUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  major: true,
  gradYear: true,
  onboardingCompleted: true,
  studyProfileVisible: true,
  selectedCourses: {
    orderBy: { createdAt: "asc" as const },
    select: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          department: { select: { id: true, code: true, name: true } },
        },
      },
    },
  },
};

type SelectedCurrentUser = NonNullable<
  Awaited<ReturnType<typeof prisma.user.findFirst<{ select: typeof currentUserSelect }>>>
>;

function toCurrentUser(user: SelectedCurrentUser): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    major: user.major,
    gradYear: user.gradYear,
    onboardingCompleted: user.onboardingCompleted,
    studyProfileVisible: user.studyProfileVisible,
    courses: user.selectedCourses.map(({ course }) => course),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: currentUserSelect,
  });

  return user ? toCurrentUser(user) : null;
}

async function loadCurrentUserOrThrow(userId: string) {
  const user = await getCurrentUser(userId);

  if (!user) {
    throw new AppError("Authentication required", 401);
  }

  return user;
}

/**
 * PATCH /auth/me. Every field is optional so the Profile screen can flip one
 * toggle, but supplying major + gradYear + courseCodes together is what marks
 * onboarding complete — that combination is exactly the onboarding form.
 */
export async function updateCurrentUser(userId: string, input: UpdateMeInput) {
  const completesOnboarding =
    input.major !== undefined && input.gradYear !== undefined && input.courseCodes !== undefined;

  let courseIds: string[] | undefined;

  if (input.courseCodes) {
    const codes = [...new Set(input.courseCodes)];

    if (codes.length !== input.courseCodes.length) {
      throw new AppError("Duplicate courses are not allowed", 400);
    }

    const courses = await prisma.course.findMany({
      where: { code: { in: codes } },
      select: { id: true, code: true },
    });

    if (courses.length !== codes.length) {
      const found = new Set(courses.map((course) => course.code));
      const missing = codes.filter((code) => !found.has(code));
      throw new AppError(`Course not found: ${missing.join(", ")}`, 400);
    }

    courseIds = courses.map((course) => course.id);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        major: input.major,
        gradYear: input.gradYear,
        studyProfileVisible: input.studyProfileVisible,
        ...(completesOnboarding ? { onboardingCompleted: true } : {}),
      },
    });

    if (courseIds) {
      await tx.userCourse.deleteMany({ where: { userId } });
      await tx.userCourse.createMany({
        data: courseIds.map((courseId) => ({ userId, courseId })),
      });
    }
  });

  return loadCurrentUserOrThrow(userId);
}

async function createStoredRefreshToken(userId: string) {
  const refreshToken = createRefreshToken();

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId,
      expiresAt: new Date(Date.now() + refreshTokenMaxAgeMs),
    },
  });

  return refreshToken;
}

function createAccessToken(user: SafeUser) {
  return signAccessToken({ userId: user.id, email: user.email, role: user.role });
}

async function issueSession(user: SafeUser): Promise<AuthSession> {
  const refreshToken = await createStoredRefreshToken(user.id);

  return {
    user: await loadCurrentUserOrThrow(user.id),
    accessToken: createAccessToken(user),
    refreshToken,
  };
}

export async function signupUser(input: SignupInput): Promise<AuthSession> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);
  const user = await prisma.user.create({
    data: { email: input.email, name: input.name, passwordHash },
  });

  return issueSession(user);
}

export async function loginUser(input: LoginInput): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  /* Both branches return the same message and both do a bcrypt comparison, so
     neither the wording nor the response time reveals whether the account
     exists. */
  if (!user) {
    await bcrypt.compare(input.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv");
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  return issueSession(user);
}

/** Public demo access intentionally bypasses a password for this one seeded,
 * non-privileged account. This keeps the demo button independent of client-side
 * environment variables while preserving the normal session/cookie flow. */
export async function loginDemoUser(): Promise<AuthSession> {
  const user = await prisma.user.findUnique({ where: { email: demoEmail } });

  if (!user) {
    throw new AppError("Demo account is unavailable", 503);
  }

  return issueSession(user);
}

/**
 * Refresh-token rotation with a grace window.
 *
 * Rotation deletes nothing: the presented token is stamped rotatedAt and a new
 * one is issued. A second request arriving with the same token inside the grace
 * window (two tabs, or React StrictMode double-mounting) is honoured, because it
 * is a race rather than theft. The same token presented *after* the window is
 * treated as a stolen credential and every session for that user is revoked.
 */
export async function refreshAuthSession(refreshToken: string): Promise<AuthSession> {
  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
    },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.expiresAt <= new Date()) {
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });
    throw new AppError("Refresh token expired", 401);
  }

  if (storedToken.rotatedAt) {
    const age = Date.now() - storedToken.rotatedAt.getTime();

    if (age > refreshTokenGraceMs) {
      await prisma.refreshToken.deleteMany({ where: { userId: storedToken.userId } });
      throw new AppError("Refresh token was already used", 401);
    }
  } else {
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { rotatedAt: new Date() },
    });
  }

  return issueSession(storedToken.user);
}

export async function logoutUser(refreshToken: string | undefined) {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.deleteMany({
    where: { tokenHash: hashRefreshToken(refreshToken) },
  });
}
