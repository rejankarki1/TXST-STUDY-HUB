import bcrypt from "bcryptjs";

import { prisma } from "../config/prisma.js";
import type { UserRole } from "../generated/prisma/enums.js";
import {
  createRefreshToken,
  hashRefreshToken,
  refreshTokenMaxAgeMs,
  signAccessToken,
} from "../utils/authTokens.js";

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

type AuthSuccess = {
  ok: true;
  user: CurrentUser;
  accessToken: string;
  refreshToken: string;
};

type AuthFailure = {
  ok: false;
  status: 401 | 409;
  message: string;
  clearCookie?: boolean;
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
}): Promise<AuthSuccess | AuthFailure> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    return {
      ok: false,
      status: 409,
      message: "Email is already registered",
    };
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

  return {
    ok: true,
    user: currentUser,
    accessToken,
    refreshToken,
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<AuthSuccess | AuthFailure> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    return {
      ok: false,
      status: 401,
      message: "Invalid email or password",
    };
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    return {
      ok: false,
      status: 401,
      message: "Invalid email or password",
    };
  }

  const refreshToken = await createStoredRefreshToken(user.id);
  const accessToken = createAccessToken(user);
  const currentUser = await getCurrentUser(user.id);

  if (!currentUser) {
    throw new Error("Authenticated user could not be loaded");
  }

  return {
    ok: true,
    user: currentUser,
    accessToken,
    refreshToken,
  };
}

export async function refreshAuthSession(
  refreshToken: string,
): Promise<AuthSuccess | AuthFailure> {
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
    return {
      ok: false,
      status: 401,
      message: "Invalid refresh token",
      clearCookie: true,
    };
  }

  if (storedToken.expiresAt <= new Date()) {
    await prisma.refreshToken.deleteMany({
      where: { id: storedToken.id },
    });

    return {
      ok: false,
      status: 401,
      message: "Refresh token expired",
      clearCookie: true,
    };
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
    return {
      ok: false,
      status: 401,
      message: "Authentication required",
      clearCookie: true,
    };
  }

  return {
    ok: true,
    user: currentUser,
    accessToken,
    refreshToken: newRefreshToken,
  };
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

export async function completeOnboarding(
  userId: string,
  input: {
    name?: string;
    major: string;
    gradYear: number;
    courseCodes: string[];
  },
) {
  const uniqueCourseCodes = [...new Set(input.courseCodes)];

  if (uniqueCourseCodes.length !== input.courseCodes.length) {
    return {
      ok: false as const,
      status: 400,
      message: "Duplicate courses are not allowed",
    };
  }

  const courses = await prisma.course.findMany({
    where: {
      code: {
        in: uniqueCourseCodes,
      },
    },
    select: {
      id: true,
      code: true,
    },
  });

  if (courses.length !== uniqueCourseCodes.length) {
    const foundCodes = new Set(courses.map((course) => course.code));
    const missingCodes = uniqueCourseCodes.filter((code) => !foundCodes.has(code));

    return {
      ok: false as const,
      status: 400,
      message: `Course not found: ${missingCodes.join(", ")}`,
    };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: input.name,
        major: input.major,
        gradYear: input.gradYear,
        onboardingCompleted: true,
      },
    }),
    prisma.userCourse.deleteMany({
      where: {
        userId,
      },
    }),
    prisma.userCourse.createMany({
      data: courses.map((course) => ({
        userId,
        courseId: course.id,
      })),
    }),
  ]);

  const user = await getCurrentUser(userId);

  if (!user) {
    return {
      ok: false as const,
      status: 404,
      message: "User not found",
    };
  }

  return {
    ok: true as const,
    user,
  };
}
