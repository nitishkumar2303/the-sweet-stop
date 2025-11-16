// backend/src/controllers/sweets.controller.js
import Sweet from "../models/Sweet.js";

export async function createSweet(req, res) {
  try {
    const { name, category, price, quantity } = req.body;

    // Validate input
    if (!name || !category || price === undefined || quantity === undefined) {
      return res
        .status(400)
        .json({ error: "name, category, price and quantity are required" });
    }

    // Check duplicate name
    const existing = await Sweet.findOne({ name: name.trim() });
    if (existing) {
      return res
        .status(409)
        .json({ error: "Sweet with this name already exists" });
    }

    // Create sweet
    const sweet = await Sweet.create({
      name: name.trim(),
      category: category.trim(),
      price,
      quantity,
    });

    return res.status(201).json({
      id: sweet._id,
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity,
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
    const { name, category, price, quantity } = req.body;

    // Build update object dynamically
    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (category !== undefined) updates.category = String(category).trim();
    if (price !== undefined) updates.price = price;
    if (quantity !== undefined) updates.quantity = quantity;

    // No fields provided
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ error: "At least one field is required to update" });
    }

    // Simple validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({ error: "price must be non-negative" });
    }
    if (
      quantity !== undefined &&
      (quantity < 0 || !Number.isInteger(quantity))
    ) {
      return res
        .status(400)
        .json({ error: "quantity must be a non-negative integer" });
    }

    // Find sweet
    const existingSweet = await Sweet.findById(id);
    if (!existingSweet) {
      return res.status(404).json({ error: "Sweet not found" });
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

    // Perform update
    try {
      const updated = await Sweet.findByIdAndUpdate(id, updates, { new: true });
      return res.status(200).json({
        id: updated._id.toString(),
        name: updated.name,
        category: updated.category,
        price: updated.price,
        quantity: updated.quantity,
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

    // remove it
    await Sweet.findByIdAndDelete(id);

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
    const requested = req.body?.quantity === undefined ? 1 : Number(req.body.quantity);

    // validate quantity
    if (!Number.isInteger(requested) || requested <= 0) {
      return res.status(400).json({ error: "quantity must be a positive integer" });
    }

    // check sweet exists
    const sweet = await Sweet.findById(id).lean();
    if (!sweet) {
      return res.status(404).json({ error: "Sweet not found" });
    }

    // Try to atomically decrement if enough stock
    const updated = await Sweet.findOneAndUpdate(
      { _id: id, quantity: { $gte: requested } }, // ensure enough stock
      { $inc: { quantity: -requested } },        // decrement
      { new: true }                              // return updated doc
    ).lean();

    // if updated is null => not enough stock
    if (!updated) {
      return res.status(400).json({ error: "Insufficient stock" });
    }

    return res.status(200).json({
      id: String(updated._id),
      name: updated.name,
      quantity: updated.quantity,
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
    if (!Number.isInteger(add) || add <= 0) {
      return res.status(400).json({ error: "quantity must be a positive integer" });
    }

    // ensure sweet exists and atomically increment quantity
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