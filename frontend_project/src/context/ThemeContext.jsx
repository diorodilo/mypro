import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  const [userData, setUserData] = useState(() => {
    const saved = sessionStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    const root = document.body;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const login = (data) => {
    setUserData(data);
    sessionStorage.setItem('userData', JSON.stringify(data));
  };

  const logout = () => {
    setUserData(null);
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('auth');
  };

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      toggleTheme, 
      userData, 
      login, 
      logout 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
