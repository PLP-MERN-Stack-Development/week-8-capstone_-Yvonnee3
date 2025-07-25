import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Theme configuration object following existing pattern
  const current = {
    bg: {
      primary: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
      secondary: isDarkMode ? 'bg-gray-800' : 'bg-white',
      card: isDarkMode ? 'bg-gray-800' : 'bg-white',
      hover: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100',
      active: isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
    },
    text: {
      primary: isDarkMode ? 'text-gray-100' : 'text-gray-900',
      secondary: isDarkMode ? 'text-gray-300' : 'text-gray-600',
      muted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
      accent: isDarkMode ? 'text-primary-400' : 'text-primary-600',
    },
    border: {
      primary: isDarkMode ? 'border-gray-700' : 'border-gray-200',
      secondary: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    },
    shadow: {
      sm: isDarkMode ? 'shadow-gray-900/20' : 'shadow-gray-900/10',
      md: isDarkMode ? 'shadow-gray-900/30' : 'shadow-gray-900/15',
      lg: isDarkMode ? 'shadow-gray-900/40' : 'shadow-gray-900/20',
    }
  };

  const value = {
    isDarkMode,
    toggleTheme,
    current
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
