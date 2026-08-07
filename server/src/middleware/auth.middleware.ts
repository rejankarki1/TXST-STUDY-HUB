import type { RequestHandler } from "express";

import { prisma } from "../config/prisma.js";
import { verifyAccessToken } from "../utils/authTokens.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const token = authHeader.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    req.user = user;
    next();
  } catch (_error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

