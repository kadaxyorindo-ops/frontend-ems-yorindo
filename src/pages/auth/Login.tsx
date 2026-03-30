// src/pages/auth/Login.tsx
import { AuthLayout } from "@/layouts/AuthLayout";
import { useNavigate } from "react-router-dom";

export function Login() {
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/events"); 
  };

  return (
    <AuthLayout>
      <div className="space-y-8 bg-white p-8 md:p-10 border-2 border-dashed border-slate-300 rounded-2xl shadow-sm">
        
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-800">Welcome back</h2>
          <p className="text-slate-500 font-mono text-sm">Access your event management dashboard.</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Email Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Professional Email</label>
            <div className="relative">
              <input 
                type="text"
                disabled
                placeholder="invalid-user@nexus.io" 
                className="w-full h-12 bg-slate-50 border border-dashed border-slate-300 rounded-lg pl-4 pr-10 text-slate-500 font-mono text-sm outline-none"
              />
              {/* Mail Icon Placeholder */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 border border-dashed border-slate-400 rounded-sm flex items-center justify-center">
                <span className="text-[10px] text-slate-400">✉</span>
              </div>
            </div>
          </div>
          
          {/* Send Code Button */}
          <button 
            type="button" 
            className="w-full h-12 bg-slate-200 border-2 border-dashed border-slate-400 text-slate-700 font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-slate-300 transition-colors"
          >
            Send Verification Code <span>→</span>
          </button>

          {/* Divider */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-slate-400 font-bold tracking-widest">Verification Required</span>
            </div>
          </div>

          {/* 6-Digit Code Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">6-Digit Code</label>
            <div className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-50 border border-dashed border-slate-300 rounded-lg flex items-center justify-center">
                   <span className="text-slate-300 font-mono text-xs">-</span>
                </div>
              ))}
            </div>
          </div>

          {/* Login Button (Disabled State) */}
          <button 
            type="submit" 
            className="w-full h-12 bg-slate-50 border border-dashed border-slate-200 text-slate-400 font-bold rounded-lg flex items-center justify-center gap-2"
          >
            Login <span>→</span>
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-sm font-mono text-slate-500 pt-2">
          Don't have an account? <span className="text-slate-700 font-bold border-b border-dashed border-slate-400 pb-0.5 cursor-pointer hover:text-slate-900 transition-colors">Contact admin</span>
        </div>
      </div>
    </AuthLayout>
  );
}