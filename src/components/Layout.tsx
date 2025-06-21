import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import ThemeSwitcher from './ThemeSwitcher';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { to: '/', label: 'Queue' },
    { to: '/customer', label: 'Customer View' },
    { to: '/crew', label: 'Crew' },
    { to: '/services', label: 'Services' },
  ];

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark text-text-primary-light dark:text-text-primary-dark">
      <header className="bg-surface-light dark:bg-surface-dark shadow-sm border-b border-border-light dark:border-border-dark sticky top-0 z-40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link to="/">
                <img src="/Hakum V2 (Blue).png" alt="Hakum Auto Care" className="h-10" />
              </Link>
              <span className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Hakum Auto Care</span>
            </div>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navLinks.map((link) => (
              <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(link.to)
                      ? 'text-white bg-brand-blue'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-brand-blue/10 hover:text-brand-blue'
                }`}
              >
                  {link.label}
              </Link>
              ))}
              <ThemeSwitcher />
            </nav>
            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeSwitcher />
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark shadow-lg">
            <nav className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navLinks.map((link) => (
              <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(link.to)
                      ? 'text-white bg-brand-blue'
                      : 'text-text-secondary-light dark:text-text-secondary-dark hover:bg-brand-blue/10 hover:text-brand-blue'
                }`}
              >
                  {link.label}
              </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      <footer className="bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            &copy; {new Date().getFullYear()} Hakum Auto Care. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;