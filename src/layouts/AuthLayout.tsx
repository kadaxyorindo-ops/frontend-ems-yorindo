import type { ReactNode } from "react";

const BRAND_COLORS = ["#6B3FA0", "#2B5EAB", "#43B049", "#EA4C1B", "#F5A623"] as const;

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[520px] xl:w-[560px] flex-shrink-0 flex-col bg-[#08101e] px-14 py-12 relative overflow-hidden">

        {/* Left accent bar — brand colours */}
        <div className="absolute left-0 inset-y-0 w-[3px] flex flex-col">
          {BRAND_COLORS.map((c) => (
            <div key={c} className="flex-1" style={{ backgroundColor: c }} />
          ))}
        </div>

        {/* Glow blobs */}
        <div className="absolute -top-24 right-0 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-8 w-72 h-72 rounded-full bg-blue-700/10 blur-3xl pointer-events-none" />

        {/* Faded "EMS" watermark */}
        <div className="absolute right-[-20px] top-1/3 -translate-y-1/2 text-[220px] font-black text-white/[0.025] leading-none select-none pointer-events-none tracking-tighter">
          EMS
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="inline-flex bg-white rounded-2xl px-7 py-4 shadow-2xl shadow-black/50">
            <img
              src="/yorindo-logo.png"
              alt="Yorindo Communication"
              className="h-9 w-auto"
            />
          </div>
        </div>

        {/* Push hero down */}
        <div className="flex-[0.4]" />

        {/* Hero text */}
        <div className="relative z-10 space-y-5">
          <p className="text-[9px] font-bold uppercase tracking-[0.35em] text-slate-600">
            Dashboard Portal
          </p>
          <h1 className="text-[3.25rem] font-black leading-[1.1] tracking-tight text-white">
            Event<br />Management<br />
            <span className="text-amber-400">System.</span>
          </h1>
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-[300px]">
            A centralized platform for storing event data,
            and keeping your team aligned in one place.
          </p>
        </div>

        {/* Bottom row — pinned to bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-14 py-10 flex items-center gap-3">
          <div className="flex gap-1.5">
            {BRAND_COLORS.map((c) => (
              <div
                key={c}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-[10px] text-slate-700 font-mono tracking-widest">
            YORINDO EMS
          </span>
        </div>

      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
