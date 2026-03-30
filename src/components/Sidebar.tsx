import { Link, useLocation } from "react-router-dom";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar Overlay */}
      <aside 
        className={`w-[260px] bg-white border-r-2 border-dashed border-slate-300 flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="h-20 border-b border-dashed border-slate-300 flex items-center justify-between px-6 relative">
          <span className="text-slate-400 font-mono">[Logo]</span>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-dashed border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
            title="Close Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link 
            to="/events" 
            onClick={onClose}
            className={`h-12 border border-dashed rounded-lg flex items-center px-4 font-mono text-sm transition-colors ${
              isActive('/events') 
                ? 'bg-slate-100 border-slate-400 text-slate-700' 
                : 'border-slate-300 text-slate-400 hover:bg-slate-50'
            }`}
          >
            [Nav: Events]
          </Link>
          <Link 
            to="/communication" 
            onClick={onClose}
            className={`h-12 border border-dashed rounded-lg flex items-center px-4 font-mono text-sm transition-colors ${
              isActive('/communication') 
                ? 'bg-slate-100 border-slate-400 text-slate-700' 
                : 'border-slate-300 text-slate-400 hover:bg-slate-50'
            }`}
          >
            [Nav: Communication]
          </Link>
          <Link 
            to="/settings" 
            onClick={onClose}
            className={`h-12 border border-dashed rounded-lg flex items-center px-4 font-mono text-sm transition-colors ${
              isActive('/settings') 
                ? 'bg-slate-100 border-slate-400 text-slate-700' 
                : 'border-slate-300 text-slate-400 hover:bg-slate-50'
            }`}
          >
            [Nav: Settings]
          </Link>
        </nav>
      </aside>
    </>
  );
}