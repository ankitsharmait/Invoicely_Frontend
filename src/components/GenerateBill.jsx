import React, { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_URL = "https://invoicely-backend.onrender.com/api";

function GenerateBill() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [quantity, setQuantity] = useState("");
  const [billItems, setBillItems] = useState(() => {
    const savedItems = localStorage.getItem('billItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isListeningCustomer, setIsListeningCustomer] = useState(false);
  const [customerName, setCustomerName] = useState(() => {
    const savedName = localStorage.getItem('customerName');
    return savedName || "";
  });
  const [specialPrice, setSpecialPrice] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);

  // Initialize speech recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = 'hi-IN';

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (isListeningCustomer) {
      setCustomerName(transcript);
    } else {
      setSearch(transcript);
    }
    setIsListening(false);
    setIsListeningCustomer(false);
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    setIsListening(false);
    setIsListeningCustomer(false);
    showToast("❌ Voice recognition failed. Please try again.");
  };

  recognition.onend = () => {
    setIsListening(false);
    setIsListeningCustomer(false);
  };

  const startListening = (isCustomer = false) => {
    try {
      if (isCustomer) {
        setIsListeningCustomer(true);
      } else {
        setIsListening(true);
      }
      recognition.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
      setIsListening(false);
      setIsListeningCustomer(false);
      showToast("❌ Voice recognition not supported in your browser.");
    }
  };

  console.log(billItems);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/items`);
        setItems(response.data);
        setError("");
      } catch (err) {
        setError("Failed to load items. Please try again.");
        console.error("Error fetching items:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Update localStorage whenever billItems or customerName changes
  useEffect(() => {
    localStorage.setItem('billItems', JSON.stringify(billItems));
  }, [billItems]);

  useEffect(() => {
    localStorage.setItem('customerName', customerName);
  }, [customerName]);

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setSearch(item.name);
  };

  const handleClearSelection = () => {
    setSelectedItem(null);
    setSearch("");
    setQuantity("");
    setSpecialPrice("");
  };

  const handleAddToBill = () => {
    if (!selectedItem) {
      showToast("❌ Please select an item first");
      return;
    }
    if (quantity === "" || quantity <= 0) {
      showToast("❌ Please enter a valid quantity");
      return;
    }
    const itemPrice = specialPrice ? parseFloat(specialPrice) : selectedItem.price;
    const itemTotal = itemPrice * parseFloat(quantity);
    const billItem = {
      ...selectedItem,
      price: itemPrice,
      quantity: parseFloat(quantity),
      total: itemTotal,
      isSpecialPrice: !!specialPrice
    };
    setBillItems([...billItems, billItem]);
    setSearch("");
    setQuantity("");
    setSpecialPrice("");
    setSelectedItem(null);
    showToast("✅ Item added to bill!");
  };

  const handleCreateInvoice = async () => {
    if (!customerName.trim()) {
      showToast("❌ Please enter customer name");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          customerName: customerName.trim(),
          items: billItems 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("Error creating invoice:", errorData);
        alert("Failed to create invoice.");
        return;
      }

      const data = await res.json();
      console.log("Invoice created successfully:", data);
      showToast("✅ Invoice created successfully!");
    } catch (err) {
      console.error("Network error:", err);
      alert("Something went wrong.");
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 3000);
  };

  const totalAmount = billItems.reduce((sum, item) => sum + item.total, 0);

  const handleDownloadPDF = () => {
    // Create a temporary div for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="width: 210mm; min-height: 297mm; padding: 10mm; font-family: Arial, sans-serif; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8mm;">
          <div style="display: flex; align-items: center; gap: 10mm;">
            <h1 style="font-size: 28px; font-weight: bold; color: #1F2937;">🧾 Invoice</h1>
            <p style="color: #6B7280; font-size: 14px;">Customer: ${customerName}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #6B7280; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 8mm;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 5mm;">
            <thead>
              <tr style="background-color: #3B82F6; color: white;">
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 8%;">S.No</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 30%;">Item Name</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 15%;">MRP</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 15%;">Quantity</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 15%;">Price/Unit</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 17%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${billItems.map((item, index) => `
                <tr style="border-bottom: 1px solid #E5E7EB;">
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">${index + 1}</td>
                  <td style="padding: 3mm 3mm; color: #1F2937; font-weight: 500; font-size: 12px;">${item.name}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">${item.mrp ? `₹${item.mrp}` : '-'}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">${item.quantity} ${item.unit}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">₹${item.price}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="border-top: 2px solid #E5E7EB; padding-top: 5mm; margin-top: 5mm;">
          <div style="display: flex; justify-content: flex-end; align-items: center;">
            <div style="text-align: right;">
              <p style="color: #6B7280; font-size: 14px; margin-bottom: 1mm;">Total Amount:</p>
              <h2 style="font-size: 24px; font-weight: bold; color: #047857;">
                ₹${totalAmount.toFixed(2)}
              </h2>
            </div>
          </div>
        </div>

        <div style="margin-top: 5mm; text-align: center; color: #6B7280; font-size: 12px;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;
    document.body.appendChild(tempDiv);

    html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      logging: false,
      windowWidth: 210 * 3.78, // Convert mm to pixels (1mm = 3.78px)
      windowHeight: 297 * 3.78
    }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("invoice.pdf");
      document.body.removeChild(tempDiv);
    });
  };

  const handlePrint = () => {
    // Create a temporary div for printing
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = `
      <div style="width: 210mm; min-height: 297mm; padding: 10mm; font-family: Arial, sans-serif; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8mm;">
          <div style="display: flex; align-items: center; gap: 10mm;">
            <h1 style="font-size: 28px; font-weight: bold; color: #1F2937;">🧾 Invoice</h1>
            <p style="color: #6B7280; font-size: 14px;">Customer: ${customerName}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: #6B7280; font-size: 14px;">Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style="margin-bottom: 8mm;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 5mm;">
            <thead>
              <tr style="background-color: #3B82F6; color: white;">
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 8%;">S.No</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 30%;">Item Name</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 15%;">MRP</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 15%;">Quantity</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 15%;">Price/Unit</th>
                <th style="padding: 4mm 3mm; text-align: left; font-weight: 600; width: 17%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${billItems.map((item, index) => `
                <tr style="border-bottom: 1px solid #E5E7EB;">
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">${index + 1}</td>
                  <td style="padding: 3mm 3mm; color: #1F2937; font-weight: 500; font-size: 12px;">${item.name}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">${item.mrp ? `₹${item.mrp}` : '-'}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">${item.quantity} ${item.unit}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">₹${item.price}</td>
                  <td style="padding: 3mm 3mm; color: #4B5563; font-size: 12px;">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="border-top: 2px solid #E5E7EB; padding-top: 5mm; margin-top: 5mm;">
          <div style="display: flex; justify-content: flex-end; align-items: center;">
            <div style="text-align: right;">
              <p style="color: #6B7280; font-size: 14px; margin-bottom: 1mm;">Total Amount:</p>
              <h2 style="font-size: 24px; font-weight: bold; color: #047857;">
                ₹${totalAmount.toFixed(2)}
              </h2>
            </div>
          </div>
        </div>

        <div style="margin-top: 5mm; text-align: center; color: #6B7280; font-size: 12px;">
          <p>Thank you for your business!</p>
        </div>
      </div>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice</title>
          <style>
            @media print {
              body { 
                margin: 0;
                padding: 0;
              }
              @page {
                size: A4;
                margin: 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                padding: 8mm 5mm;
              }
            }
          </style>
        </head>
        <body>
          ${tempDiv.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleRemoveItem = (index) => {
    setBillItems(billItems.filter((_, i) => i !== index));
    showToast("✅ Item removed from bill!");
  };

  const handleNewInvoice = () => {
    setBillItems([]);
    setCustomerName("");
    setSearch("");
    setQuantity("");
    setSpecialPrice("");
    setSelectedItem(null);
    // Clear localStorage when creating new invoice
    localStorage.removeItem('billItems');
    localStorage.removeItem('customerName');
    showToast("✅ New invoice started!");
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-2 sm:p-6">
      <div className="w-full max-w-4xl flex justify-between items-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-3xl font-bold text-gray-800">Generate Bill</h2>
        <button
          onClick={handleNewInvoice}
          className="bg-green-500 hover:bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium shadow transition duration-300"
        >
          📄 New Invoice
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded relative mb-3 sm:mb-4 text-sm sm:text-base">
          {error}
        </div>
      )}

      {toast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition duration-300">
          {toast}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-8 w-full max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="border border-gray-300 rounded-lg p-2 sm:p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => startListening(true)}
            className={`p-3 rounded-lg ${isListeningCustomer ? 'bg-red-500' : 'bg-blue-500'} text-white hover:opacity-90 transition-colors`}
          >
            🎤
          </button>
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => startListening()}
              className={`p-3 rounded-lg ${isListening ? 'bg-red-500' : 'bg-blue-500'} text-white hover:opacity-90 transition-colors`}
            >
              🎤
            </button>
          </div>

          {search && !selectedItem && (
            <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {items
                .filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
                .map(item => (
                  <div
                    key={item._id}
                    onClick={() => handleItemSelect(item)}
                    className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-600">₹{item.price} per {item.unit}</div>
                  </div>
                ))}
            </div>
          )}

          {selectedItem && (
            <div className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div className="font-medium">{selectedItem.name}</div>
                <button
                  onClick={handleClearSelection}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  ✕ Clear
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="number"
                  placeholder="Special Price (optional)"
                  value={specialPrice}
                  onChange={(e) => setSpecialPrice(e.target.value)}
                  className="border border-gray-300 rounded-lg p-3 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                  onClick={handleAddToBill}
                  className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add to Bill
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      {billItems.length > 0 && (
        <div className="w-full max-w-4xl mb-6 sm:mb-10">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-700 mb-3 sm:mb-4">🛒 Cart</h3>
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm sm:text-base">
                <thead className="bg-[#3B82F6]">
                  <tr>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">Item</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">MRP</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">Quantity</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">Price</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">Total</th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-white uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {billItems.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {item.mrp ? `₹${item.mrp}` : '-'}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        ₹{item.price}
                        {item.isSpecialPrice && (
                          <span className="ml-1 sm:ml-2 text-xs text-purple-600">(Special)</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                        ₹{item.total.toFixed(2)}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 sm:px-3 py-1 rounded-full transition-colors duration-200"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-3 sm:px-6 py-2 sm:py-4 text-right text-xs sm:text-sm font-medium text-gray-900">
                      Total Amount:
                    </td>
                    <td className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm font-medium text-gray-900">
                      ₹{totalAmount.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          onClick={handleCreateInvoice}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium shadow transition duration-300 disabled:opacity-50"
          disabled={loading || billItems.length === 0}
        >
          {loading ? "Creating..." : "💾 Save Invoice"}
        </button>
        <button
          onClick={handleDownloadPDF}
          className="bg-red-500 hover:bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium shadow transition duration-300 disabled:opacity-50"
          disabled={loading || billItems.length === 0}
        >
          📥 Download PDF
        </button>
        <button
          onClick={handlePrint}
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-medium shadow transition duration-300 disabled:opacity-50"
          disabled={loading || billItems.length === 0}
        >
          🖨 Print Invoice
        </button>
      </div>
    </div>
  );
}

export default GenerateBill;
