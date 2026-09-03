import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { isOriginAllowed } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { AppError, errorHandler } from "./middleware/error.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { apiRateLimit } from "./middleware/rateLimit.js";
import apiRoutes from "./routes/index.js";

const app = express();

/* Render and Vercel both sit behind a proxy; without this the rate limiter sees
   every request as coming from the load balancer and `secure` cookies break. */
app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      /* No Origin header means a same-origin or non-browser caller (curl, the
         test suite, a health check) — those are never the cross-site risk CORS
         exists to contain. */
      if (!origin || isOriginAllowed(origin)) {
        callback(null, true);
        return;
      }

      /* A plain Error here reaches the error handler as an unrecognised bug and
         is reported as a 500, which reads like the API is broken rather than
         like the caller is not on the allowlist. */
      callback(new AppError(`Origin ${origin} is not allowed`, 403));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
/* A study request or answer is a few kilobytes; anything near this ceiling is
   abuse, and parsing it is work an unauthenticated caller should not get. */
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "TXST Study Hub API is running",
    data: { status: "ok", uptime: process.uptime() },
  });
});

app.get("/api/db-health", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Database connection is working",
      data: { status: "ok" },
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api", apiRateLimit, apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
