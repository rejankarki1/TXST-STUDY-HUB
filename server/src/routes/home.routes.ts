import { Router } from "express";

import { getHomeDashboard } from "../controllers/home.controller.js";

const router = Router();

router.get("/", getHomeDashboard);

export default router;
