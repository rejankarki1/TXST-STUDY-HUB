import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";

import { prisma } from "./config/prisma.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";
import authRoutes from "./routes/auth.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import departmentsRoutes from "./routes/departments.routes.js";
import experiencesRoutes from "./routes/experiences.routes.js";
import homeRoutes from "./routes/home.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import resourcesRoutes from "./routes/resources.routes.js";
import studyGroupsRoutes from "./routes/study-groups.routes.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "TXST Study Hub API is running",
  });
});

app.get("/api/db-health", async (_req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "Database connection is working",
    });
  } catch (error) {
    next(error);
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/experiences", experiencesRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/resources", resourcesRoutes);
app.use("/api/study-groups", studyGroupsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
