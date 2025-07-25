import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import Sidebar from './ui/Sidebar';
import Header from './ui/Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated } = useUser();
  const { current } = useTheme();

  if (!isAuthenticated) {
    return children;
  }

  return (
    <div className={`min-h-screen ${current.bg.primary}`}>
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header setSidebarOpen={setSidebarOpen} />

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
