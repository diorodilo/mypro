import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/sparepart", label: "Spare Parts", icon: "🔧" },
  { path: "/stockin", label: "Stock In", icon: "📥" },
  { path: "/stockout", label: "Stock Out", icon: "📤" },
  { path: "/reports", label: "Reports", icon: "📈" },
  { path: "/activity", label: "Activity", icon: "📋" },
];

function Sidebar() {
  const { isDark } = useTheme();
  const [hoveredItem, setHoveredItem] = useState(null);

  return (
    <aside 
      className={`w-72 ${isDark ? 'bg-dark-sidebar' : 'bg-indigo-900'} 
                  text-white p-5 flex flex-col transition-all duration-500 
                  shadow-2xl`}
    >
      {/* Logo Section */}
      <div className="mb-8 animate-slide-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 
                       bg-clip-text text-transparent">
          SIMS
        </h1>
        <p className="text-xs text-gray-400 mt-1">
          Inventory Management
        </p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            onMouseEnter={() => setHoveredItem(index)}
            onMouseLeave={() => setHoveredItem(null)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300
              ${isActive 
                ? 'bg-gradient-to-r from-primary to-purple-600 shadow-glow transform scale-105' 
                : hoveredItem === index 
                  ? 'bg-white/10 transform translate-x-2' 
                  : 'hover:bg-white/5'
              }
              animate-slide-up
            `}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
            {hoveredItem === index && !document.querySelector(`a[href="${item.path}"]`) && (
              <span className="ml-auto animate-pulse">→</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          © 2025 SIMS System
        </p>
      </div>
    </aside>
  );
}

export default Sidebar;
