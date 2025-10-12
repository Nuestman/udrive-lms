import React, { ReactNode, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, X, User, Settings as SettingsIcon } from 'lucide-react';

// Layout component
interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen">
      {children}
    </div>
  );
};

// Header component
interface UserProfile {
  name: string;
  avatar: string;
  role: string;
}

interface HeaderProps {
  title: string;
  userProfile: UserProfile;
  onMenuToggle?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, userProfile, onMenuToggle, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleLabels = {
    super_admin: 'Super Admin',
    school_admin: 'School Admin',
    instructor: 'Instructor',
    student: 'Student'
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              aria-label="Toggle menu"
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <Menu size={24} />
            </button>
            <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
              <span className="text-primary-600 font-bold text-xl">{title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              aria-label="View notifications"
            >
              <Bell size={20} />
            </button>

            <div className="ml-3 relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center max-w-xs rounded-lg px-2 py-1 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                id="user-menu-button"
                aria-expanded={dropdownOpen ? "true" : "false"}
                aria-haspopup="true"
              >
                <img
                  className="h-8 w-8 rounded-full ring-2 ring-white"
                  src={userProfile.avatar}
                  alt={userProfile.name}
                />
                <div className="ml-3 hidden md:block text-left">
                  <div className="text-sm font-medium text-gray-700">{userProfile.name}</div>
                  <div className="text-xs text-gray-500">{roleLabels[userProfile.role] || userProfile.role}</div>
                </div>
                <ChevronDown size={16} className="ml-2 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 z-50">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                    <p className="text-xs text-gray-500 truncate">{roleLabels[userProfile.role]}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to={`/${userProfile.role === 'school_admin' ? 'school' : userProfile.role === 'super_admin' ? 'admin' : userProfile.role}/settings`}
                      className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <User size={16} className="mr-3 text-gray-400 group-hover:text-primary-600" />
                      My Profile
                    </Link>
                    <Link
                      to={`/${userProfile.role === 'school_admin' ? 'school' : userProfile.role === 'super_admin' ? 'admin' : userProfile.role}/settings`}
                      className="group flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <SettingsIcon size={16} className="mr-3 text-gray-400 group-hover:text-primary-600" />
                      Settings
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onLogout?.();
                      }}
                      className="group flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} className="mr-3 text-red-400 group-hover:text-red-600" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// Sidebar component
interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
  isActive?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, isOpen = true, onClose, onLogout }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75\" onClick={onClose}></div>
        </div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:block
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <span className="text-primary-600 font-bold text-xl">UDrive</span>
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                  item.isActive
                    ? 'bg-primary-50 text-primary-600 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary-600'
                }`}
                onClick={onClose}
              >
                <div className={`mr-3 transition-colors ${
                  item.isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600'
                }`}>
                  {item.icon}
                </div>
                {item.label}
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => {
                onClose?.();
                onLogout?.();
              }}
              className="group flex items-center w-full px-2 py-2 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={20} className="mr-3 text-gray-400 group-hover:text-red-600" />
              Sign out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

// Footer component
interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  companyName: string;
  links: FooterLink[];
}

export const Footer: React.FC<FooterProps> = ({ companyName, links }) => {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="px-4 py-3 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center">
        <div className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {companyName}. All rights reserved.
        </div>
        <div className="flex space-x-4 mt-2 sm:mt-0">
          {links.map((link, index) => (
            <a
              key={index}
              href={link.href}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};