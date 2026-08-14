import { Router } from "express";

import { getResourceById } from "../controllers/resources.controller.js";

const router = Router();

router.get("/:resourceId", getResourceById);

export default router;
