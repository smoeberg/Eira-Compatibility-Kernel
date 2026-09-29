import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { fetchAuthMe, getAdminKey, usesSessionAuth } from "./api/client";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NewTenantPage } from "./pages/NewTenantPage";
import { TenantDetailPage } from "./pages/TenantDetailPage";
import { IntegrationWorkspacePage } from "./pages/IntegrationWorkspacePage";
import { Layout } from "./Layout";

function RequireAuth({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "ok" | "denied">("loading");

  useEffect(() => {
    if (usesSessionAuth()) {
      fetchAuthMe()
        .then((me) => setState(me.authenticated ? "ok" : "denied"))
        .catch(() => setState("denied"));
      return;
    }
    setState(getAdminKey() ? "ok" : "denied");
  }, []);

  if (state === "loading") {
    return (
      <div className="page narrow">
        <p className="muted">Logger ind…</p>
      </div>
    );
  }
  if (state === "denied") {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tenants/new" element={<NewTenantPage />} />
        <Route path="/tenants/:id" element={<TenantDetailPage />} />
        <Route path="/tenants/:tenantId/integrations/:integrationId" element={<IntegrationWorkspacePage />} />
        <Route path="/runs/:runId" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
