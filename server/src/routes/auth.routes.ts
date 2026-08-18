import { Router } from "express";

import {
  completeOnboarding,
  login,
  logout,
  me,
  refresh,
  signup,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  completeOnboardingSchema,
  loginSchema,
  signupSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post(
  "/signup",
  validateBody(signupSchema, "Invalid signup data"),
  signup,
);
router.post(
  "/login",
  validateBody(loginSchema, "Invalid login data"),
  login,
);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.post(
  "/onboarding",
  requireAuth,
  validateBody(completeOnboardingSchema, "Invalid onboarding data"),
  completeOnboarding,
);
router.get("/me", requireAuth, me);
export default router;
