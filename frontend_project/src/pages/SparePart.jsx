import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

function SparePart() {
  const { isDark } = useTheme();
  const [parts, setParts] = useState([]);
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingPart, setEditingPart] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchParts();
  }, []);

  const fetchParts = async () => {
    try {
      const res = await api.get("/spareparts");
      setParts(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching parts:", err);
      setError("Failed to load spare parts. Please try again.");
      setParts([]);
    }
  };

  // Filter parts based on search and filters
  const filteredParts = useMemo(() => {
    return parts.filter(part => {
      // Search filter
      const matchesSearch = part.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          part.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Status filter
      let matchesStatus = true;
      if (statusFilter === "in_stock") matchesStatus = part.quantity >= 10;
      else if (statusFilter === "low_stock") matchesStatus = part.quantity > 0 && part.quantity < 10;
      else if (statusFilter === "out_of_stock") matchesStatus = part.quantity === 0;
      
      // Category filter
      const matchesCategory = categoryFilter === "all" || part.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [parts, searchQuery, statusFilter, categoryFilter]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    const cats = [...new Set(parts.map(p => p.category).filter(Boolean))];
    return cats;
  }, [parts]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name) return alert("Name required");
    setIsLoading(true);
    try {
      await api.post("/spareparts", form);
      await fetchParts();
      setForm({});
      setShowForm(false);
    } catch (error) {
      alert("Error saving spare part");
    } finally {
      setIsLoading(false);
    }
  };

  const deletePart = async (id) => {
    if (!confirm("Are you sure you want to delete this part?")) return;
    try {
      await api.delete(`/spareparts/${id}`);
      fetchParts();
    } catch (error) {
      alert("Error deleting part");
    }
  };

  // Open edit modal
  const handleEdit = (part) => {
    setEditingPart(part);
    setForm({
      name: part.name,
      category: part.category,
      quantity: part.quantity,
      unitPrice: part.unitPrice
    });
    setShowEditModal(true);
  };

  // Handle update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPart) return;
    setIsLoading(true);
    try {
      await api.put(`/spareparts/${editingPart._id}`, form);
      await fetchParts();
      setShowEditModal(false);
      setEditingPart(null);
      setForm({});
    } catch (error) {
      alert("Error updating spare part");
    } finally {
      setIsLoading(false);
    }
  };

  // Get status counts for badges
  const statusCounts = useMemo(() => ({
    all: parts.length,
    in_stock: parts.filter(p => p.quantity >= 10).length,
    low_stock: parts.filter(p => p.quantity > 0 && p.quantity < 10).length,
    out_of_stock: parts.filter(p => p.quantity === 0).length
  }), [parts]);

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🔧 Spare Parts
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            Manage your inventory spare parts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          <span>{showForm ? '✕ Close' : '+ Add Part'}</span>
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
          {/* Search Input */}
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              type="text"
              placeholder="Search by name or category..."
              className="input-field pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Status Filter */}
          <select
            className="input-field md:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value="in_stock">In Stock ({statusCounts.in_stock})</option>
            <option value="low_stock">Low Stock ({statusCounts.low_stock})</option>
            <option value="out_of_stock">Out of Stock ({statusCounts.out_of_stock})</option>
          </select>

          {/* Category Filter */}
          {categories.length > 0 && (
            <select
              className="input-field md:w-48"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}
                        animate-slide-up`}>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            Add New Spare Part
          </h3>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Part Name" 
              className="input-field"
              value={form.name || ''}
              onChange={e => setForm({ ...form, name: e.target.value })} 
            />
            <input 
              placeholder="Category" 
              className="input-field"
              value={form.category || ''}
              onChange={e => setForm({ ...form, category: e.target.value })} 
            />
            <input 
              type="number" 
              placeholder="Unit Price"
              className="input-field"
              value={form.unitPrice || ''}
              onChange={e => setForm({ ...form, unitPrice: e.target.value })} 
            />
            <button 
              type="submit" 
              disabled={isLoading}
              className="btn-success md:col-span-3"
            >
              {isLoading ? 'Saving...' : 'Save Spare Part'}
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-lg 
                      border ${isDark ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className={`w-full ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead className={`${isDark ? 'bg-indigo-900' : 'bg-primary'} text-white`}>
              <tr>
                <th className="p-4 text-left">Part Name</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Quantity</th>
                <th className="p-4 text-left">Unit Price</th>
                <th className="p-4 text-left">Total Value</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParts.map((p, index) => (
                <tr key={p._id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}
                                            hover:bg-primary/5 transition-colors animate-fade-in`}
                    style={{ animationDelay: `${index * 30}ms` }}>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {p.category || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{p.quantity}</td>
                  <td className="p-4">${p.unitPrice || 0}</td>
                  <td className="p-4 font-semibold text-secondary">
                    ${((p.quantity || 0) * (p.unitPrice || 0)).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {p.quantity === 0 ? (
                      <span className="badge-danger">Out of Stock</span>
                    ) : p.quantity < 5 ? (
                      <span className="badge-warning">Low Stock</span>
                    ) : (
                      <span className="badge-success">In Stock</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(p)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-100 text-blue-600'
                        }`}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => deletePart(p._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-100 text-red-600'
                        }`}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredParts.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    {searchQuery || statusFilter !== "all" || categoryFilter !== "all" 
                      ? "No parts match your search criteria" 
                      : "No spare parts found. Add your first part!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Results count */}
        <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Showing {filteredParts.length} of {parts.length} spare parts
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 w-full max-w-md shadow-2xl animate-slide-up`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              ✏️ Edit Spare Part
            </h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Part Name
                </label>
                <input 
                  type="text"
                  className="input-field"
                  value={form.name || ''}
                  onChange={e => setForm({ ...form, name: e.target.value })} 
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category
                </label>
                <input 
                  type="text"
                  className="input-field"
                  value={form.category || ''}
                  onChange={e => setForm({ ...form, category: e.target.value })} 
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Unit Price
                </label>
                <input 
                  type="number"
                  className="input-field"
                  value={form.unitPrice || ''}
                  onChange={e => setForm({ ...form, unitPrice: e.target.value })} 
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
                    setShowEditModal(false);
                    setEditingPart(null);
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

export default SparePart;
