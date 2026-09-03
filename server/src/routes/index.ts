import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import circlesRoutes from "../modules/circles/circles.routes.js";
import coursesRoutes from "../modules/courses/courses.routes.js";
import questionsRoutes from "../modules/questions/questions.routes.js";
import sessionsRoutes from "../modules/sessions/sessions.routes.js";
import studyRequestsRoutes from "../modules/study-requests/study-requests.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/courses", coursesRoutes);
router.use("/study-requests", studyRequestsRoutes);
router.use("/circles", circlesRoutes);
router.use("/sessions", sessionsRoutes);
router.use("/questions", questionsRoutes);

export default router;
