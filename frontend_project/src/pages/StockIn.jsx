import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function StockIn() {
  const { isDark } = useTheme();
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState({});
  const [stockIns, setStockIns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partsRes, stockInRes] = await Promise.all([
        api.get("/spareparts"),
        api.get("/stockin"),
      ]);
      setParts(partsRes.data || []);
      setStockIns(stockInRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      setParts([]);
      setStockIns([]);
    }
  };

  // Filter stock ins based on search and date filter
  const filteredStockIns = useMemo(() => {
    return stockIns.filter(item => {
      // Search filter
      const matchesSearch = 
        item.sparePart?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sparePart?.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const itemDate = new Date(item.stockInDate);
        const today = new Date();
        
        if (dateFilter === "today") {
          matchesDate = itemDate.toDateString() === today.toDateString();
        } else if (dateFilter === "week") {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          matchesDate = itemDate >= weekAgo;
        } else if (dateFilter === "month") {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          matchesDate = itemDate >= monthAgo;
        }
      }
      
      return matchesSearch && matchesDate;
    });
  }, [stockIns, searchQuery, dateFilter]);

  // Calculate totals
  const totals = useMemo(() => ({
    totalQuantity: filteredStockIns.reduce((sum, item) => sum + (item.stockInQuantity || 0), 0),
    totalValue: filteredStockIns.reduce((sum, item) => sum + ((item.stockInQuantity || 0) * (item.stockInUnitPrice || 0)), 0)
  }), [filteredStockIns]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.sparePart) return alert("Please select a spare part");
    if (!form.stockInQuantity || form.stockInQuantity <= 0) return alert("Please enter quantity");
    setIsLoading(true);
    try {
      await api.post("/stockin", {
        ...form,
        stockInDate: new Date()
      });
      await fetchData();
      setForm({});
      alert("✅ Stock In Added Successfully!");
    } catch (error) {
      alert("Error adding stock");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteStockIn = async (id) => {
    if (!confirm("Are you sure you want to delete this stock in record?")) return;
    setIsLoading(true);
    try {
      await api.delete(`/stockin/${id}`);
      await fetchData();
      alert("✅ Stock In Deleted Successfully!");
    } catch (error) {
      alert("Error deleting stock in");
    } finally {
      setIsLoading(false);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📥 Stock In
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          Add new inventory to your warehouse
        </p>
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
              placeholder="Search by part name..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-xl p-4 shadow-lg 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Transactions</p>
          <p className={`text-2xl font-bold text-primary`}>{filteredStockIns.length}</p>
        </div>
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-xl p-4 shadow-lg 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Quantity</p>
          <p className={`text-2xl font-bold text-secondary`}>{totals.totalQuantity}</p>
        </div>
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-xl p-4 shadow-lg 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Value</p>
          <p className={`text-2xl font-bold text-emerald-500`}>${totals.totalValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}
                        animate-slide-up`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Add Stock
          </h3>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Select Spare Part
              </label>
              <select 
                className="input-field"
                value={form.sparePart || ''}
                onChange={e => setForm({ ...form, sparePart: e.target.value })}
              >
                <option value="">Choose a part...</option>
                {parts.map(p => (
                  <option key={p._id} value={p._id}>{p.name} (Stock: {p.quantity})</option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Quantity
              </label>
              <input 
                type="number" 
                placeholder="Enter quantity"
                className="input-field"
                min="1"
                value={form.stockInQuantity || ''}
                onChange={e => setForm({ ...form, stockInQuantity: e.target.value })} 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-success w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  📥 Add Stock
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Recent Stock Ins */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Stock In Records
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredStockIns.map((item, index) => (
              <div 
                key={item._id} 
                className="flex items-center justify-between p-4 rounded-xl 
                           bg-gradient-to-r from-emerald-500/10 to-transparent
                           animate-slide-in hover:scale-[1.02] transition-transform"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    📦
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {item.sparePart?.name || 'Unknown'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.stockInDate).toLocaleDateString()} | ${(item.stockInQuantity * (item.stockInUnitPrice || 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-success">+{item.stockInQuantity}</span>
                  <button
                    onClick={() => deleteStockIn(item._id)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                    }`}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
            {filteredStockIns.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {searchQuery || dateFilter !== "all" ? "No records match your search" : "No stock in records yet"}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StockIn;
