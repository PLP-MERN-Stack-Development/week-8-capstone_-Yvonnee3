import React, { useState } from 'react';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Bars3Icon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Header = ({ setSidebarOpen }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useUser();
  const { current, isDarkMode, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
  };

  return (
    <div className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b ${current.border.primary} ${current.bg.secondary} px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8`}>
      {/* Mobile menu button */}
      <button
        type="button"
        className={`-m-2.5 p-2.5 ${current.text.secondary} lg:hidden`}
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className={`h-6 w-px ${current.bg.primary} lg:hidden`} aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Theme toggle */}
          <button
            type="button"
            className={`-m-2.5 p-2.5 ${current.text.secondary} hover:${current.text.primary}`}
            onClick={toggleTheme}
          >
            <span className="sr-only">Toggle theme</span>
            {isDarkMode ? (
              <SunIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <MoonIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          {/* Separator */}
          <div className={`hidden lg:block lg:h-6 lg:w-px ${current.bg.primary}`} aria-hidden="true" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className={`-m-1.5 flex items-center p-1.5 ${current.text.secondary} hover:${current.text.primary}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <span className="sr-only">Open user menu</span>
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className={`ml-4 text-sm font-semibold leading-6 ${current.text.primary}`} aria-hidden="true">
                  {user?.firstName} {user?.lastName}
                </span>
              </span>
            </button>

            {/* Dropdown menu */}
            {userMenuOpen && (
              <div className={`absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md ${current.bg.secondary} py-2 shadow-lg ring-1 ${current.border.primary} ring-opacity-5 focus:outline-none`}>
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className={`text-sm font-medium ${current.text.primary}`}>
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className={`text-xs ${current.text.secondary} capitalize`}>
                    {user?.role?.replace('_', ' ')}
                  </p>
                  <p className={`text-xs ${current.text.secondary}`}>
                    {user?.email}
                  </p>
                </div>
                
                <button
                  onClick={handleLogout}
                  className={`flex w-full items-center px-4 py-2 text-sm ${current.text.secondary} hover:${current.text.primary} hover:${current.bg.hover}`}
                >
                  <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {userMenuOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setUserMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Header;
