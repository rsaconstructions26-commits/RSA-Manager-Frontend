import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ALLOW_CROSS_ROLE, extractRole, portalIdForRole, roleBelongsHere } from './portalSession.js';
import WrongPortalNotice from './components/common/WrongPortalNotice.jsx';
import Layout from './components/Layout/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './components/Dashboard/Dashboard.jsx';
import LabourPage from './components/Labour/LabourPage.jsx';
import CustomModulePage from './components/CustomModule/CustomModulePage.jsx';
// Item 12 (2026-09-15): Material Stock / Purchase Ledger + Clients, mirrored
// into the Manager portal with the exact same functionality as Admin.
import MaterialLedger from './components/MaterialLedger/MaterialLedger.jsx';
import StockView from './components/MaterialLedger/StockView.jsx';
// Item 11 (2026-09-15): back to its own standalone sidebar link (matching
// Admin's Clients link, which also sits outside Reports now).
import ClientsPage from './components/Clients/ClientsPage.jsx';

// Fixed 2026-09-16 - this portal previously had NO role logic anywhere: not
// here, not in AuthContext, not in Layout. It accepted any valid credential
// from the shared backend and rendered the Manager UI around it, so signing
// in with admin credentials (from the mobile app, a bookmark, or a stale
// tab) opened the Manager portal. That is the credential collapse between
// the two portals.
//
// Every authenticated route passes through here, so this is the one place
// the check belongs. Set VITE_ALLOW_CROSS_ROLE=true to restore the old
// permissive behaviour; off by default.
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loading">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const role = extractRole(user);
  if (!ALLOW_CROSS_ROLE && !roleBelongsHere(role)) {
    return <WrongPortalNotice role={role} belongsTo={portalIdForRole(role)} />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="labour" element={<LabourPage />} />
        <Route path="materials" element={<MaterialLedger />} />
        <Route path="stock" element={<StockView />} />
        <Route path="clients" element={<ClientsPage />} />
        {/* Any tab created in the Superadmin Portal's Module Builder that isn't
            one of the built-in screens above renders here, driven entirely by
            that module's field definitions - no code change needed per tab. */}
        <Route path="m/:moduleKey" element={<CustomModulePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
