import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";

function Navbar(){
  const { isDark, toggleTheme, userData, logout } = useTheme();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.get("/auth/logout");
      logout();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      logout();
      navigate("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return(
    <nav className={`${isDark ? 'bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900' : 'bg-gradient-to-r from-primary to-indigo-700'} 
                    text-white shadow-lg p-4 flex justify-between items-center transition-all duration-500`}>
      
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2">
          <span className="text-2xl animate-pulse-slow">🎯</span>
          <h1 className="text-xl font-bold tracking-wide">
            SIMS Inventory System
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Stock Name Display */}
        {userData?.stockName && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
            <span className="text-sm">📦</span>
            <span className="text-sm font-medium">{userData.stockName}</span>
          </div>
        )}

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 
                     hover:rotate-180 transform"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? (
            <span className="text-xl">☀️</span>
          ) : (
            <span className="text-xl">🌙</span>
          )}
        </button>

        {/* User Avatar */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/10">
          <span className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400 
                         flex items-center justify-center text-sm font-bold">
            {userData?.stockName ? userData.stockName.charAt(0).toUpperCase() : 'U'}
          </span>
          <span className="text-sm">Admin</span>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 
                     px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105
                     shadow-lg hover:shadow-red-500/30 flex items-center gap-2"
        >
          <span className={isLoggingOut ? "animate-spin" : ""}>🚪</span>
          {isLoggingOut ? "Logging out..." : "Logout"}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
