import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "https://invoicely-backend.onrender.com/api";

function AllItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [priceInputs, setPriceInputs] = useState({});
  const [mrpInputs, setMrpInputs] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, itemId: null });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/items`);
      // Sort items alphabetically by name
      const sortedItems = response.data.sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );
      setItems(sortedItems);
      setError("");
    } catch (err) {
      setError("Failed to load items. Please try again.");
      console.error("Error fetching items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDeleteItem = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`${API_URL}/items/${id}`);
      setItems(items.filter((item) => item._id !== id));
      setError("");
      setDeleteConfirm({ show: false, itemId: null }); // Hide confirmation after successful deletion
    } catch (err) {
      setError("Failed to delete item. Please try again.");
      console.error("Error deleting item:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (id) => {
    const newPrice = priceInputs[id];
    const newMrp = mrpInputs[id];
    
    if (!newPrice && !newMrp) return;

    try {
      setLoading(true);
      const response = await axios.put(`${API_URL}/items/${id}`, {
        price: newPrice ? parseFloat(newPrice) : undefined,
        mrp: newMrp ? parseFloat(newMrp) : undefined
      });

      setItems(items.map((item) => (item._id === id ? response.data : item)));
      setPriceInputs((prev) => ({ ...prev, [id]: "" })); // Clear the price input
      setMrpInputs((prev) => ({ ...prev, [id]: "" })); // Clear the MRP input
      setError("");
    } catch (err) {
      setError("Failed to update item. Please try again.");
      console.error("Error updating item:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-2 sm:p-6">
      <h2 className="text-xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-8">All Items</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded relative mb-3 sm:mb-4 text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4">Confirm Delete</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Are you sure you want to delete this item?</p>
            <div className="flex justify-end gap-3 sm:gap-4">
              <button
                onClick={() => setDeleteConfirm({ show: false, itemId: null })}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors duration-300"
              >
                No
              </button>
              <button
                onClick={() => handleDeleteItem(deleteConfirm.itemId)}
                className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors duration-300"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-4xl space-y-3 sm:space-y-4">
        {loading ? (
          <p className="text-gray-500 text-center text-sm sm:text-base">Loading items...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500 text-center text-sm sm:text-base">No items available.</p>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-lg p-3 sm:p-4 shadow flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-4">
                <div className="flex flex-col gap-1 sm:gap-2">
                  <span className="text-base sm:text-lg font-semibold">{item.name}</span>
                  <span className="text-sm sm:text-base text-gray-600">
                    ₹{item.price} / {item.unit}
                  </span>
                  {item.mrp && (
                    <span className="text-xs sm:text-sm text-gray-500">
                      (MRP: ₹{item.mrp})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 sm:gap-3 w-full sm:w-auto">
                  <input
                    type="number"
                    placeholder="New Price"
                    value={priceInputs[item._id] ?? ""}
                    onChange={(e) => {
                      const newPrice = e.target.value;
                      setPriceInputs((prev) => ({ ...prev, [item._id]: newPrice }));
                    }}
                    className="border border-gray-300 rounded-lg p-2 w-24 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    placeholder="New MRP"
                    value={mrpInputs[item._id] ?? ""}
                    onChange={(e) => {
                      const newMrp = e.target.value;
                      setMrpInputs((prev) => ({ ...prev, [item._id]: newMrp }));
                    }}
                    className="border border-gray-300 rounded-lg p-2 w-24 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    disabled={loading}
                  />
                  <button
                    onClick={() => handleUpdateItem(item._id)}
                    className="bg-green-500 hover:bg-green-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium disabled:opacity-50"
                    disabled={loading || (!priceInputs[item._id] && !mrpInputs[item._id])}
                  >
                    💾 Save
                  </button>
                  <button
                    onClick={() => setDeleteConfirm({ show: true, itemId: item._id })}
                    className="bg-red-500 hover:bg-red-600 text-white py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base font-medium disabled:opacity-50"
                    disabled={loading}
                  >
                    ❌ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AllItems; 