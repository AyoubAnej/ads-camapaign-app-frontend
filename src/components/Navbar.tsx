import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Update import path
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { languages, getInitials } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { 
  User, Settings, LogOut, Bell, Menu, X, Sun, Moon, Globe, 
  PanelLeft, PanelRightClose,
  Languages
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  sidebarCollapsed?: boolean;
  toggleSidebar?: () => void;
}

const Navbar = ({ sidebarCollapsed, toggleSidebar }: NavbarProps) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Create a display name from firstName and lastName
  const getUserInitials = () => {
    if (user && user.firstName && user.lastName) {
      // Ensure we have both first and last name before trying to get initials
      return getInitials(`${user.firstName} ${user.lastName}`);
    } else if (user && user.email) {
      // Fallback to first letter of email if name is not available
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Determine the appropriate settings path based on user role
  const getSettingsPath = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return '/admin/settings';
    } else if (path.startsWith('/advertiser')) {
      return '/advertiser/settings';
    } else if (path.startsWith('/agency')) {
      return '/agency/settings';
    }
    return '/settings';
  };

  // Determine the appropriate profile path based on user role
  const getProfilePath = () => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      return '/admin/profile';
    } else if (path.startsWith('/advertiser')) {
      return '/advertiser/profile';
    } else if (path.startsWith('/agency')) {
      return '/agency/profile';
    }
    return '/profile';
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 fixed top-0 left-0 right-0 z-10">
      <div className="flex flex-wrap justify-between items-center">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            data-drawer-target="logo-sidebar"
            data-drawer-toggle="logo-sidebar"
            aria-controls="logo-sidebar"
            type="button"
            className="p-2 mr-2 text-gray-600 dark:text-gray-300 rounded-lg md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
            onClick={toggleMobileMenu}
          >
            <span className="sr-only">Open sidebar</span>
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
          
          {/* Desktop sidebar toggle button */}
          {toggleSidebar && (
            <button
              type="button"
              className="hidden md:flex p-2 mr-3 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
            >
              {sidebarCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelRightClose className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <Languages className="w-5 h-5" />
                <span className="sr-only">Change language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('language.selectLanguage', 'Select Language')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {languages.map((lang) => (
                <DropdownMenuItem 
                  key={lang.code}
                  className={`cursor-pointer ${language === lang.code ? 'font-bold' : ''}`}
                  onClick={() => {
                    setLanguage(lang.code as 'en' | 'fr');
                    i18n.changeLanguage(lang.code);
                  }}
                >
                  {lang.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
          
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <Bell className="w-5 h-5" />
            <span className="sr-only">View notifications</span>
          </Button>
          
          {/* User menu */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button className="h-8 w-8 p-0 rounded-full overflow-hidden bg-gray-800 dark:bg-gray-600">
                <span className="sr-only">Open user menu</span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/avatar-placeholder.png" alt="User avatar" />
                  <AvatarFallback className="bg-blue-700 text-white">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56" sideOffset={5}>
              <DropdownMenuLabel>{t('navbar.myAccount', 'My Account')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link to={getProfilePath()} className="w-full">
                <DropdownMenuItem className="flex gap-2 items-center cursor-pointer">
                  <User className="h-4 w-4" />
                  <span>{t('navbar.profile', 'Profile')}</span>
                </DropdownMenuItem>
              </Link>
              <Link to={getSettingsPath()} className="w-full">
                <DropdownMenuItem className="flex gap-2 items-center cursor-pointer">
                  <Settings className="h-4 w-4" />
                  <span>{t('common.settings')}</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout}
                className="flex gap-2 items-center text-red-600 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('navbar.signOut', 'Sign out')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
