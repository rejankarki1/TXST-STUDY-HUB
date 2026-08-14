import { Router } from "express";

import {
  login,
  logout,
  refresh,
  signup,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { loginSchema, signupSchema } from "../schemas/auth.schema.js";

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
router.get("/me", requireAuth, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user,
    },
  });
});
export default router;
