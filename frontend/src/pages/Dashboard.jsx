import React, { useState, useEffect, useContext, useCallback } from "react";
import { AuthContext } from "../context/AuthContext";
import {
  getSweets,
  searchSweets,
  purchaseSweet,
  restockSweet,
  deleteSweet,
  createSweet,
  updateSweet,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../services/api";

// ---------- Small modal form component (Create / Edit) ----------
function SweetFormModal({ open, initial, onClose, onSaved, categories }) {
  const init = initial || {};
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    unit: "piece",
    ...init,
  });

  useEffect(() => {
    const next = initial || {};
    setForm({
      name: next.name ?? "",
      category: next.category ?? "",
      price: next.price ?? "",
      quantity: next.quantity ?? "",
      unit: next.unit ?? "piece",
    });
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.category ||
      form.price === "" ||
      form.quantity === "" ||
      !form.unit
    ) {
      return alert("Please fill all fields");
    }

    try {
      const body = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
        unit: form.unit,
      };

      if (init?.id) {
        await updateSweet(init.id, body);
      } else {
        await createSweet(body);
      }

      onSaved?.();
      onClose?.();
    } catch (err) {
      console.error("Save sweet failed", err);
      alert(err?.response?.data?.error || "Save failed");
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg"
      >
        <h3 className="text-lg font-semibold mb-3">
          {init?.id ? "Edit Sweet" : "Add Sweet"}
        </h3>

        <label className="block text-sm text-gray-600">Name</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-2"
        />

        <label className="block text-sm text-gray-600">Category</label>
        <input
          name="category"
          list="category-list"
          value={form.category}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-2"
        />
        <datalist id="category-list">
          {(categories || []).map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600">Price</label>
            <input
              name="price"
              type="number"
              value={form.price}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Quantity</label>
            <input
              name="quantity"
              type="number"
              value={form.quantity}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <div className="mt-2">
          <label className="block text-sm text-gray-600">Unit</label>
          <select
            name="unit"
            value={form.unit}
            onChange={handleChange}
            className="w-full p-2 border rounded mb-2"
          >
            <option value="piece">Piece</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="ltr">ltr</option>
            <option value="ml">ml</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 border rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            {init?.id ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

// small row component for category listing/editing
function CategoryRow({ cat, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cat.name);

  useEffect(() => setName(cat.name), [cat.name]);

  return (
    <div className="flex items-center justify-between p-2 border rounded">
      {editing ? (
        <input
          className="flex-1 p-1 border rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      ) : (
        <div className="flex-1">{cat.name}</div>
      )}
      <div className="flex gap-2 ml-3">
        {editing ? (
          <>
            <button
              onClick={async () => {
                await onUpdate(cat.id, name);
                setEditing(false);
              }}
              className="px-2 py-1 rounded bg-blue-600 text-white"
            >
              Save
            </button>
            <button
              onClick={() => {
                setName(cat.name);
                setEditing(false);
              }}
              className="px-2 py-1 rounded border"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => setEditing(true)}
              className="px-2 py-1 rounded border"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(cat.id)}
              className="px-2 py-1 rounded bg-red-100 text-red-600"
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Dashboard ----------
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [minDbPrice, setMinDbPrice] = useState(0);
  const [maxDbPrice, setMaxDbPrice] = useState(100);
  const [selectedPrice, setSelectedPrice] = useState(100);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editInitial, setEditInitial] = useState(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  // debounce small helper
  function useDebounce(value, delay) {
    const [v, setV] = useState(value);
    useEffect(() => {
      const t = setTimeout(() => setV(value), delay);
      return () => clearTimeout(t);
    }, [value, delay]);
    return v;
  }
  const debouncedSearch = useDebounce(search, 350);
  const debouncedPrice = useDebounce(selectedPrice, 200);

  // fetch min/max once to populate slider nicely
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getSweets();
        const all = res?.data?.items || [];
        if (!mounted) return;
        if (all.length) {
          const prices = all.map((s) => s.price);
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          setMinDbPrice(min);
          setMaxDbPrice(max);
          setSelectedPrice(max);
        }
      } catch (err) {
        console.error("price range load failed", err);
      }
    })();

    // load categories
    (async () => {
      try {
        const res = await getCategories();
        const items = res?.data?.items || [];
        if (!mounted) return;
        setCategories(items.map((c) => c.name));
      } catch (err) {
        // ignore
      }
    })();
    return () => (mounted = false);
  }, []);

  // main fetch function
  const fetchSweets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (debouncedSearch?.trim()) params.name = debouncedSearch.trim();
      if (category) params.category = category;
      if (Number(debouncedPrice) < Number(maxDbPrice))
        params.max = Number(debouncedPrice);

      const res = Object.keys(params).length
        ? await searchSweets(params)
        : await getSweets();
      const items = res?.data?.items || [];
      setSweets(items.map((it) => ({ id: it.id ?? it._id, ...it })));
    } catch (err) {
      console.error("fetchSweets error", err);
      setError("Failed to load sweets.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, debouncedPrice, maxDbPrice]);

  useEffect(() => {
    fetchSweets();
  }, [fetchSweets]);

  // fetch categories helper so we can refresh after creates/updates
  const fetchCategories = useCallback(async () => {
    try {
      const res = await getCategories();
      const items = res?.data?.items || [];
      setCategories(items.map((c) => c.name));
    } catch (err) {
      // ignore
    }
  }, []);

  // Category manager actions (admin)
  const [catList, setCatList] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [catError, setCatError] = useState("");

  const loadCatList = useCallback(async () => {
    setCatLoading(true);
    try {
      const res = await getCategories();
      const items = res?.data?.items || [];
      setCatList(items);
    } catch (err) {
      setCatError("Failed to load categories");
    } finally {
      setCatLoading(false);
    }
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName || !newCatName.trim()) return setCatError("Enter a name");
    try {
      await createCategory({ name: newCatName.trim() });
      setNewCatName("");
      await loadCatList();
      await fetchCategories();
    } catch (err) {
      setCatError(err?.response?.data?.error || "Create failed");
    }
  };

  const handleUpdateCategory = async (id, name) => {
    try {
      await updateCategory(id, { name });
      await loadCatList();
      await fetchCategories();
    } catch (err) {
      setCatError(err?.response?.data?.error || "Update failed");
    }
  };

  const handleDeleteCategory = async (id) => {
    if (
      !confirm(
        "Delete this category? This cannot be undone if sweets still use it."
      )
    )
      return;
    try {
      await deleteCategory(id);
      await loadCatList();
      await fetchCategories();
    } catch (err) {
      setCatError(err?.response?.data?.error || "Delete failed");
    }
  };

  // Actions
  // Purchase modal state + helpers
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [purchaseQty, setPurchaseQty] = useState("");
  const [purchaseError, setPurchaseError] = useState("");

  function defaultQtyForUnit(u) {
    switch (u) {
      case "piece":
        return "1";
      case "kg":
        return "1";
      case "g":
        return "100";
      case "ltr":
        return "1";
      case "ml":
        return "100";
      default:
        return "1";
    }
  }

  function openPurchaseModal(sweet) {
    setPurchaseTarget(sweet);
    setPurchaseQty(defaultQtyForUnit(sweet.unit ?? "piece"));
    setPurchaseError("");
    setPurchaseModalOpen(true);
  }

  async function submitPurchase() {
    const sweet = purchaseTarget;
    if (!sweet) return;
    const unit = sweet.unit ?? "piece";
    const q = Number(purchaseQty);
    if (Number.isNaN(q) || q <= 0) {
      setPurchaseError("Enter a valid quantity");
      return;
    }
    if (unit === "piece" && !Number.isInteger(q)) {
      setPurchaseError("Please enter a whole number of pieces");
      return;
    }
    if (q > sweet.quantity) {
      setPurchaseError(
        `Requested exceeds available stock (${sweet.quantity} ${unit})`
      );
      return;
    }

    try {
      await purchaseSweet(sweet.id ?? sweet._id, q);
      setPurchaseModalOpen(false);
      setPurchaseTarget(null);
      fetchSweets();
    } catch (err) {
      setPurchaseError(err?.response?.data?.error || "Purchase failed");
    }
  }

  const handleRestock = async (id) => {
    const qtyStr = prompt("Quantity to add?", "10");
    const qty = Number(qtyStr);
    if (!qty || qty <= 0) return alert("Invalid quantity");
    try {
      await restockSweet(id, qty);
      fetchSweets();
    } catch (err) {
      alert(err?.response?.data?.error || "Restock failed");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this sweet?")) return;
    try {
      await deleteSweet(id);
      setSweets((s) => s.filter((x) => x.id !== id));
    } catch (err) {
      alert("Delete failed");
    }
  };

  const openEdit = (s) => {
    setEditInitial({
      id: s.id,
      name: s.name,
      category: s.category,
      price: s.price,
      quantity: s.quantity,
      unit: s.unit ?? "piece",
    });
    setModalOpen(true);
  };

  // helpers for card visuals
  function getIconForCategory(cat = "") {
    const c = String(cat).toLowerCase();
    if (c.includes("chocolate")) return "🍫";
    if (c.includes("indian")) return "🪔";
    if (c.includes("cake") || c.includes("pastry")) return "🍰";
    if (c.includes("donut")) return "🍩";
    return "🍬";
  }
  function getStockColor(qty) {
    if (qty === 0) return "bg-zinc-200";
    if (qty < 5) return "bg-orange-100";
    return "bg-pink-50";
  }

  function formatINR(v) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(v ?? 0);
  }

  function priceUnitLabel(unit) {
    switch (unit) {
      case "kg":
        return "kg";
      case "g":
        return "100 g";
      case "ltr":
        return "ltr";
      case "ml":
        return "100 ml";
      default:
        return "piece";
    }
  }

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-pink-500">
            Sweet Dashboard
          </h1>
          <p className="text-sm text-zinc-500">
            Welcome back, <span className="font-semibold">{user?.name}</span>
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {isAdmin && (
            <button
              onClick={() => {
                setEditInitial(null);
                setModalOpen(true);
              }}
              className="px-3 py-2 rounded bg-green-600 text-white"
            >
              Add Sweet
            </button>
          )}
          {isAdmin && (
            <button
              onClick={async () => {
                await loadCatList();
                setCategoriesModalOpen(true);
              }}
              className="px-3 py-2 rounded bg-yellow-500 text-white"
            >
              Manage Categories
            </button>
          )}
          <button onClick={fetchSweets} className="px-3 py-2 border rounded">
            Refresh
          </button>
        </div>
      </div>

      {/* filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white placeholder-zinc-400"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <div className="px-2 py-1 rounded-md bg-zinc-800 text-white">
          <label className="flex justify-between text-xs text-zinc-400">
            <span>Max price</span>
            <span className="font-bold text-pink-300">
              {formatINR(selectedPrice)}
            </span>
          </label>
          <input
            type="range"
            min={minDbPrice}
            max={maxDbPrice}
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* content */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading sweets...</div>
      ) : error ? (
        <div className="text-center py-6 text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sweets.map((sweet) => (
            <div
              key={sweet.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden border"
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold">{sweet.name}</h3>
                  <span className="text-xs px-2 py-1 bg-zinc-100 rounded-full">
                    {sweet.category}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="text-2xl font-bold text-pink-500">
                    {formatINR(sweet.price)}
                    <span className="text-sm text-zinc-400 ml-2">
                      /{priceUnitLabel(sweet.unit)}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500">
                    Stock:{" "}
                    <span
                      className={
                        sweet.quantity < 5 ? "text-red-500" : "text-green-600"
                      }
                    >
                      {sweet.quantity} {sweet.unit ?? "piece"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => openPurchaseModal(sweet)}
                    disabled={sweet.quantity < 1}
                    className="flex-1 py-2 rounded bg-gradient-to-r from-pink-400 to-pink-500 text-white disabled:opacity-50"
                  >
                    {sweet.quantity < 1 ? "Sold Out" : "Buy"}
                  </button>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRestock(sweet.id)}
                        title="Restock"
                        className="px-3 py-2 rounded bg-green-100 text-green-700"
                      >
                        +
                      </button>
                      <button
                        onClick={() => openEdit(sweet)}
                        title="Edit"
                        className="px-3 py-2 rounded border"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(sweet.id)}
                        title="Delete"
                        className="px-3 py-2 rounded bg-red-100 text-red-600"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sweets.length === 0 && (
            <div className="col-span-full text-center py-20 text-zinc-400">
              No sweets found.
            </div>
          )}
        </div>
      )}

      {/* modal */}
      {/* Purchase modal */}
      {purchaseModalOpen && purchaseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">
              Purchase {purchaseTarget.name}
            </h3>
            <div className="text-sm text-zinc-500 mb-2">
              Available:{" "}
              <span className="font-semibold">
                {purchaseTarget.quantity} {purchaseTarget.unit ?? "piece"}
              </span>
            </div>

            <div className="mb-3">
              <label className="block text-sm text-gray-600">
                Quantity ({purchaseTarget.unit ?? "piece"})
              </label>
              <div className="flex gap-2 mt-2">
                {/* presets based on unit */}
                {(function renderPresets() {
                  const u = purchaseTarget.unit ?? "piece";
                  let presets = [];
                  if (u === "piece") presets = [1, 2, 5];
                  else if (u === "kg") presets = [0.25, 0.5, 1];
                  else if (u === "g") presets = [50, 100, 250];
                  else if (u === "ltr") presets = [0.25, 0.5, 1];
                  else if (u === "ml") presets = [50, 100, 250];
                  return presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPurchaseQty(String(p))}
                      className="px-3 py-1 rounded bg-zinc-100 hover:bg-zinc-200"
                    >
                      {p}
                    </button>
                  ));
                })()}
              </div>
              <input
                className="w-full p-2 border rounded mt-3"
                value={purchaseQty}
                onChange={(e) => setPurchaseQty(e.target.value)}
              />
              {purchaseError && (
                <div className="text-red-500 text-sm mt-2">{purchaseError}</div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setPurchaseModalOpen(false);
                  setPurchaseTarget(null);
                }}
                className="px-3 py-1 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={submitPurchase}
                className="px-3 py-1 rounded bg-pink-600 text-white"
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}
      <SweetFormModal
        open={modalOpen}
        initial={editInitial}
        categories={categories}
        onClose={() => {
          setModalOpen(false);
          setEditInitial(null);
        }}
        onSaved={() => {
          fetchSweets();
          fetchCategories();
        }}
      />

      {/* Categories Manager Modal (admin) */}
      {categoriesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold mb-3">Manage Categories</h3>
            <div className="mb-3">
              <div className="flex gap-2">
                <input
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name"
                  className="flex-1 p-2 border rounded"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-3 py-2 rounded bg-green-600 text-white"
                >
                  Add
                </button>
              </div>
              {catError && <div className="text-red-500 mt-2">{catError}</div>}
            </div>

            <div className="space-y-2 max-h-64 overflow-auto">
              {catLoading ? (
                <div>Loading...</div>
              ) : (
                catList.map((c) => (
                  <CategoryRow
                    key={c.id}
                    cat={c}
                    onUpdate={handleUpdateCategory}
                    onDelete={handleDeleteCategory}
                  />
                ))
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setCategoriesModalOpen(false)}
                className="px-3 py-1 border rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
