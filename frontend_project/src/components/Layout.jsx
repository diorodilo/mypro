import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useTheme } from "../context/ThemeContext";

function Layout({ children }) {
  const { isDark } = useTheme();

  return (
    <div className={`flex h-screen transition-colors duration-500 ${
      isDark ? 'bg-dark-bg' : 'bg-light-bg'
    }`}>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className={`flex-1 overflow-auto p-6 transition-colors duration-300 ${
          isDark ? 'bg-dark-bg' : 'bg-light-bg'
        }`}>
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
