// backend/src/controllers/sweets.controller.js
import Sweet from "../models/Sweet.js";
import Category from "../models/Category.js";

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const ALLOWED_UNITS = ["piece", "kg", "g", "ltr", "ml"];

export async function createSweet(req, res) {
  try {
    const { name, category, price, quantity, unit } = req.body;

    // Validate input
    if (!name || !category || price === undefined || quantity === undefined) {
      return res
        .status(400)
        .json({ error: "name, category, price and quantity are required" });
    }

    if (unit !== undefined && !ALLOWED_UNITS.includes(unit)) {
      return res.status(400).json({ error: "invalid unit" });
    }

    // Check duplicate name
    const existing = await Sweet.findOne({ name: name.trim() });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Sweet with this name already exists" });
    }

    // Ensure category exists in categories collection (create if missing)
    try {
      const catName = String(category).trim();
      const existingCat = await Category.findOne({
        name: { $regex: `^${escapeRegex(catName)}$`, $options: "i" },
      });
      if (!existingCat) {
        await Category.create({ name: catName });
      }
    } catch (err) {
      // Non-fatal - continue but log
      console.error("createSweet: failed to ensure category exists", err);
    }

    // Create sweet
    const sweet = await Sweet.create({
      name: name.trim(),
      category: category.trim(),
      price,
      quantity,
      unit: unit ?? undefined,
    });

    return res.status(201).json({
      id: sweet._id,
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
      unit: sweet.unit,
    });
  } catch (err) {
    console.error("createSweet error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

//admin only
export async function listSweets(req, res) {
  try {
    const docs = await Sweet.find({}).lean();

    //this maps sweets one by one in array
    const items = docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      category: d.category,
      price: d.price,
      quantity: d.quantity,
      unit: d.unit ?? "piece",
    }));

    return res.status(200).json({ items });
  } catch (error) {
    console.error("error Listing sweets", error);
    return res.status(500).json({ error: "server error" });
  }
}

export async function searchSweets(req, res) {
  try {
    const { name, category, min, max } = req.query;

    const query = {};

    // name: case-insensitive substring match
    if (name && String(name).trim().length > 0) {
      query.name = { $regex: String(name).trim(), $options: "i" };
    }

    // category: case-insensitive exact-ish (use regex to be forgiving)
    if (category && String(category).trim().length > 0) {
      query.category = {
        $regex: `^${String(category).trim()}$`,
        $options: "i",
      };
    }

    // price range
    const priceFilter = {};
    if (min !== undefined) {
      const minNum = Number(min);
      if (!Number.isNaN(minNum)) priceFilter.$gte = minNum;
    }
    if (max !== undefined) {
      const maxNum = Number(max);
      if (!Number.isNaN(maxNum)) priceFilter.$lte = maxNum;
    }
    if (Object.keys(priceFilter).length) {
      query.price = priceFilter;
    }

    const docs = await Sweet.find(query).lean();

    const items = docs.map((d) => ({
      id: String(d._id),
      name: d.name,
      category: d.category,
      price: d.price,
      quantity: d.quantity,
      unit: d.unit ?? "piece",
    }));

    return res.status(200).json({ items });
  } catch (err) {
    console.error("searchSweets error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

export async function updateSweet(req, res) {
  try {
    const { id } = req.params;
    const { name, category, price, quantity, unit } = req.body;

    // Build update object dynamically
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (category !== undefined) updates.category = String(category).trim();
    if (price !== undefined) updates.price = price;
    if (quantity !== undefined) updates.quantity = quantity;
    if (unit !== undefined) updates.unit = unit;

    // No fields provided
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update" });
    }

    // Find sweet first (we need its unit for validation if unit not changed)
    const existingSweet = await Sweet.findById(id);
    if (!existingSweet) {
      return res.status(404).json({ error: "Sweet not found" });
    }

    // validate unit if provided
    if (unit !== undefined && !ALLOWED_UNITS.includes(unit)) {
      return res.status(400).json({ error: "invalid unit" });
    }

    // Simple validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({ error: "price must be non-negative" });
    }

    // determine final unit to validate quantity correctly
    const finalUnit = updates.unit ?? existingSweet.unit ?? "piece";

    if (quantity !== undefined) {
      const qnum = Number(quantity);
      if (Number.isNaN(qnum) || qnum < 0) {
        return res.status(400).json({ error: "quantity must be non-negative" });
      }
      if (finalUnit === "piece" && !Number.isInteger(qnum)) {
        return res.status(400).json({
          error: "quantity must be a non-negative integer for pieces",
        });
      }
    }

    // Check duplicate name
    if (updates.name && updates.name !== existingSweet.name) {
      const duplicate = await Sweet.findOne({
        name: updates.name,
        _id: { $ne: id },
      });
      if (duplicate) {
        return res
          .status(409)
          .json({ error: "Sweet with this name already exists" });
      }
    }

    // If category is being updated, ensure it exists in categories collection
    if (updates.category) {
      try {
        const catName = String(updates.category).trim();
        const existingCat = await Category.findOne({
          name: { $regex: `^${escapeRegex(catName)}$`, $options: "i" },
        });
        if (!existingCat) {
          await Category.create({ name: catName });
        }
      } catch (err) {
        console.error("updateSweet: failed to ensure category exists", err);
      }
    }

    // Perform update
    try {
      const updated = await Sweet.findByIdAndUpdate(id, updates, { new: true });
      return res.status(200).json({
        id: updated._id.toString(),
        name: updated.name,
        category: updated.category,
        price: updated.price,
        quantity: updated.quantity,
        unit: updated.unit,
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res
          .status(409)
          .json({ error: "Sweet with this name already exists" });
      }
      return res.status(500).json({ error: "server error" });
    }
  } catch (err) {
    console.error("updateSweet error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

//admin only
export async function deleteSweet(req, res) {
  try {
    const { id } = req.params;

    // find the sweet
    const sweet = await Sweet.findById(id);
    if (!sweet) {
      return res.status(404).json({ error: "Sweet not found" });
    }

    // remember category name before deletion
    const catName = sweet.category;

    // remove the sweet
    await Sweet.findByIdAndDelete(id);

    // if no other sweets use this category, remove category as well
    try {
      const other = await Sweet.findOne({
        category: { $regex: `^${escapeRegex(catName)}$`, $options: "i" },
      });
      if (!other) {
        await Category.deleteOne({
          name: { $regex: `^${escapeRegex(catName)}$`, $options: "i" },
        });
      }
    } catch (err) {
      // non-fatal; log and continue
      console.error("deleteSweet: failed to cleanup category", err);
    }

    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error("deleteSweet error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

export async function purchaseSweet(req, res) {
  try {
    const { id } = req.params;
    // parse quantity, default to 1
    const requested =
      req.body?.quantity === undefined ? 1 : Number(req.body.quantity);

    // check sweet exists (we need its unit to validate requested)
    const sweet = await Sweet.findById(id).lean();
    if (!sweet) {
      return res.status(404).json({ error: "Sweet not found" });
    }

    // validate quantity based on unit
    if (sweet.unit === "piece") {
      if (!Number.isInteger(requested) || requested <= 0) {
        return res
          .status(400)
          .json({ error: "quantity must be a positive integer" });
      }
    } else {
      if (Number.isNaN(requested) || requested <= 0) {
        return res
          .status(400)
          .json({ error: "quantity must be a positive number" });
      }
    }

    // Try to atomically decrement if enough stock
    const updated = await Sweet.findOneAndUpdate(
      { _id: id, quantity: { $gte: requested } }, // ensure enough stock
      { $inc: { quantity: -requested } }, // decrement
      { new: true } // return updated doc
    ).lean();

    // if updated is null => not enough stock
    if (!updated) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    return res.status(200).json({
      id: String(updated._id),
      name: updated.name,
      quantity: updated.quantity,
      unit: updated.unit ?? sweet.unit,
    });
  } catch (err) {
    console.error("purchaseSweet error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

//admin only
export async function restockSweet(req, res) {
  try {
    const { id } = req.params;
    const qty = req.body?.quantity;

    // validate presence and type
    if (qty === undefined) {
      return res.status(400).json({ error: "quantity is required" });
    }
    const add = Number(qty);

    // ensure sweet exists to validate unit
    const sweet = await Sweet.findById(id).lean();
    if (!sweet) {
      return res.status(404).json({ error: "Sweet not found" });
    }

    if (sweet.unit === "piece") {
      if (!Number.isInteger(add) || add <= 0) {
        return res
          .status(400)
          .json({ error: "quantity must be a positive integer" });
      }
    } else {
      if (Number.isNaN(add) || add <= 0) {
        return res
          .status(400)
          .json({ error: "quantity must be a positive number" });
      }
    }

    // atomically increment quantity
    const updated = await Sweet.findOneAndUpdate(
      { _id: id },
      { $inc: { quantity: add } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Sweet not found" });
    }

    return res.status(200).json({
      id: String(updated._id),
      name: updated.name,
      quantity: updated.quantity,
    });
  } catch (err) {
    console.error("restockSweet error:", err);
    return res.status(500).json({ error: "server error" });
  }
}
