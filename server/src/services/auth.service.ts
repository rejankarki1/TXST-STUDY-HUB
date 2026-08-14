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

type AuthSuccess = {
  ok: true;
  user: SafeUser;
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

  return {
    ok: true,
    user: toSafeUser(user),
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

  return {
    ok: true,
    user: toSafeUser(user),
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

  const user = toSafeUser(storedToken.user);
  const accessToken = createAccessToken(user);

  return {
    ok: true,
    user,
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
