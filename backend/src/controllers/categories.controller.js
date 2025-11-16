import Category from "../models/Category.js";
import Sweet from "../models/Sweet.js";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listCategories(req, res) {
  try {
    // Cleanup orphan categories (those not referenced by any sweet)
    try {
      const sweetCats = await Sweet.distinct("category");
      const normalized = new Set(
        sweetCats.filter(Boolean).map((c) => String(c).trim().toLowerCase())
      );

      const allCats = await Category.find({}).lean();
      const orphanIds = allCats
        .filter((c) => !normalized.has(String(c.name).trim().toLowerCase()))
        .map((c) => c._id);

      if (orphanIds.length) {
        await Category.deleteMany({ _id: { $in: orphanIds } });
      }
    } catch (cleanupErr) {
      // non-fatal: log and continue to return current categories
      console.error("listCategories: cleanup failed", cleanupErr);
    }

    const docs = await Category.find({}).sort({ name: 1 }).lean();
    const items = docs.map((d) => ({ id: String(d._id), name: d.name }));
    return res.status(200).json({ items });
  } catch (err) {
    console.error("listCategories error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

// create a category (admin only)
export async function createCategory(req, res) {
  try {
    const { name } = req.body;
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }

    const n = String(name).trim();
    const existing = await Category.findOne({ name: n });
    if (existing) {
      return res.status(409).json({ error: "Category already exists" });
    }

    const created = await Category.create({ name: n });
    return res
      .status(201)
      .json({ id: String(created._id), name: created.name });
  } catch (err) {
    console.error("createCategory error:", err);
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Category already exists" });
    }
    return res.status(500).json({ error: "server error" });
  }
}

// update category name (admin only)
export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: "name is required" });
    }

    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ error: "Category not found" });

    const newName = String(name).trim();
    // check duplicate (case-insensitive)
    const dup = await Category.findOne({
      name: { $regex: `^${escapeRegex(newName)}$`, $options: "i" },
      _id: { $ne: id },
    });
    if (dup) return res.status(409).json({ error: "Category already exists" });

    const oldName = cat.name;
    cat.name = newName;
    await cat.save();

    // update sweets that referenced oldName (case-insensitive) to newName
    try {
      await Sweet.updateMany(
        { category: { $regex: `^${escapeRegex(oldName)}$`, $options: "i" } },
        { $set: { category: newName } }
      );
    } catch (updErr) {
      console.error("updateCategory: failed to update sweets", updErr);
    }

    return res.status(200).json({ id: String(cat._id), name: cat.name });
  } catch (err) {
    console.error("updateCategory error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

// delete a category (admin only) - only allowed if no sweets reference it
export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;
    const cat = await Category.findById(id);
    if (!cat) return res.status(404).json({ error: "Category not found" });

    const catName = cat.name;
    const other = await Sweet.findOne({
      category: { $regex: `^${escapeRegex(catName)}$`, $options: "i" },
    });
    if (other) {
      return res
        .status(400)
        .json({ error: "Cannot delete category in use by sweets" });
    }

    await Category.deleteOne({ _id: id });
    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error("deleteCategory error:", err);
    return res.status(500).json({ error: "server error" });
  }
}
