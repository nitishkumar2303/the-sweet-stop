import mongoose from "mongoose";

const sweetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    // unit: unit of measure for quantity (e.g. piece, kg, g, l)
    unit: {
      type: String,
      enum: ["piece", "kg", "g", "ltr", "ml"],
      default: "piece",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Sweet", sweetSchema);
