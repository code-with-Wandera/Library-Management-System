
import React, { useEffect, useState } from "react";
import API from "../api/api";
import { Search, Filter, Clock, User } from "lucide-react";
import { format } from "date-fns"; // Recommended for clean timestamps

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/audit-logs");
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filter logs based on search term (Action or Resource)
  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action) => {
    const base = "px-2 py-1 rounded-full text-xs font-bold uppercase ";
    if (action.includes("DELETE")) return base + "bg-red-100 text-red-600";
    if (action.includes("ISSUE") || action.includes("CREATE")) return base + "bg-blue-100 text-blue-600";
    if (action.includes("PAY")) return base + "bg-green-100 text-green-600";
    return base + "bg-gray-100 text-gray-600";
  };

  if (loading) return <div className="p-6 text-gray-500">Loading system logs...</div>;

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search actions or resources..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
          <Filter size={18} />
          <span>Filters</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Action</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Resource</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Details</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600">Performed By</th>
              <th className="px-6 py-4 text-sm font-semibold text-gray-600 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={getActionBadge(log.action)}>{log.action.replace("_", " ")}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 font-medium">{log.resource}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{log.details}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <User size={12} className="text-gray-500" />
                      </div>
                      <span>{log.userId?.name || "Admin"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-1">
                      <Clock size={14} />
                      <span>{format(new Date(log.createdAt), "MMM d, h:mm a")}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-12 text-center text-gray-500">No logs found matching your criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}