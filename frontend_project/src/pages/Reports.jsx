import { useEffect, useState } from "react";
import api from "../services/api";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useTheme } from "../context/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function Reports() {
  const { isDark } = useTheme();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === 'daily' 
        ? "/reports/daily-stockout" 
        : "/reports/stock-status";
      const res = await api.get(endpoint);
      setData(res.data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    window.open(`${API_URL}/api/reports/daily-stockout-pdf`);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert("No data to export!");
      return;
    }

    const headers = ["Part Name", "Quantity", "Unit Price", "Total Value", "Date"];
    const rows = data.map(item => [
      item.sparePart?.name || 'Unknown',
      item.stockOutQuantity || 0,
      item.stockOutUnitPrice || 0,
      (item.stockOutQuantity || 0) * (item.stockOutUnitPrice || 0),
      item.stockOutDate ? new Date(item.stockOutDate).toLocaleDateString() : 'N/A'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `stock_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const chartColors = {
    primary: isDark ? '#6366f1' : '#4f46e5',
    secondary: isDark ? '#10B981' : '#059669',
    text: isDark ? '#f1f5f9' : '#1e293b',
    grid: isDark ? '#334155' : '#e2e8f0',
  };

  // Prepare chart data from stock out records
  const chartData = {
    labels: (data || []).slice(0, 8).map(item => item.sparePart?.name || 'Unknown'),
    datasets: [
      {
        label: "Stock Out Quantity",
        data: (data || []).slice(0, 8).map(item => item.stockOutQuantity || 0),
        backgroundColor: isDark 
          ? 'rgba(239, 68, 68, 0.8)' 
          : 'rgba(220, 38, 38, 0.8)',
        borderColor: '#EF4444',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartColors.text,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: chartColors.text },
        grid: { color: chartColors.grid },
      },
      y: {
        ticks: { color: chartColors.text },
        grid: { color: chartColors.grid },
      },
    },
  };

  const totalQuantity = (data || []).reduce((acc, item) => acc + (item.stockOutQuantity || 0), 0);
  const totalValue = (data || []).reduce((acc, item) => acc + ((item.stockOutQuantity || 0) * (item.stockOutUnitPrice || 0)), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📈 Reports
          </h2>
          <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
            View and export inventory reports
          </p>
        </div>
        <button
          onClick={downloadPDF}
          className="btn-primary flex items-center gap-2"
        >
          <span>📄</span> PDF
        </button>
        <button
          onClick={exportToCSV}
          className="btn-success flex items-center gap-2"
        >
          <span>📊</span> CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Transactions
              </p>
              <p className={`text-3xl font-bold text-primary`}>
                {(data || []).length}
              </p>
            </div>
            <span className="text-4xl">📊</span>
          </div>
        </div>
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Quantity Out
              </p>
              <p className={`text-3xl font-bold text-danger`}>
                {totalQuantity}
              </p>
            </div>
            <span className="text-4xl">📦</span>
          </div>
        </div>
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Value
              </p>
              <p className={`text-3xl font-bold text-secondary`}>
                ${totalValue.toLocaleString()}
              </p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('daily')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'daily'
              ? 'bg-primary text-white shadow-glow'
              : isDark ? 'bg-dark-card text-gray-400 hover:text-white' : 'bg-white text-gray-600 hover:text-gray-800'
          }`}
        >
          Daily Report
        </button>
        <button
          onClick={() => setActiveTab('status')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'status'
              ? 'bg-primary text-white shadow-glow'
              : isDark ? 'bg-dark-card text-gray-400 hover:text-white' : 'bg-white text-gray-600 hover:text-gray-800'
          }`}
        >
          Stock Status
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📊 Stock Out Analysis
          </h3>
          <div className="h-72">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🍩 Distribution
          </h3>
          <div className="h-72 flex items-center justify-center">
            <Doughnut 
              data={{
                labels: (data || []).slice(0, 5).map(item => item.sparePart?.name || 'Unknown'),
                datasets: [{
                  data: (data || []).slice(0, 5).map(item => item.stockOutQuantity || 0),
                  backgroundColor: [
                    '#6366f1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'
                  ],
                  borderWidth: 0,
                }]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: chartColors.text }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl shadow-lg 
                      border ${isDark ? 'border-gray-700' : 'border-gray-100'} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className={`w-full ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead className={`${isDark ? 'bg-indigo-900' : 'bg-primary'} text-white`}>
              <tr>
                <th className="p-4 text-left">Part Name</th>
                <th className="p-4 text-left">Quantity</th>
                <th className="p-4 text-left">Unit Price</th>
                <th className="p-4 text-left">Total Value</th>
                <th className="p-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={item._id} className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}
                                            hover:bg-primary/5 transition-colors animate-fade-in`}
                    style={{ animationDelay: `${index * 50}ms` }}>
                  <td className="p-4 font-medium">{item.sparePart?.name || 'Unknown'}</td>
                  <td className="p-4">
                    <span className="badge-danger">{item.stockOutQuantity}</span>
                  </td>
                  <td className="p-4">${item.stockOutUnitPrice || 0}</td>
                  <td className="p-4 font-bold text-secondary">
                    ${((item.stockOutQuantity || 0) * (item.stockOutUnitPrice || 0)).toLocaleString()}
                  </td>
                  <td className="p-4">
                    {item.stockOutDate 
                      ? new Date(item.stockOutDate).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
