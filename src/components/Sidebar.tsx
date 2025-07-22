
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { 
  Users, LineChart, Settings, LayoutDashboard, 
  Target, BriefcaseBusiness, ChevronRight, Building,
  ChevronLeft, Home, BarChart2, PieChart, Sliders, UserCog
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  toggle: () => void;
}

interface SidebarLinkProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

const SidebarLink = ({ to, icon: Icon, label, active }: SidebarLinkProps) => (
  <Link
    to={to}
    className={cn(
      'flex items-center p-3 text-sm font-medium rounded-lg transition-all duration-200 group',
      'hover:bg-white/10 hover:shadow-sm',
      active 
        ? 'text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-md' 
        : 'text-gray-200 hover:text-white',
      'border-l-4',
      active ? 'border-white' : 'border-transparent hover:border-white/30'
    )}
  >
    <Icon className={cn(
      'w-5 h-5 transition-transform duration-200',
      active ? 'text-white' : 'text-gray-300 group-hover:text-white',
      'group-hover:scale-110'
    )} />
    <span className={cn(
      'ml-3 whitespace-nowrap overflow-hidden transition-all duration-200',
      active ? 'font-semibold' : 'font-medium',
      'transform group-hover:translate-x-1'
    )}>
      {label}
    </span>
  </Link>
);

const Sidebar = ({ collapsed, toggle }: SidebarProps) => {
  const location = useLocation();
  const pathname = location.pathname;
  const { t } = useTranslation();

  const adminNavItems = [
    { path: '/admin/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { path: '/admin/users', label: t('common.users'), icon: Users },
    { path: '/admin/agencies', label: t('common.agencies'), icon: Building },
    { path: '/admin/campaigns', label: t('common.campaigns'), icon: Target },
    { path: '/admin/analytics', label: t('common.analytics'), icon: LineChart },
    { path: '/admin/settings', label: t('common.settings'), icon: Settings },
  ];

  const advertiserNavItems = [
    { path: '/advertiser/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { path: '/advertiser/campaigns', label: t('common.campaigns'), icon: Target },
    { path: '/advertiser/analytics', label: t('common.analytics'), icon: LineChart },
    { path: '/advertiser/settings', label: t('common.settings'), icon: Settings },
  ];

  const agencyNavItems = [
    { path: '/agency/dashboard', label: t('common.dashboard'), icon: LayoutDashboard },
    { path: '/agency/details', label: t('common.agencyDetails'), icon: Building },
    { path: '/agency/campaigns', label: t('common.campaigns'), icon: Target },
    { path: '/agency/analytics', label: t('common.analytics'), icon: LineChart },
    { path: '/agency/settings', label: t('common.settings'), icon: Settings },
  ];

  let navItems = adminNavItems;
  if (pathname.startsWith('/advertiser')) {
    navItems = advertiserNavItems;
  } else if (pathname.startsWith('/agency')) {
    navItems = agencyNavItems;
  }

  return (
    <aside 
      id="logo-sidebar" 
      className={cn(
        "fixed top-0 left-0 z-40 h-screen pt-20 transition-all duration-300 ease-in-out",
        "bg-gradient-to-b from-blue-800 to-blue-900 text-white shadow-xl",
        "border-r border-blue-700/30 backdrop-blur-sm",
        collapsed ? "w-20" : "w-64"
      )}
      style={{
        backgroundImage: 'linear-gradient(rgba(30, 58, 138, 0.9), rgba(30, 58, 138, 0.95))',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="h-full px-3 pb-6 overflow-y-auto">
        {/* Logo row with toggle button */}
        <div className="absolute top-0 left-0 w-full flex justify-between items-center h-20 px-4 bg-blue-900/80 backdrop-blur-sm border-b border-blue-700/30">
          <div className="flex items-center gap-3">
            {collapsed ? (
              <Logo 
                size="medium" 
                withText={false} 
                variant="circle" 
                theme="dark" 
                className="flex items-center justify-center"
              />
            ) : (
              <Logo 
                size="medium" 
                withText={true} 
                variant="default" 
                theme="dark" 
                className="flex items-center justify-center"
              />
            )}
          </div>
          {/* Toggle Button */}
          <button 
            onClick={toggle}
            aria-label={collapsed ? t('sidebar.expandSidebar') : t('sidebar.collapseSidebar')}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              "text-white/70 hover:text-white hover:bg-white/10",
              "focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-blue-800"
            )}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
        {/* Navigation Menu */}
        <div className="mt-6 space-y-1">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.path}>
                {collapsed ? (
                  <Link 
                    to={item.path}
                    className={cn(
                      "flex justify-center items-center p-3 rounded-lg mx-1 my-1",
                      "transition-all duration-200",
                      pathname === item.path
                        ? "bg-white/10 text-white shadow-md"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    )}
                    data-tooltip={collapsed ? item.label : undefined}
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                ) : (
                  <SidebarLink 
                    to={item.path}
                    icon={item.icon}
                    label={item.label}
                    active={pathname === item.path}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Bottom spacer */}
        <div className="h-12"></div>
      </div>
    </aside>
  );
};

export default Sidebar;
