import { Router } from "express";

import {
  login,
  logout,
  refresh,
  signup,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
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
