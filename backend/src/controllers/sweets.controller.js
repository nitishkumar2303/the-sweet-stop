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

export async function listSweets(req, res) {
  try {
    const docs = await Sweet.find({}).lean();

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
