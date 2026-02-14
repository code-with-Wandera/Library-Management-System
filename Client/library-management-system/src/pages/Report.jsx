import React, { useEffect, useState } from "react";
import API from "../api/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { TrendingUp, BookOpen, AlertCircle, DollarSign, Download } from "lucide-react";

export default function Reports() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        const res = await API.get("/reports/circulation");
        const formatted = formatChartData(res.data.data);
        setData(formatted);
      } catch (err) {
        console.error("Error fetching reports:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []);

  const formatChartData = (raw) => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const map = {};
    
    raw.forEach(item => {
      const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
      if (!map[label]) map[label] = { name: label, issued: 0, returned: 0 };
      if (item._id.status === 'issued') map[label].issued = item.count;
      if (item._id.status === 'returned') map[label].returned = item.count;
    });
    
    return Object.values(map);
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Month", "Books Issued", "Books Returned"];
    const tableRows = [];

    data.forEach(item => {
      const rowData = [item.name, item.issued, item.returned];
      tableRows.push(rowData);
    });

    // Styling the PDF
    doc.setFontSize(18);
    doc.text("Library Circulation Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`Library_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) return <div className="p-6 text-gray-500 font-medium">Calculating analytics...</div>;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Analytics & Reports</h2>
          <p className="text-gray-500 text-sm">Monitor library performance and circulation trends.</p>
        </div>
        <button 
          onClick={downloadPDF}
          className="flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-sm font-medium w-full md:w-auto"
        >
          <Download size={18} />
          <span>Download PDF Report</span>
        </button>
      </div>

      {/* 1. Header Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Circulation Rate" 
          value="+12%" 
          icon={<TrendingUp className="text-blue-600" />} 
          color="bg-blue-50" 
        />
        <StatCard 
          title="Books Issued" 
          value={data.reduce((acc, curr) => acc + curr.issued, 0)} 
          icon={<BookOpen className="text-green-600" />} 
          color="bg-green-50" 
        />
        <StatCard 
          title="Overdue Returns" 
          value="8" 
          icon={<AlertCircle className="text-red-600" />} 
          color="bg-red-50" 
        />
        <StatCard 
          title="Fines Collected" 
          value="$142.50" 
          icon={<DollarSign className="text-yellow-600" />} 
          color="bg-yellow-50" 
        />
      </div>

      {/* 2. Main Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800">Issue vs. Return Trends</h3>
          <p className="text-sm text-gray-500">Monthly comparison of books checked out and returned.</p>
        </div>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 12}} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#9ca3af', fontSize: 12}} 
              />
              <Tooltip 
                cursor={{fill: '#f9fafb'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Bar dataKey="issued" fill="#3b82f6" name="Issued" radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="returned" fill="#10b981" name="Returned" radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 flex items-center space-x-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}