import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-black shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img src="/Hakum V2 (OW).png" alt="Hakum Auto Care" className="h-12" />
            </div>
            <nav className="flex space-x-4">
              <Link
                to="/"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/') 
                    ? 'text-white bg-blue-600' 
                    : 'text-gray-300 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Queue
              </Link>
              <Link
                to="/customer"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/customer')
                    ? 'text-white bg-blue-600'
                    : 'text-gray-300 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Customer View
              </Link>
              <Link
                to="/crew"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/crew')
                    ? 'text-white bg-blue-600'
                    : 'text-gray-300 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Crew
              </Link>
              <Link
                to="/services"
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive('/services')
                    ? 'text-white bg-blue-600'
                    : 'text-gray-300 hover:bg-blue-700 hover:text-white'
                }`}
              >
                Services
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-black border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Hakum Auto Care. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;