// backend/src/routes/sweets.js
import express from "express";
import { createSweet, listSweets } from "../controllers/sweets.controller.js";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";

const router = express.Router();

// Admin-only: create sweets
router.post("/", auth, admin, createSweet);
router.get("/" , auth , listSweets);

export default router;