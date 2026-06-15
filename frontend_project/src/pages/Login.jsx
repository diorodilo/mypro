import { useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function Login() {
  const { isDark, toggleTheme, login } = useTheme();
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/login", form);
      
      if (res.data.token) {
        sessionStorage.setItem("token", res.data.token);
      }
      sessionStorage.setItem("auth", true);
      
      // Store user data
      const userData = {
        token: res.data.token,
        stockName: res.data.stockName,
        userId: res.data.userId
      };
      login(userData);
      
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data || "Invalid Credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-500
                    ${isDark 
                      ? 'bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900' 
                      : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'}`}>
      
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 backdrop-blur-sm 
                   hover:bg-white/20 transition-all duration-300 hover:rotate-180 z-10"
      >
        {isDark ? <span className="text-2xl">☀️</span> : <span className="text-2xl">🌙</span>}
      </button>

      <div className="relative w-full max-w-md p-8">
        {/* Login Card */}
        <div className={`${isDark ? 'bg-dark-card/90' : 'bg-white/90'} 
                        backdrop-blur-xl rounded-3xl shadow-2xl p-8 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'}
                        animate-slide-up`}>
          
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 
                          bg-gradient-to-br from-primary to-purple-600 rounded-2xl 
                          shadow-glow mb-4">
              <span className="text-4xl">📦</span>
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              SIMS
            </h1>
            <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Inventory Management System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl 
                          text-red-400 text-sm animate-shake">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                className={`input-field ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                className={`input-field ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 text-lg font-semibold relative overflow-hidden"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Signup Link */}
          <p className={`mt-6 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Don't have an account?{" "}
            <a 
              href="/signup" 
              className="text-primary font-semibold hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
