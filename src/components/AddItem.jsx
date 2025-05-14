import { useState } from "react";
import axios from "axios";

const API_URL = "https://invoicely-backend.onrender.com/api";

function AddItem() {
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemMRP, setItemMRP] = useState("");
  const [itemUnit, setItemUnit] = useState("kg");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAddItem = async () => {
    if (itemName.trim() === "" || itemPrice === "") {
      alert("Please enter item name, price, and select unit.");
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(`${API_URL}/items`, {
        name: itemName.trim(),
        price: parseFloat(itemPrice),
        mrp: itemMRP ? parseFloat(itemMRP) : null,
        unit: itemUnit,
      });

      setItemName("");
      setItemPrice("");
      setItemMRP("");
      setItemUnit("kg");
      setError("");
    } catch (err) {
      setError("Failed to add item. Please try again.");
      console.error("Error adding item:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-6">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Add Kirana Item</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col items-center gap-4 mb-6 w-full max-w-md">
        <input
          type="text"
          placeholder="Item Name (e.g., Rice, Oil)"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
        />
        <input
          type="number"
          placeholder="MRP"
          value={itemMRP}
          onChange={(e) => setItemMRP(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
        />
        <input
          type="number"
          placeholder="Price"
          value={itemPrice}
          onChange={(e) => setItemPrice(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
        />
        <select
          value={itemUnit}
          onChange={(e) => setItemUnit(e.target.value)}
          className="border border-gray-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
        >
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="pcs">pcs</option>
          <option value="liters">liters</option>
          <option value="ml">ml</option>
          <option value="dozen">dozen</option>
          <option value="बोरा">बोरा</option>
          <option value="पेटी">पेटी</option>
          <option value="बंडल">बंडल</option>
          <option value="टीना">टीना</option>
        </select>
      </div>
      <button
        onClick={handleAddItem}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-8 rounded-xl text-lg shadow-md transition duration-300 mb-10 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Adding..." : "➕ Add Item"}
      </button>
    </div>
  );
}

export default AddItem;
