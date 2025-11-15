// backend/src/routes/sweets.js
import express from "express";
import { createSweet, listSweets  , searchSweets ,updateSweet} from "../controllers/sweets.controller.js";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";

const router = express.Router();

// Admin-only: create sweets
router.post("/", auth, admin, createSweet);
router.get("/" , auth , listSweets);
router.get("/search" , auth , searchSweets);
router.put("/:id", auth , admin , updateSweet);


export default router;