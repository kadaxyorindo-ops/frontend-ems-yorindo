import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex lg:w-[520px] xl:w-[560px] flex-shrink-0 flex-col justify-between bg-[#0c1b45] p-12 relative overflow-hidden">

        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Glow blob */}
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute top-1/3 -right-20 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
            <rect x="0" y="0" width="17" height="17" rx="3.5" fill="#e74c3c" />
            <rect x="21" y="0" width="17" height="17" rx="3.5" fill="#f39c12" />
            <rect x="0" y="21" width="17" height="17" rx="3.5" fill="#3498db" />
            <rect x="21" y="21" width="17" height="17" rx="3.5" fill="#2ecc71" />
          </svg>
          <div>
            <p className="text-white font-bold text-sm tracking-[0.22em]">YORINDO</p>
            <p className="text-blue-300/80 text-[10px] tracking-[0.35em]">COMMUNICATION</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-5 max-w-sm">
          <h1 className="text-[2.75rem] font-bold leading-[1.18] text-white">
            Orchestrate<br />Memorable<br />
            <span className="text-amber-400">Experiences.</span>
          </h1>
          <p className="text-blue-200/70 text-[15px] leading-relaxed">
            The premium architectural conductor for high-end event management.
            Structure your vision, layer your logistics, and deliver excellence.
          </p>
        </div>

        {/* Trust footer */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex -space-x-2.5">
            {(["bg-blue-400", "bg-indigo-400", "bg-violet-400"] as const).map(
              (color, i) => (
                <div
                  key={i}
                  className={`w-9 h-9 rounded-full ${color} border-2 border-white/20`}
                />
              )
            )}
          </div>
          <p className="text-blue-200/60 text-sm">
            Trusted by 500+ premium venues worldwide
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 bg-white">
        <div className="w-full max-w-[400px]">{children}</div>
      </div>
    </div>
  );
}
