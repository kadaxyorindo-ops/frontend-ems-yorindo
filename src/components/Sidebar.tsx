import { Link, useLocation } from "react-router-dom";
import {CalendarDays, FileClockIcon, Mail, Settings,User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

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
        className={`w-[260px] bg-sidebar flex flex-col fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="h-30 flex items-center justify-around px-6 relative">
          <span><img src="/yorindo-logo.png" alt="Yorindo Logo" className="w-40" /></span>
          {/* <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-sm border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors"
            title="Close Menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button> */}
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {/* Event */}
          {(user?.role === "super_admin" || user?.role === "admin" || user?.role === "event_operator") && (
            <Link
              to="/events"
              onClick={onClose}
              className={`h-12 font-semibold flex items-center px-4 font-mono text-sm transition-colors ${
                isActive('/events')
                  ? 'bg-[#eaedff] border-slate-400 text-[#002a85]'
                  : 'border-slate-300 text-slate-600 hover:bg-[#eaedff] hover:translate-x-1'
              }`}
            >
              <CalendarDays className={`mr-3 h-5 w-5 ${isActive('/events') ? 'text-[#002a85]' : ''}`} />
              Event List
            </Link>
          )}

          {/* Communication */}
          {(user?.role === "super_admin" || user?.role === "admin" || user?.role === "communication_operator") && (
            <>
              <Link
                to="/communication"
                onClick={onClose}
                className={`h-12 font-semibold flex items-center px-4 font-mono text-sm transition-colors ${
                  isActive('/communication')
                    ? 'bg-[#eaedff] border-slate-400 text-[#002a85]'
                    : 'text-slate-600 hover:bg-[#eaedff] hover:translate-x-1'
                }`}
              >
                <Mail className={`mr-3 h-5 w-5 ${isActive('/communication') ? 'text-[#002a85]' : ''}`} />
                Communication
              </Link>

              <Link
                to="/communication/history"
                onClick={onClose}
                className={`h-12 font-semibold flex items-center px-4 font-mono text-sm transition-colors ${
                  isActivePrefix('/communication/history')
                    ? 'bg-[#eaedff] border-slate-400 text-[#002a85]'
                    : 'text-slate-600 hover:bg-[#eaedff] hover:translate-x-1'
                }`}
              >
                <FileClockIcon className={`mr-3 h-5 w-5 ${isActivePrefix('/communication/history') ? 'text-[#002a85]' : ''}`} />
                Campaign History
              </Link>
            </>
          )}

          {/* Users */}
          {user?.role === "super_admin" && (
            <Link
              to="/users"
              onClick={onClose}
              className={`h-12 font-semibold flex items-center px-4 font-mono text-sm transition-colors ${
                isActive('/users')
                  ? 'bg-[#eaedff] border-slate-400 text-[#002a85]'
                  : 'text-slate-600 hover:bg-[#eaedff] hover:translate-x-1'
              }`}
            >
              <User className={`mr-3 h-5 w-5 ${isActive('/users') ? 'text-[#002a85]' : ''}`} />
              Users
            </Link>
          )}

          {/* Settings */}
          <Link
            to="/settings"
            onClick={onClose}
            className={`h-12 font-semibold flex items-center px-4 font-mono text-sm transition-colors ${
              isActive('/settings')
                ? 'bg-[#eaedff] border-slate-400 text-[#002a85]'
                : 'text-slate-600 hover:bg-[#eaedff] hover:translate-x-1'
            }`}
          >
            <Settings className={`mr-3 h-5 w-5 ${isActive('/settings') ? 'text-[#002a85]' : ''}`} />
            Settings
          </Link>
        </nav>
      </aside>
    </>
  );
}
