import express from "express";
import { saveSettings, getSettings } from "../controllers/settingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, saveSettings);
router.get("/", authMiddleware, getSettings);

export default router;