import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left Panel - Branding Wireframe */}
      <div className="hidden lg:flex flex-col justify-between bg-slate-100 border-r-2 border-dashed border-slate-300 p-12 relative overflow-hidden">
        
        {/* Logo Area Placeholder */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-200 border-2 border-dashed border-slate-400 rounded-lg flex items-center justify-center">
             <span className="text-slate-400 text-xs font-mono">LOGO</span>
          </div>
          <div className="space-y-1">
            <div className="h-4 w-24 bg-slate-200 border border-dashed border-slate-300 rounded" />
            <div className="h-2 w-32 bg-slate-200 border border-dashed border-slate-300 rounded" />
          </div>
        </div>
        
        {/* Hero Text Area Placeholder */}
        <div className="space-y-6 max-w-md">
          <div className="space-y-3">
            <div className="h-12 w-full bg-slate-200 border border-dashed border-slate-300 rounded-md" />
            <div className="h-12 w-11/12 bg-slate-200 border border-dashed border-slate-300 rounded-md" />
            <div className="h-12 w-3/4 bg-slate-200 border border-dashed border-slate-300 rounded-md" />
          </div>
          
          <div className="space-y-2 pt-2">
            <div className="h-4 w-full bg-slate-200 border border-dashed border-slate-300 rounded" />
            <div className="h-4 w-11/12 bg-slate-200 border border-dashed border-slate-300 rounded" />
            <div className="h-4 w-4/5 bg-slate-200 border border-dashed border-slate-300 rounded" />
          </div>
        </div>

        {/* Footer / Trust Area Placeholder */}
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-mono">img</div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-mono">img</div>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-dashed border-slate-400 flex items-center justify-center text-[10px] text-slate-400 font-mono">img</div>
          </div>
          <div className="h-4 w-64 bg-slate-200 border border-dashed border-slate-300 rounded" />
        </div>
      </div>

      {/* Right Panel - Dynamic Content */}
      <div className="flex items-center justify-center p-8 sm:p-12">
        <div className="w-full max-w-[420px]">
          {children}
        </div>
      </div>
    </div>
  );
}