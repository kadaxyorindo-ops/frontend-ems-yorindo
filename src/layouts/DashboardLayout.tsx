import { useState } from "react";
import type { ReactNode } from "react";
import { Sidebar } from "../components/Sidebar";
import { Topbar } from "../components/Topbar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      
      {/* Isolated Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        
        {/* Isolated Topbar Component */}
        <Topbar onToggleSidebar={() => setIsSidebarOpen(true)} />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto border-2 border-dashed border-slate-300 bg-white min-h-[500px] rounded-xl p-6 shadow-sm">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}