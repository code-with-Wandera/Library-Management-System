import React, { useEffect, useState } from "react";
import API from "../api/api";
import { Search, Filter, Clock, User, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function AuditLogs() {
  // Initialize as empty array to prevent .filter errors before data arrives
  const [logs, setLogs] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await API.get("/audit-logs");
        
        // DEBUG FIX: Access res.data.logs because the backend sends an object, not a raw array
        if (res.data && Array.isArray(res.data.logs)) {
          setLogs(res.data.logs);
          setPagination(res.data.pagination);
        } else {
          // Fallback if backend structure changes
          setLogs([]);
        }
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setLogs([]); // Reset to empty array on error to prevent crash
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Filter logs safely check if logs is an array
  const filteredLogs = Array.isArray(logs) 
    ? logs.filter(log => 
        log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const getActionBadge = (action = "") => {
    const base = "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ";
    if (action.includes("DELETE")) return base + "bg-red-100 text-red-600 border border-red-200";
    if (action.includes("ISSUE") || action.includes("ADD")) return base + "bg-blue-100 text-blue-600 border border-blue-200";
    if (action.includes("RETURN")) return base + "bg-green-100 text-green-600 border border-green-200";
    return base + "bg-gray-100 text-gray-600 border border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Loading system logs...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">System Audit Trail</h2>
          <p className="text-sm text-gray-500">Monitor all library activities and security events.</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by action, resource, or details..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700">
          <Filter size={18} />
          <span>Advanced Filters</span>
        </button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff member</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className={getActionBadge(log.action)}>{log.action?.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 font-semibold">{log.resource}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-[250px] truncate" title={log.details}>
                        {log.details}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold text-[10px] border border-blue-100">
                          {log.userId?.firstName?.charAt(0) || <User size={12} />}
                        </div>
                        <span className="font-medium">{log.userId ? `${log.userId.firstName} ${log.userId.lastName}` : "System"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right whitespace-nowrap">
                      <div className="flex flex-col items-end">
                        <span className="text-gray-900 font-medium">{format(new Date(log.createdAt), "MMM d, yyyy")}</span>
                        <span className="text-[11px] text-gray-400 flex items-center">
                          <Clock size={10} className="mr-1" /> {format(new Date(log.createdAt), "h:mm a")}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle size={40} className="mb-2 opacity-20" />
                      <p className="text-lg font-medium">No activity logs found</p>
                      <p className="text-sm">Try adjusting your search terms.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
            <span>Showing Page {pagination.currentPage} of {pagination.totalPages}</span>
            <div className="flex space-x-2">
               <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50" disabled={pagination.currentPage === 1}>Previous</button>
               <button className="px-3 py-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50" disabled={pagination.currentPage === pagination.totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}