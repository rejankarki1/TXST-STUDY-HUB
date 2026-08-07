import bcrypt from "bcryptjs";
import type { CookieOptions, RequestHandler, Response } from "express";
import crypto from "node:crypto";

import { prisma } from "../config/prisma.js";
import { loginSchema, signupSchema } from "../schemas/auth.schema.js";
import { signAccessToken } from "../utils/authTokens.js";

const passwordSaltRounds = 12;
const refreshTokenCookieName =
  process.env.REFRESH_TOKEN_COOKIE_NAME ?? "refreshToken";
const refreshTokenMaxAgeMs = 1000 * 60 * 60 * 24 * 7;
const refreshTokenCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: refreshTokenMaxAgeMs,
};

function createRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function hashRefreshToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setRefreshTokenCookie(res: Response, refreshToken: string) {
  res.cookie(refreshTokenCookieName, refreshToken, refreshTokenCookieOptions);
}

function clearRefreshTokenCookie(res: Response) {
  res.clearCookie(refreshTokenCookieName, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth",
  });
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

function toSafeUser(user: {
  id: string;
  email: string;
  name: string | null;
  role: "STUDENT" | "MODERATOR" | "ADMIN";
}) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export const signup: RequestHandler = async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid signup data",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, name, password } = parsed.data;
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, passwordSaltRounds);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    });

    const refreshToken = await createStoredRefreshToken(user.id);
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    setRefreshTokenCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: "User created",
      data: {
        user: toSafeUser(user),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: "Invalid login data",
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatches) {
      res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
      return;
    }

    const refreshToken = await createStoredRefreshToken(user.id);
    const accessToken = signAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    setRefreshTokenCookie(res, refreshToken);

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: toSafeUser(user),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[refreshTokenCookieName] as
      | string
      | undefined;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
      return;
    }

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
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
      return;
    }

    if (storedToken.expiresAt <= new Date()) {
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      clearRefreshTokenCookie(res);
      res.status(401).json({
        success: false,
        message: "Refresh token expired",
      });
      return;
    }

    const newRefreshToken = createRefreshToken();
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + refreshTokenMaxAgeMs);

    await prisma.$transaction([
      prisma.refreshToken.delete({
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

    const accessToken = signAccessToken({
      userId: storedToken.user.id,
      email: storedToken.user.email,
      role: storedToken.user.role,
    });

    setRefreshTokenCookie(res, newRefreshToken);

    res.json({
      success: true,
      message: "Access token refreshed",
      data: {
        user: toSafeUser(storedToken.user),
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.[refreshTokenCookieName] as
      | string
      | undefined;

    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          tokenHash: hashRefreshToken(refreshToken),
        },
      });
    }

    clearRefreshTokenCookie(res);

    res.json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    next(error);
  }
};
