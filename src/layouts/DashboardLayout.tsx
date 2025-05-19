import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Menu } from "lucide-react";

const DashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Navbar sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        <Sidebar collapsed={sidebarCollapsed} toggle={toggleSidebar} />
        
        {/* Removed the standalone toggle button since it's now in the navbar */}
        
        <main className={`flex-1 p-4 md:p-6 transition-all duration-300 mt-20 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
