import bcrypt from "bcryptjs";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../middleware/error.js";
import type { UserRole } from "../../generated/prisma/enums.js";
import {
  createRefreshToken,
  hashRefreshToken,
  refreshTokenMaxAgeMs,
  signAccessToken,
} from "../../utils/authTokens.js";
import type { UpdateMeInput } from "./auth.schema.js";

const passwordSaltRounds = 12;

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
  courses: {
    id: string;
    code: string;
    title: string;
    department: {
      id: string;
      code: string;
      name: string;
    } | null;
  }[];
};

type AuthSession = {
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
};

function toSafeUser(user: SafeUser): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

const currentUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  major: true,
  gradYear: true,
  onboardingCompleted: true,
  selectedCourses: {
    orderBy: {
      createdAt: "asc" as const,
    },
    select: {
      course: {
        select: {
          id: true,
          code: true,
          title: true,
          department: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      },
    },
  },
};

function toCurrentUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  major: string | null;
  gradYear: number | null;
  onboardingCompleted: boolean;
  selectedCourses: {
    course: {
      id: string;
      code: string;
      title: string;
      department: {
        id: string;
        code: string;
        name: string;
      } | null;
    };
  }[];
}): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    major: user.major,
    gradYear: user.gradYear,
    onboardingCompleted: user.onboardingCompleted,
    courses: user.selectedCourses.map(({ course }) => course),
  };
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: currentUserSelect,
  });

  return user ? toCurrentUser(user) : null;
}

export async function updateCurrentUser(userId: string, input: UpdateMeInput) {
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

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        major: input.major,
        gradYear: input.gradYear,
        onboardingCompleted: true,
      },
    }),
    prisma.userCourse.deleteMany({ where: { userId } }),
    prisma.userCourse.createMany({
      data: courses.map((course) => ({ userId, courseId: course.id })),
    }),
  ]);

  return getCurrentUser(userId);
}

async function createStoredRefreshToken(userId: string) {
  const refreshToken = createRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + refreshTokenMaxAgeMs);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  return refreshToken;
}

function createAccessToken(user: SafeUser) {
  return signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
}

export async function signupUser(input: {
  email: string;
  name?: string;
  password: string;
}): Promise<AuthSession> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError("Email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, passwordSaltRounds);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      passwordHash,
    },
  });

  const refreshToken = await createStoredRefreshToken(user.id);
  const accessToken = createAccessToken(user);
  const currentUser = await getCurrentUser(user.id);

  if (!currentUser) {
    throw new Error("Created user could not be loaded");
  }

  return { user: currentUser, accessToken, refreshToken };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  const refreshToken = await createStoredRefreshToken(user.id);
  const accessToken = createAccessToken(user);
  const currentUser = await getCurrentUser(user.id);

  if (!currentUser) {
    throw new Error("Authenticated user could not be loaded");
  }

  return { user: currentUser, accessToken, refreshToken };
}

export async function refreshAuthSession(
  refreshToken: string,
): Promise<AuthSession> {
  const tokenHash = hashRefreshToken(refreshToken);
  const storedToken = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      },
    },
  });

  if (!storedToken) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (storedToken.expiresAt <= new Date()) {
    await prisma.refreshToken.deleteMany({
      where: { id: storedToken.id },
    });

    throw new AppError("Refresh token expired", 401);
  }

  const newRefreshToken = createRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + refreshTokenMaxAgeMs);

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({
      where: { id: storedToken.id },
    }),
    prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: storedToken.userId,
        expiresAt: newExpiresAt,
      },
    }),
  ]);

  const safeUser = toSafeUser(storedToken.user);
  const accessToken = createAccessToken(safeUser);
  const currentUser = await getCurrentUser(storedToken.userId);

  if (!currentUser) {
    throw new AppError("Authentication required", 401);
  }

  return { user: currentUser, accessToken, refreshToken: newRefreshToken };
}

export async function logoutUser(refreshToken: string | undefined) {
  if (!refreshToken) {
    return;
  }

  await prisma.refreshToken.deleteMany({
    where: {
      tokenHash: hashRefreshToken(refreshToken),
    },
  });
}
