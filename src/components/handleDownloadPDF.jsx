import jsPDF from 'jspdf';
import 'jspdf-autotable';

const handleDownloadPDF = () => {
  const doc = new jsPDF();
  doc.text('Invoicely - Invoice', 14, 15);
  
  const tableColumn = ["Item", "Price/Unit", "Quantity", "Unit", "Total"];
  const tableRows = [];

  billItems.forEach(item => {
    const itemData = [
      item.name,
      `₹${item.price}`,
      item.quantity,
      item.unit,
      `₹${item.total.toFixed(2)}`
    ];
    tableRows.push(itemData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 25,
  });

  doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 14, doc.lastAutoTable.finalY + 10);
  doc.save(`invoice_${new Date().toISOString().slice(0,10)}.pdf`);
};
