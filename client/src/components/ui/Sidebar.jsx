import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import {
  XMarkIcon,
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useUser();
  const { current } = useTheme();
  const location = useLocation();

  // Navigation items configuration
  const navItems = {
    common: [
    ],
    admin: [
      { name: 'Dashboard', href: 'admin/dashboard', icon: HomeIcon, exact: true },
      { name: 'Benefits', href: 'admin/benefits', icon: ClipboardDocumentListIcon },
      { name: 'Requests', href: 'admin/requests', icon: ClipboardDocumentListIcon },
    ],
    employee: [
      { name: 'Dashboard', href: 'employee/dashboard', icon: HomeIcon, exact: true },
      { name: 'My Benefits', href: 'employee/benefits', icon: ClipboardDocumentListIcon },
      { name: 'My Requests', href: 'employee/requests', icon: ClipboardDocumentListIcon },
    ]
  };

  // Get items based on user role
  const getNavigationItems = () => {
    const items = [...navItems.common];
    if (user?.role === 'employer') {
      items.push(...navItems.admin);
    } else if (user?.role === 'employee') {
      items.push(...navItems.employee);
    }
    return items;
  };

  const navigation = getNavigationItems();

  const isActive = (href, exact = false) => {
    return exact 
      ? location.pathname === href
      : location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-64 overflow-y-auto bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between p-4">
              <span className={`text-lg font-semibold ${current.text.primary}`}>Menu</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-md text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <NavContent navigation={navigation} />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex grow flex-col gap-y-5 overflow-y-auto border-r ${current.border.primary} ${current.bg.secondary} px-6 pb-4`}>
          <NavContent navigation={navigation} />
        </div>
      </div>
    </>
  );

  function NavContent({ navigation }) {
    return (
      <div className="flex grow flex-col gap-y-5 px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 flex items-center justify-center rounded-lg bg-primary-600">
              <HomeIcon className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900 dark:text-white">
              Employee Benefits
            </span>
          </div>
        </div>
        
        <nav className="flex flex-1 flex-col">
          <ul className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm font-semibold ${
                        isActive(item.href, item.exact)
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary-400'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 ${
                          isActive(item.href, item.exact)
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400'
                        }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
            
            <li className="mt-auto">
              <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-primary-600 dark:text-primary-400 font-medium">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div>
                  <div className="font-medium">{user?.firstName} {user?.lastName}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role}
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    );
  }
};

export default Sidebar;