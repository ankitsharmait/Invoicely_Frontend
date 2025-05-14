import React, { useState, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

function AllBills() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({ show: false, invoiceId: null });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://invoicely-backend.onrender.com/api/invoices');
      if (response.data) {
        const sortedInvoices = response.data.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setInvoices(sortedInvoices);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      setError("Failed to load invoices. Please try again.");
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    try {
      await axios.delete(`https://invoicely-backend.onrender.com/api/invoices/${invoiceId}`);
      setInvoices(invoices.filter(invoice => invoice._id !== invoiceId));
      toast.success("Invoice deleted successfully");
      setDeleteConfirmModal({ show: false, invoiceId: null });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseModal = () => {
    setSelectedInvoice(null);
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      // Create a temporary div for the invoice content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = `
        <div style="padding: 10px; font-family: Arial, sans-serif;">
          <div style="text-align: center; margin-bottom: 10px;">
            <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 2px;">Dayal General Store</h1>
            <p style="font-size: 14px; color: #666;">Invoice Details</p>
          </div>
          <div style="margin-bottom: 10px;">
            <p style="font-weight: bold;">Customer: ${invoice.customerName || "No Name"}</p>
            <p style="color: #666;">Date: ${new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <thead>
              <tr style="background-color: #3B82F6; color: white;">
                <th style="padding: 6px; text-align: left; border: 1px solid #2563EB;">Item</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #2563EB;">MRP</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #2563EB;">Qty</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #2563EB;">Price</th>
                <th style="padding: 6px; text-align: right; border: 1px solid #2563EB;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 6px; border: 1px solid #ddd;">${item.name}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${item.mrp ? `₹${item.mrp}` : '-'}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">${item.quantity} ${item.unit}</td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">
                    ₹${item.price}
                    ${item.isSpecialPrice ? '<span style="color: purple;">(Special)</span>' : ''}
                  </td>
                  <td style="padding: 6px; text-align: right; border: 1px solid #ddd;">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb;">
                <td colspan="4" style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid #ddd;">Total:</td>
                <td style="padding: 6px; text-align: right; font-weight: bold; border: 1px solid #ddd;">
                  ₹${invoice.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`invoice-${invoice._id}.pdf`);
      
      // Clean up
      document.body.removeChild(tempDiv);
      toast.success("PDF downloaded successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = (invoice) => {
    try {
      const printContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                margin: 0;
                padding: 10px;
              }
              .invoice-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .invoice-header h1 {
                font-size: 20px;
                margin: 0 0 2px 0;
              }
              .invoice-header p {
                font-size: 14px;
                color: #666;
                margin: 0;
              }
              .customer-info {
                margin-bottom: 10px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
              }
              th, td {
                padding: 6px;
                border: 1px solid #ddd;
                text-align: left;
              }
              th {
                background-color: #3B82F6;
                color: white;
              }
              td {
                text-align: right;
              }
              td:first-child {
                text-align: left;
              }
              tfoot tr {
                background-color: #f9fafb;
                font-weight: bold;
              }
              @media print {
                body {
                  padding: 0;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <h1>Dayal General Store</h1>
              <p>Invoice Details</p>
            </div>
            <div class="customer-info">
              <p><strong>Customer:</strong> ${invoice.customerName || "No Name"}</p>
              <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>MRP</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.mrp ? `₹${item.mrp}` : '-'}</td>
                    <td>${item.quantity} ${item.unit}</td>
                    <td>
                      ₹${item.price}
                      ${item.isSpecialPrice ? '<span style="color: purple;">(Special)</span>' : ''}
                    </td>
                    <td>₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align: right;">Total:</td>
                  <td>₹${invoice.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `;

      const printWindow = window.open('', 'printWindow', 'width=800,height=600');
      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        toast.error("Please allow popups for printing");
      }
      
      toast.success("Printing started");
    } catch (error) {
      console.error("Error printing:", error);
      toast.error("Failed to print");
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-4">{error}</div>;

  return (
    <div className="container mx-auto p-2 sm:p-4">
      <h1 className="text-xl sm:text-2xl font-bold mb-4">All Bills</h1>
      {invoices.length === 0 ? (
        <div className="text-center text-gray-500 p-4">No bills found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {invoices.map((invoice, index) => (
            <div key={invoice._id} className="bg-white rounded-lg shadow-md p-2 sm:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-2 sm:mb-4">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Bill #{invoices.length - index}</h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {new Date(invoice.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="text-right mt-2 sm:mt-0">
                  <p className="text-sm sm:text-base font-semibold">{invoice.customerName || "No Name"}</p>
                  <p className="text-xs sm:text-sm text-gray-600">{invoice.items.length} items</p>
                </div>
              </div>
              <div className="border-t pt-2 sm:pt-4">
                <p className="text-base sm:text-lg font-bold">
                  Total: ₹{invoice.items.reduce((sum, item) => sum + item.total, 0)}
                </p>
              </div>
              <div className="mt-2 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
                <button
                  onClick={() => handleViewInvoice(invoice)}
                  className="text-xs sm:text-sm bg-blue-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-blue-600 transition-colors"
                >
                  View
                </button>
                <button
                  onClick={() => handleDownloadPDF(invoice)}
                  className="text-xs sm:text-sm bg-green-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-green-600 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => handlePrint(invoice)}
                  className="text-xs sm:text-sm bg-purple-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-purple-600 transition-colors"
                >
                  Print
                </button>
                <button
                  onClick={() => setDeleteConfirmModal({ show: true, invoiceId: invoice._id })}
                  className="text-xs sm:text-sm bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-3 sm:mb-4">
              <div className="flex flex-col">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dayal General Store</h2>
                <p className="text-sm sm:text-base text-gray-600">Invoice Details</p>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div id="invoice-content">
              <div className="mb-3 sm:mb-4">
                <p className="text-sm sm:text-base font-semibold">Customer: {selectedInvoice.customerName || "No Name"}</p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full mb-3 sm:mb-4 text-xs sm:text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#3B82F6] text-white">
                      <th className="px-2 sm:px-4 py-2 text-left border border-[#2563EB]">Item</th>
                      <th className="px-2 sm:px-4 py-2 text-right border border-[#2563EB]">MRP</th>
                      <th className="px-2 sm:px-4 py-2 text-right border border-[#2563EB]">Qty</th>
                      <th className="px-2 sm:px-4 py-2 text-right border border-[#2563EB]">Price</th>
                      <th className="px-2 sm:px-4 py-2 text-right border border-[#2563EB]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="px-2 sm:px-4 py-2 border border-gray-200 font-medium">{item.name}</td>
                        <td className="px-2 sm:px-4 py-2 text-right border border-gray-200">
                          {item.mrp ? `₹${item.mrp}` : '-'}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-right border border-gray-200">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-right border border-gray-200">
                          ₹{item.price}
                          {item.isSpecialPrice && (
                            <span className="ml-1 text-xs text-purple-600">(Special)</span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 text-right border border-gray-200">
                          ₹{item.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan="4" className="px-2 sm:px-4 py-2 text-right font-bold border border-gray-200">
                        Total:
                      </td>
                      <td className="px-2 sm:px-4 py-2 text-right font-bold border border-gray-200">
                        ₹{selectedInvoice.items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
              <button
                onClick={() => handleDownloadPDF(selectedInvoice)}
                className="text-xs sm:text-sm bg-green-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-green-600 transition-colors"
              >
                Download PDF
              </button>
              <button
                onClick={() => handlePrint(selectedInvoice)}
                className="text-xs sm:text-sm bg-purple-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-purple-600 transition-colors"
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Confirm Delete</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">Are you sure you want to delete this invoice? This action cannot be undone.</p>
            <div className="flex flex-wrap justify-end gap-1 sm:gap-2">
              <button
                onClick={() => setDeleteConfirmModal({ show: false, invoiceId: null })}
                className="text-xs sm:text-sm bg-gray-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(deleteConfirmModal.invoiceId)}
                className="text-xs sm:text-sm bg-red-500 text-white px-2 sm:px-4 py-1 sm:py-2 rounded hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AllBills; 