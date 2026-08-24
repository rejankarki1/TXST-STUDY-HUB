import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes.js";
import coursesRoutes from "../modules/courses/courses.routes.js";
import groupsRoutes from "../modules/groups/groups.routes.js";
import sessionsRoutes from "../modules/sessions/sessions.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/courses", coursesRoutes);
router.use("/groups", groupsRoutes);
router.use("/sessions", sessionsRoutes);

export default router;
