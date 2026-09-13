import {
  Navigate,
  Outlet
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

export function ProtectedRoute() {
  const {
    loading,
    isAuthenticated
  } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}