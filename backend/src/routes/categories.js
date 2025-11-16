import express from "express";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/categories.controller.js";
import auth from "../middleware/auth.middleware.js";
import admin from "../middleware/admin.middleware.js";

const router = express.Router();

// Allow public listing of categories so UI can populate filters without login
router.get("/", listCategories);
// Creation remains protected to admins
router.post("/", auth, admin, createCategory);
// admin can update or delete categories
router.put("/:id", auth, admin, updateCategory);
router.delete("/:id", auth, admin, deleteCategory);

export default router;
