import { useEffect, useState } from "react";
import api from "../services/api";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { useTheme } from "../context/ThemeContext";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

function Dashboard() {
  const { isDark, userData } = useTheme();
  const [parts, setParts] = useState([]);
  const [stockInData, setStockInData] = useState([]);
  const [stockOutData, setStockOutData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockStatus, stockIn, stockOut] = await Promise.all([
          api.get("/reports/stock-status"),
          api.get("/stockin"),
          api.get("/stockout"),
        ]);
        setParts(stockStatus.data);
        setStockInData(stockIn.data);
        setStockOutData(stockOut.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalQuantity = parts.reduce((a, b) => a + b.quantity, 0);
  const lowStockCount = parts.filter((p) => p.quantity < 5).length;
  const totalValue = parts.reduce((a, b) => a + (b.quantity * (b.unitPrice || 0)), 0);

  const chartColors = {
    primary: isDark ? '#6366f1' : '#4f46e5',
    secondary: isDark ? '#10B981' : '#059669',
    danger: isDark ? '#EF4444' : '#dc2626',
    text: isDark ? '#f1f5f9' : '#1e293b',
    grid: isDark ? '#334155' : '#e2e8f0',
  };

  const barData = {
    labels: parts.slice(0, 8).map((p) => p.name),
    datasets: [
      {
        label: "Stock Quantity",
        data: parts.slice(0, 8).map((p) => p.quantity),
        backgroundColor: isDark 
          ? 'rgba(99, 102, 241, 0.8)' 
          : 'rgba(79, 70, 229, 0.8)',
        borderColor: chartColors.primary,
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: chartColors.primary,
      },
    ],
  };

  const doughnutData = {
    labels: ["In Stock", "Low Stock", "Out of Stock"],
    datasets: [
      {
        data: [
          parts.filter((p) => p.quantity >= 10).length,
          parts.filter((p) => p.quantity > 0 && p.quantity < 10).length,
          parts.filter((p) => p.quantity === 0).length,
        ],
        backgroundColor: [
          isDark ? '#10B981' : '#059669',
          isDark ? '#F59E0B' : '#d97706',
          isDark ? '#EF4444' : '#dc2626',
        ],
        borderWidth: 0,
        hoverOffset: 10,
      },
    ],
  };

  const lineData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Stock In",
        data: [12, 19, 15, 25, 22, 30],
        borderColor: chartColors.secondary,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: "Stock Out",
        data: [8, 15, 10, 20, 18, 25],
        borderColor: chartColors.danger,
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Header with Stock Name */}
      <div className="mb-6">
        <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📊 Dashboard
        </h2>
        {userData?.stockName && (
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            📦 <span className="font-semibold text-primary">{userData.stockName}</span> - Stock Overview
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Spare Parts", value: parts.length, icon: "🔧", color: "primary", delay: 0 },
          { title: "Total Quantity", value: totalQuantity, icon: "📦", color: "secondary", delay: 100 },
          { title: "Low Stock Alert", value: lowStockCount, icon: "⚠️", color: "danger", delay: 200 },
          { title: "Total Value", value: `$${totalValue.toLocaleString()}`, icon: "💰", color: "primary", delay: 300 },
        ].map((stat, index) => (
          <div
            key={stat.title}
            className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1
                        animate-slide-up border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}
            style={{ animationDelay: `${stat.delay}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold mt-1 ${
                  stat.color === 'primary' ? 'text-primary' :
                  stat.color === 'secondary' ? 'text-secondary' : 'text-danger'
                }`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl
                             bg-gradient-to-br ${
                               stat.color === 'primary' ? 'from-primary to-purple-600' :
                               stat.color === 'secondary' ? 'from-secondary to-emerald-600' :
                               'from-danger to-red-600'
                             } shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📊 Stock by Part
          </h3>
          <div className="h-72">
            <Bar data={barData} options={chartOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            🍩 Stock Status
          </h3>
          <div className="h-72 flex items-center justify-center">
            <Doughnut 
              data={doughnutData} 
              options={{
                ...chartOptions,
                scales: undefined,
              }} 
            />
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                      shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📈 Stock Movement Trend
        </h3>
        <div className="h-72">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Stock In */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📥 Recent Stock In
          </h3>
          <div className="space-y-3">
            {stockInData.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl 
                                          bg-gradient-to-r from-emerald-500/10 to-transparent">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {item.sparePart?.name || 'Unknown'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.stockInDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="badge-success">+{item.stockInQuantity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Stock Out */}
        <div className={`${isDark ? 'bg-dark-card' : 'bg-white'} rounded-2xl p-6 
                        shadow-lg border ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
            📤 Recent Stock Out
          </h3>
          <div className="space-y-3">
            {stockOutData.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl 
                                          bg-gradient-to-r from-red-500/10 to-transparent">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {item.sparePart?.name || 'Unknown'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(item.stockOutDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="badge-danger">-{item.stockOutQuantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
