export default {
  content: ["./src/**/*.{js,jsx,css}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#6366f1",
        secondary: "#10B981",
        danger: "#EF4444",
        dark: {
          bg: "#0f172a",
          card: "#1e293b",
          sidebar: "#1e1b4b",
          text: "#f1f5f9",
          muted: "#94a3b8"
        },
        light: {
          bg: "#f8fafc",
          card: "#ffffff",
          sidebar: "#1e1b4b",
          text: "#1e293b",
          muted: "#64748b"
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
      }
    }
  },
  plugins: []
};
