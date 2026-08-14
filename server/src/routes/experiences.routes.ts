import { Router } from "express";

import { getExperienceById } from "../controllers/experiences.controller.js";

const router = Router();

router.get("/:experienceId", getExperienceById);

export default router;
