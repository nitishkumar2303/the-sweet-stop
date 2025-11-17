import React from "react";

export default function SweetCard({
  sweet,
  onPurchase,
  purchasing,
  isAdmin,
  onRestock,
  onEdit,
  onDelete,
}) {
  // sweet: { id, name, category, price, quantity }
  const formatINR = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(v ?? 0);

  function priceUnitLabel(unit) {
    switch (unit) {
      case "kg":
        return "kg";
      case "g":
        return "100 g"; // show per 100 grams
      case "ltr":
        return "ltr";
      case "ml":
        return "100 ml"; // show per 100 ml
      default:
        return "piece";
    }
  }
  return (
    <div className="bg-white rounded-2xl p-0 shadow-md flex flex-col gap-0 border border-zinc-200 overflow-hidden">
      {/* Image */}
      <div className="w-full h-40 bg-zinc-100 overflow-hidden">
        <img
          src={sweet.imageUrl || "/placeholder-sweet.svg"}
          alt={sweet.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "/placeholder-sweet.svg";
          }}
        />
      </div>

      <div className="p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="px-4 py-1 text-xs font-semibold bg-pink-100 text-pink-600 rounded-full uppercase tracking-wide">
            {sweet.category}
          </span>
          <span className="text-xs font-semibold text-zinc-400">
            {sweet.quantity} {sweet.unit ?? "piece"} IN STOCK
          </span>
        </div>

        <h3 className="text-2xl font-bold text-zinc-900">{sweet.name}</h3>
        <div className="text-3xl font-semibold text-purple-500">
          {formatINR(sweet.price)}
          <span className="text-sm text-zinc-400 ml-2">
            /{priceUnitLabel(sweet.unit)}
          </span>
        </div>

        <button
          onClick={() => onPurchase(sweet)}
          disabled={purchasing || sweet.quantity <= 0}
          className={`w-full py-3 rounded-lg text-white font-semibold text-lg transition ${
            sweet.quantity > 0
              ? "bg-pink-500 hover:bg-pink-600"
              : "bg-zinc-300 cursor-not-allowed"
          }`}
        >
          {purchasing
            ? "Purchasing..."
            : sweet.quantity > 0
            ? "Purchase"
            : "Sold Out"}
        </button>
        {isAdmin && (
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => onRestock(sweet._id)}
              className="p-3 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition"
              title="Restock"
            >
              +
            </button>

            <button
              onClick={() => onEdit(sweet)}
              className="p-3 rounded-xl bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition"
              title="Edit"
            >
              ✎
            </button>

            <button
              onClick={() => onDelete(sweet._id)}
              className="p-3 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 transition"
              title="Delete"
            >
              🗑
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
