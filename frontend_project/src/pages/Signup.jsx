import { useState } from "react";
import api from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

function Signup(){
  const { isDark, toggleTheme } = useTheme();
  const [form, setForm] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    if (!form.username || !form.password || !form.stockName) {
      setError("All fields are required");
      return false;
    }
    if (form.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (form.password.length < 4) {
      setError("Password must be at least 4 characters");
      return false;
    }
    if (form.stockName.length < 2) {
      setError("Stock name must be at least 2 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const signup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/signup", {
        username: form.username,
        password: form.password,
        stockName: form.stockName
      });
      
      if (res.data.message) {
        alert("✅ Account created successfully! Please login.");
        navigate("/");
      }
    } catch (err) {
      setError(err.response?.data || "Signup failed. Please try again.");
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
        {/* Signup Card */}
        <div className={`${isDark ? 'bg-dark-card/90' : 'bg-white/90'} 
                        backdrop-blur-xl rounded-3xl shadow-2xl p-8 
                        border ${isDark ? 'border-gray-700' : 'border-gray-100'}
                        animate-slide-up`}>
          
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 
                          bg-gradient-to-br from-primary to-purple-600 rounded-2xl 
                          shadow-glow mb-3">
              <span className="text-3xl">📦</span>
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Create Account
            </h1>
            <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Join SIMS Inventory System
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl 
                          text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={signup} className="space-y-3">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Stock/Company Name *
              </label>
              <input
                type="text"
                placeholder="e.g., ABC Motors Ltd."
                className={`input-field ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}
                value={form.stockName || ''}
                onChange={(e) => setForm({ ...form, stockName: e.target.value })}
                required
              />
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                This will be displayed as your stock name
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Username *
              </label>
              <input
                type="text"
                placeholder="Choose a username"
                className={`input-field ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}
                value={form.username || ''}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Password *
              </label>
              <input
                type="password"
                placeholder="Create a password (min 4 chars)"
                className={`input-field ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}
                value={form.password || ''}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password *
              </label>
              <input
                type="password"
                placeholder="Confirm your password"
                className={`input-field ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}
                value={form.confirmPassword || ''}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 text-base font-semibold"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></span>
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className={`mt-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Already have an account?{" "}
            <Link 
              to="/" 
              className="text-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
