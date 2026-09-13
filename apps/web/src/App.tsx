import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./components/ProtectedRoute";

import { DashboardLayout } from "./layouts/DashboardLayout";

import { LoginPage } from "./pages/LoginPage";

import { DashboardPage } from "./pages/DashboardPage";

import { ClientsPage } from "./pages/ClientsPage";

import { DocumentsPage } from "./pages/DocumentsPage";

import { DocumentFormPage } from "./pages/DocumentFormPage";

import { CalendarPage } from "./pages/CalendarPage";

import { HistoryPage } from "./pages/HistoryPage";

import { UsersPage } from "./pages/UsersPage";

import { CasesPage } from "./pages/CasesPage";


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />

          <Route path="/clients/:clientId/cases" element={<CasesPage />} />

          <Route path="/documents" element={<DocumentsPage />} />

          <Route path="/documents/new" element={<DocumentFormPage />} />

          <Route
            path="/documents/:documentId/edit"
            element={<DocumentFormPage />}
          />

          <Route path="/calendar" element={<CalendarPage />} />

          <Route path="/history" element={<HistoryPage />} />

          <Route path="/users" element={<UsersPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
