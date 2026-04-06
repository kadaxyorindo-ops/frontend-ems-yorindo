import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-[screen] flex bg-background relative overflow-visible">
      
      {/* Isolated Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col w-full ">
        
        {/* Isolated Topbar Component */}
        <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto min-h-[500px] rounded-3xl p-6">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}
