import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <header className="h-20 bg-white border-b-2 border-dashed border-slate-300 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-4 w-full max-w-md">
        {/* Hamburger Menu Button */}
        <button 
          onClick={onToggleSidebar}
          className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>

        <div className="w-full relative">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events or organizers..."
            className="w-full h-10 bg-slate-100 border border-dashed border-slate-300 rounded-lg px-4 text-sm font-mono outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
        <div className="w-8 h-8 hidden sm:flex rounded-full border border-dashed border-slate-300 items-center justify-center text-slate-400 font-mono text-xs cursor-help">?</div>
        
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-500 font-mono text-xs hover:bg-slate-300 transition-colors cursor-pointer">
              U
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}