import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import "./index.css";

import PublicDashboard from "./components/public/PublicDashboard";
import PrivateDashboard from "./components/private/PrivateDashboard";
import ProtectedRoute from "./components/ui/ProtectedRoute";
import { useAuthStore } from "./store/authStore";

function MacroRoute() {
  const { token } = useAuthStore();

  if (token) {
    return (
      <ProtectedRoute>
        <PrivateDashboard />
      </ProtectedRoute>
    );
  }

  return <PublicDashboard />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Rota macro: pública se não autenticado, privada se autenticado */}
        <Route path="/macro" element={<MacroRoute />} />

        {/* Rotas privadas (autenticadas) */}
        <Route
          path="/dashboards"
          element={
            <ProtectedRoute>
              <PrivateDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboards/:dashboardName"
          element={
            <ProtectedRoute>
              <PrivateDashboard />
            </ProtectedRoute>
          }
        />

        {/* Redireciona raiz para dashboard macro */}
        <Route path="/" element={<Navigate to="/macro" replace />} />

        {/* Catch-all: qualquer rota não existente vai para dashboard macro */}
        <Route path="*" element={<Navigate to="/macro" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
