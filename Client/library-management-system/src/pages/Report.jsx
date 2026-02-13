import { jsPDF } from "jspdf";
import "jspdf-autotable";
import API from "../api/api";

const downloadFineReport = async () => {
  try {
    const res = await API.get("/members/reports/fines");
    const { reportData, totalOutstanding, generatedAt } = res.data;

    const doc = new jsPDF();

    // 1. Add Header
    doc.setFontSize(20);
    doc.text("Outstanding Fines Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date(generatedAt).toLocaleString()}`, 14, 30);
    doc.text(`Total Outstanding: $${totalOutstanding.toFixed(2)}`, 14, 37);

    // 2. Add Table
    const tableColumn = ["Member ID", "Name", "Email", "Amount Owed"];
    const tableRows = reportData.map(m => [
      m.memberId || "N/A",
      `${m.firstName} ${m.lastName}`,
      m.email || "N/A",
      `$${m.totalFines.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Indigo color to match your UI
    });

    // 3. Save the PDF
    doc.save(`Fine_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    alert("Error generating report");
  }
};