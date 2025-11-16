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
} from "../services/api";

// ---------- Small modal form component (Create / Edit) ----------
function SweetFormModal({ open, initial, onClose, onSaved }) {
  // ensure `initial` is always an object (caller may pass null for "create")
  const init = initial || {};
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    quantity: "",
    ...init,
  });

  useEffect(() => {
    // when modal opens or initial changes, populate the form safely
    const next = initial || {};
    setForm({
      name: next.name ?? "",
      category: next.category ?? "",
      price: next.price ?? "",
      quantity: next.quantity ?? "",
    });
  }, [initial, open]);

  if (!open) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // basic validation (price/quantity must be numeric)
    if (!form.name || !form.category || form.price === "" || form.quantity === "") {
      return alert("Please fill all fields");
    }

    try {
      const body = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        quantity: Number(form.quantity),
      };

      if (init?.id) {
        // update existing
        await updateSweet(init.id, body);
      } else {
        // create new
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
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-lg p-6 shadow-lg">
        <h3 className="text-lg font-semibold mb-3">{init?.id ? "Edit Sweet" : "Add Sweet"}</h3>

        <label className="block text-sm text-gray-600">Name</label>
        <input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded mb-2" />

        <label className="block text-sm text-gray-600">Category</label>
        <input name="category" value={form.category} onChange={handleChange} className="w-full p-2 border rounded mb-2" />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm text-gray-600">Price</label>
            <input name="price" type="number" value={form.price} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Quantity</label>
            <input name="quantity" type="number" value={form.quantity} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <button type="button" onClick={onClose} className="px-3 py-1 border rounded">Cancel</button>
          <button type="submit" className="px-3 py-1 rounded bg-blue-600 text-white">{init?.id ? "Save" : "Create"}</button>
        </div>
      </form>
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
  const [minDbPrice, setMinDbPrice] = useState(0);
  const [maxDbPrice, setMaxDbPrice] = useState(100);
  const [selectedPrice, setSelectedPrice] = useState(100);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editInitial, setEditInitial] = useState(null);

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
      if (Number(debouncedPrice) < Number(maxDbPrice)) params.max = Number(debouncedPrice);

      const res = Object.keys(params).length ? await searchSweets(params) : await getSweets();
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

  // Actions
  const handlePurchase = async (id, name) => {
    if (!confirm(`Purchase 1 ${name}?`)) return;
    try {
      await purchaseSweet(id, 1);
      fetchSweets();
    } catch (err) {
      alert(err?.response?.data?.error || "Purchase failed");
    }
  };

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
    setEditInitial({ id: s.id, name: s.name, category: s.category, price: s.price, quantity: s.quantity });
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

  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-pink-500">Sweet Dashboard</h1>
          <p className="text-sm text-zinc-500">Welcome back, <span className="font-semibold">{user?.name}</span></p>
        </div>

        <div className="flex gap-2 items-center">
          {isAdmin && (
            <button onClick={() => { setEditInitial(null); setModalOpen(true); }} className="px-3 py-2 rounded bg-green-600 text-white">
              Add Sweet
            </button>
          )}
          <button onClick={fetchSweets} className="px-3 py-2 border rounded">Refresh</button>
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
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded-md bg-zinc-800 text-white">
          <option value="">All Categories</option>
          <option value="Indian">Indian</option>
          <option value="Western">Western</option>
          <option value="Chocolate">Chocolate</option>
          <option value="Cake">Cake</option>
          <option value="Pastry">Pastry</option>
          <option value="Donut">Donut</option>
          <option value="Misc">Misc</option>
        </select>
        <div className="px-2 py-1 rounded-md bg-zinc-800 text-white">
          <label className="flex justify-between text-xs text-zinc-400">
            <span>Max price</span>
            <span className="font-bold text-pink-300">${selectedPrice}</span>
          </label>
          <input type="range" min={minDbPrice} max={maxDbPrice} value={selectedPrice} onChange={(e) => setSelectedPrice(Number(e.target.value))} className="w-full" />
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
            <div key={sweet.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border">
              <div className={`h-28 w-full flex items-center justify-center ${getStockColor(sweet.quantity)}`}>
                <span className="text-4xl">{getIconForCategory(sweet.category)}</span>
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold">{sweet.name}</h3>
                  <span className="text-xs px-2 py-1 bg-zinc-100 rounded-full">{sweet.category}</span>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="text-2xl font-bold text-pink-500">${sweet.price}</div>
                  <div className="text-sm text-zinc-500">Stock: <span className={sweet.quantity < 5 ? "text-red-500" : "text-green-600"}>{sweet.quantity}</span></div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => handlePurchase(sweet.id, sweet.name)} disabled={sweet.quantity < 1} className="flex-1 py-2 rounded bg-gradient-to-r from-pink-400 to-pink-500 text-white disabled:opacity-50">
                    {sweet.quantity < 1 ? "Sold Out" : "Buy"}
                  </button>

                  {isAdmin && (
                    <div className="flex gap-2">
                      <button onClick={() => handleRestock(sweet.id)} title="Restock" className="px-3 py-2 rounded bg-green-100 text-green-700">+</button>
                      <button onClick={() => openEdit(sweet)} title="Edit" className="px-3 py-2 rounded border">Edit</button>
                      <button onClick={() => handleDelete(sweet.id)} title="Delete" className="px-3 py-2 rounded bg-red-100 text-red-600">✕</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {sweets.length === 0 && <div className="col-span-full text-center py-20 text-zinc-400">No sweets found.</div>}
        </div>
      )}

      {/* modal */}
      <SweetFormModal
        open={modalOpen}
        initial={editInitial}
        onClose={() => { setModalOpen(false); setEditInitial(null); }}
        onSaved={() => { fetchSweets(); }}
      />
    </div>
  );
}