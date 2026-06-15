import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function StockOut() {
  const { isDark } = useTheme();
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState({});
  const [stockOuts, setStockOuts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [partsRes, stockOutRes] = await Promise.all([
        api.get("/spareparts"),
        api.get("/stockout"),
      ]);
      setParts(partsRes.data || []);
      setStockOuts(stockOutRes.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
      setParts([]);
      setStockOuts([]);
    }
  };

  // Filter stock outs based on search and date filter
  const filteredStockOuts = useMemo(() => {
    return stockOuts.filter(item => {
      // Search filter
      const matchesSearch = 
        item.sparePart?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sparePart?.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Date filter
      let matchesDate = true;
      if (dateFilter !== "all") {
        const itemDate = new Date(item.stockOutDate);
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
  }, [stockOuts, searchQuery, dateFilter]);

  // Calculate totals
  const totals = useMemo(() => ({
    totalQuantity: filteredStockOuts.reduce((sum, item) => sum + (item.stockOutQuantity || 0), 0),
    totalValue: filteredStockOuts.reduce((sum, item) => sum + (item.stockOutTotalPrice || 0), 0)
  }), [filteredStockOuts]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.sparePart) return alert("Please select a spare part");
    if (!form.stockOutQuantity || form.stockOutQuantity <= 0) return alert("Please enter quantity");
    setIsLoading(true);

    try {
      await api.post("/stockout", {
        sparePart: form.sparePart,
        stockOutQuantity: Number(form.stockOutQuantity),
        stockOutUnitPrice: Number(form.stockOutUnitPrice),
        stockOutDate: form.stockOutDate || new Date()
      });

      await fetchData();
      setForm({});
      alert("✅ Stock Out Recorded Successfully!");
    } catch (err) {
      alert(err.response?.data || "Error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Open edit modal
  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      sparePart: item.sparePart?._id || item.sparePart,
      stockOutQuantity: item.stockOutQuantity,
      stockOutUnitPrice: item.stockOutUnitPrice,
      stockOutDate: item.stockOutDate ? new Date(item.stockOutDate).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  // Handle update submit
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsLoading(true);

    try {
      await api.put(`/stockout/${editingItem._id}`, {
        sparePart: form.sparePart,
        stockOutQuantity: Number(form.stockOutQuantity),
        stockOutUnitPrice: Number(form.stockOutUnitPrice),
        stockOutDate: form.stockOutDate || new Date()
      });

      await fetchData();
      setShowModal(false);
      setEditingItem(null);
      setForm({});
      alert("✅ Stock Out Updated Successfully!");
    } catch (err) {
      alert(err.response?.data || "Error updating stock out");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this stock out record? This will restore the quantity to the spare part.")) return;
    
    setIsLoading(true);
    try {
      await api.delete(`/stockout/${id}`);
      await fetchData();
      alert("✅ Stock Out Deleted Successfully!");
    } catch (err) {
      alert(err.response?.data || "Error deleting stock out");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPart = parts.find(p => p._id === form.sparePart);

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📤 Stock Out
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
          Record inventory leaving your warehouse
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
          <p className={`text-2xl font-bold text-primary`}>{filteredStockOuts.length}</p>
        </div>
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-xl p-4 shadow-lg 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Quantity</p>
          <p className={`text-2xl font-bold text-danger`}>{totals.totalQuantity}</p>
        </div>
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-xl p-4 shadow-lg 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Value</p>
          <p className={`text-2xl font-bold text-secondary`}>${totals.totalValue.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}
                        animate-slide-up`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Record Stock Out
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
                  <option key={p._id} value={p._id}>
                    {p.name} (Available: {p.quantity})
                  </option>
                ))}
              </select>
            </div>

            {selectedPart && (
              <div className={`p-3 rounded-xl ${isDark ? 'bg-indigo-900/30' : 'bg-indigo-50'}`}>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Available Stock: <span className="font-bold text-primary">{selectedPart.quantity}</span>
                </p>
              </div>
            )}

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Unit Price
              </label>
              <input 
                type="number" 
                placeholder="Enter unit price"
                className="input-field"
                value={form.stockOutUnitPrice || ''}
                onChange={e => setForm({ ...form, stockOutUnitPrice: e.target.value })} 
              />
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
                max={selectedPart?.quantity || 999}
                value={form.stockOutQuantity || ''}
                onChange={e => setForm({ ...form, stockOutQuantity: e.target.value })} 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-danger w-full"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  📤 Record Stock Out
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Stock Out Records */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Stock Out Records
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredStockOuts.map((item, index) => (
              <div 
                key={item._id} 
                className="flex items-center justify-between p-4 rounded-xl 
                           bg-gradient-to-r from-red-500/10 to-transparent
                           animate-slide-in hover:scale-[1.02] transition-transform"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                    📦
                  </div>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {item.sparePart?.name || 'Unknown'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.stockOutDate).toLocaleDateString()} | ${item.stockOutTotalPrice?.toLocaleString() || (item.stockOutQuantity * item.stockOutUnitPrice)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge-danger">-{item.stockOutQuantity}</span>
                  <button
                    onClick={() => handleEdit(item)}
                    className={`p-2 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                    }`}
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
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
            {filteredStockOuts.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                {searchQuery || dateFilter !== "all" ? "No records match your search" : "No stock out records yet"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              ✏️ Edit Stock Out
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
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
                    <option key={p._id} value={p._id}>
                      {p.name} (Available: {p.quantity})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Unit Price
                </label>
                <input 
                  type="number" 
                  className="input-field"
                  value={form.stockOutUnitPrice || ''}
                  onChange={e => setForm({ ...form, stockOutUnitPrice: e.target.value })} 
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Quantity
                </label>
                <input 
                  type="number" 
                  className="input-field"
                  min="1"
                  value={form.stockOutQuantity || ''}
                  onChange={e => setForm({ ...form, stockOutQuantity: e.target.value })} 
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </label>
                <input 
                  type="date" 
                  className="input-field"
                  value={form.stockOutDate || ''}
                  onChange={e => setForm({ ...form, stockOutDate: e.target.value })} 
                />
              </div>

              <div className="flex gap-3">
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                    setForm({});
                  }}
                  className={`px-6 py-3 rounded-xl font-medium transition-all ${
                    isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockOut;
