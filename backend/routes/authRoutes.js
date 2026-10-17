import express from "express";
import { login, register, forgotPassword, resetPassword, updateProfile, updatePassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});
router.put("/profile", protect, updateProfile);
router.put("/profile/password", protect, updatePassword);
export default router;
