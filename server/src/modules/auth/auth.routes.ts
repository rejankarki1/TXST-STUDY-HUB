import { Router } from "express";

import * as auth from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.js";
import { authRateLimit } from "../../middleware/rateLimit.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, signupSchema, updateMeSchema } from "./auth.schema.js";

const router = Router();

router.post("/signup", authRateLimit, validate(signupSchema, "Invalid signup data"), auth.signup);
router.post("/login", authRateLimit, validate(loginSchema, "Invalid login data"), auth.login);
router.post("/demo", authRateLimit, auth.demo);
router.post("/refresh", authRateLimit, auth.refresh);
router.post("/logout", auth.logout);
router.get("/me", requireAuth, auth.me);
router.patch("/me", requireAuth, validate(updateMeSchema, "Invalid profile data"), auth.updateMe);

export default router;
