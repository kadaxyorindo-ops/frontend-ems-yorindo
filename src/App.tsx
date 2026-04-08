import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Login } from "@/pages/auth/Login";
import { Events } from "@/pages/events/Events";
import { Users } from "@/pages/users/Users";
import { Communication } from "@/pages/communication/Communication";
import { CampaignHistory } from "@/pages/communication/CampaignHistory";
import { Settings } from "@/pages/settings/Settings";
import { Surveys } from "@/pages/surveys/Surveys";
import { NotFound } from "@/pages/NotFound";
import { Forbidden } from "@/pages/Forbidden";
import { useAuth } from "@/hooks/useAuth";
import { usePermission } from "@/hooks/usePermission";
import { getHomePage } from "@/lib/auth";
import { Participants } from "@/pages/participant/Participants";
import { EventCheckInDesk } from "@/pages/checkin/EventCheckInDesk";

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
    return <FullPageStatus label="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/**
 * Route guard that checks both authentication and a feature permission.
 * Renders a 403 Forbidden page in place if the user lacks the permission —
 * the URL does not change, and no redirect loop is possible.
 */
function PermissionRoute({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { isAuthenticated, isInitializing } = useAuth();
  const hasPermission = usePermission(permission);

  if (isInitializing) {
    return <FullPageStatus label="Loading..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!hasPermission) {
    return <Forbidden />;
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
    return <Forbidden />;
  }

  return <>{children}</>;
}

function GuestRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <FullPageStatus label="Preparing login page..." />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getHomePage(user)} replace />;
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
            <PermissionRoute permission="events:view">
              <Events />
            </PermissionRoute>
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
            <PermissionRoute permission="communication:view">
              <Communication />
            </PermissionRoute>
          }
        />
        <Route
          path="/communication/history"
          element={
            <PermissionRoute permission="communication:view">
              <CampaignHistory />
            </PermissionRoute>
          }
        />
        <Route
          path="/surveys"
          element={
            <PermissionRoute permission="surveys:view">
              <Surveys />
            </PermissionRoute>
          }
        />
        <Route
          path="/participants"
          element={
            <PermissionRoute permission="registrations:view">
              <Participants />
            </PermissionRoute>
          }
        />
        <Route
          path="/events/:eventId/check-in"
          element={
            <PermissionRoute permission="registrations:checkin">
              <EventCheckInDesk />
            </PermissionRoute>
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
