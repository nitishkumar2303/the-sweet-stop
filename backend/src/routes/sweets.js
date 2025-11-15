// backend/src/routes/sweets.js
import express from "express";
import { createSweet, listSweets  , searchSweets ,updateSweet ,deleteSweet ,purchaseSweet ,restockSweet} from "../controllers/sweets.controller.js";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";

const router = express.Router();

// Admin-only: create sweets
router.post("/", auth, admin, createSweet);
router.get("/" , auth , listSweets);
router.get("/search" , auth , searchSweets);
router.put("/:id", auth , admin , updateSweet);
router.delete("/:id", auth, admin, deleteSweet);
router.post("/:id/purchase", auth, purchaseSweet);
router.post("/:id/restock", auth, admin, restockSweet);



export default router;