import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function ActivityLog() {
  const { isDark } = useTheme();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/activity?limit=100");
      setLogs(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Failed to load activity logs.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      const matchesSearch = log.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Action filter
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const logDate = new Date(log.createdAt);
        const today = new Date();
        
        if (dateFilter === "today") {
          matchesDate = logDate.toDateString() === today.toDateString();
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = logDate >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = logDate >= monthAgo;
        }
      }
      
      return matchesSearch && matchesAction && matchesDate;
    });
  }, [logs, searchQuery, actionFilter, dateFilter]);

  // Get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE': return '➕';
      case 'UPDATE': return '✏️';
      case 'DELETE': return '🗑️';
      case 'LOGIN': return '🔑';
      case 'LOGOUT': return '🚪';
      case 'STOCK_IN': return '📥';
      case 'STOCK_OUT': return '📤';
      default: return '📋';
    }
  };

  // Get action color
  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE': return 'text-green-500';
      case 'UPDATE': return 'text-blue-500';
      case 'DELETE': return 'text-red-500';
      case 'LOGIN': return 'text-purple-500';
      case 'LOGOUT': return 'text-gray-500';
      case 'STOCK_IN': return 'text-emerald-500';
      case 'STOCK_OUT': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  // Get action badge color
  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE': return 'badge-success';
      case 'UPDATE': return 'bg-blue-100 text-blue-800';
      case 'DELETE': return 'badge-danger';
      case 'LOGIN': return 'bg-purple-100 text-purple-800';
      case 'LOGOUT': return 'bg-gray-100 text-gray-800';
      case 'STOCK_IN': return 'badge-success';
      case 'STOCK_OUT': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Format timestamp
  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleString();
  };

  // Get relative time
  const getRelativeTime = (date) => {
    const now = new Date();
    const d = new Date(date);
    const diff = now - d;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatTime(date);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📋 Activity Log
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            Track all system activities and changes
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="btn-primary flex items-center gap-2"
        >
          <span>🔄</span> Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'}`}>
          {error}
        </div>
      )}

      {/* Search and Filters */}
      <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-4 
                      shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search activities..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select
            className="input-field md:w-48"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="STOCK_IN">Stock In</option>
            <option value="STOCK_OUT">Stock Out</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>

          <select
            className="input-field md:w-48"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['CREATE', 'UPDATE', 'DELETE', 'STOCK_OUT'].map(action => (
          <div key={action} className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-xl p-4 shadow-lg 
                          border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{getActionIcon(action)}</span>
              <div>
                <p className={`text-2xl font-bold ${getActionColor(action)}`}>
                  {logs.filter(l => l.action === action).length}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{action}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
        </div>
      ) : (
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-lg 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}>
          <div className="divide-y divide-gray-700">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, index) => (
                <div 
                  key={log._id} 
                  className={`p-4 hover:bg-primary/5 transition-colors animate-fade-in`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg
                                  ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      {getActionIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {log.description}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
                        {log.entityType} • {getRelativeTime(log.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                {searchQuery || actionFilter !== "all" || dateFilter !== "all"
                  ? "No activities match your filters"
                  : "No activity logs yet. Start using the system to see activities here."}
              </div>
            )}
          </div>
          
          {/* Results count */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Showing {filteredLogs.length} of {logs.length} activities
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityLog;
