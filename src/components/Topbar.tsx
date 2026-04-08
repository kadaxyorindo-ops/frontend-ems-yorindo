import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_LABELS } from "@/lib/roles";

interface TopbarProps {
  onToggleSidebar: () => void;
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const userInitial = user?.name.trim().charAt(0).toUpperCase() ?? "U";

  return (
    <header className="h-20 bg-[#faf8ff]/10 shadow-sm backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 w-full max-w-md">
        {/* Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-[#eaedff] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
        </button>
      </div>
      
      <div className="flex items-center gap-4 ml-4 flex-shrink-0">
        <div className="hidden text-right md:block">
          <p className="text-sm font-semibold text-slate-700">
            {user?.name ?? "User"}
          </p>
          <p className="text-xs font-mono text-slate-400">
            {user?.role ? (ROLE_LABELS[user.role] ?? "EMS Staff") : "EMS Staff"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none">
            <div className="w-10 h-10 rounded-full bg-[#1a40a8] flex items-center justify-center text-white font-semibold text-sm hover:bg-[#162454] transition-colors cursor-pointer select-none">
              {userInitial}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background rounded-xl shadow-xl border-slate-100">
            <DropdownMenuItem className="cursor-default select-text text-slate-500 text-xs focus:bg-transparent">
              {user?.email ?? ""}
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
