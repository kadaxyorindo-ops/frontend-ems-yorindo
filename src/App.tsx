import type { ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import { Login } from "@/pages/auth/Login";
import { Events } from "@/pages/events/Events";
import { Users } from "@/pages/users/Users";
import { Communication } from "@/pages/communication/Communication";
import { CampaignHistory } from "@/pages/communication/CampaignHistory";
import { Settings } from "@/pages/settings/Settings";
import { NotFound } from "@/pages/NotFound";
import {Participants} from "@/components/Participant";
import { useAuth } from "@/hooks/useAuth";

function FullPageStatus({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-6 py-5 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
          Yorindo EMS
        </p>
        <p className="mt-3 text-sm font-mono text-slate-600">{label}</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <FullPageStatus label="Memuat sesi login..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function SuperAdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <FullPageStatus label="Memuat..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.role !== "super_admin") {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <FullPageStatus label="Menyiapkan halaman login..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <SuperAdminRoute>
              <Users />
            </SuperAdminRoute>
          }
        />
        <Route
          path="/communication"
          element={
            <ProtectedRoute>
              <Communication />
            </ProtectedRoute>
          }
        />
        <Route
          path="/communication/history"
          element={
            <ProtectedRoute>
              <CampaignHistory />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/participants"
          element={
            <ProtectedRoute>
              <Participants />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        
        {/* Catch-all route for undefined paths */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
