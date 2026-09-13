import {
  useState
} from "react";

import {
  NavLink,
  Outlet,
  useLocation
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

import "../styles/dashboard.css";

export function DashboardLayout() {
  const {
    user,
    logout
  } =
    useAuth();

  const location =
    useLocation();

  const [
    sidebarOpen,
    setSidebarOpen
  ] =
    useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }

  async function handleLogout() {
    closeSidebar();

    await logout();
  }

  const navClass =
    ({
      isActive
    }: {
      isActive: boolean;
    }) =>
      isActive
        ? "sidebar-link active"
        : "sidebar-link";

  return (
    <div className="dashboard-layout">

      {/* OVERLAY MÓVIL */}

      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Cerrar menú"
          onClick={
            closeSidebar
          }
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={
          sidebarOpen
            ? "dashboard-sidebar open"
            : "dashboard-sidebar"
        }
      >

        <div className="sidebar-top">

          <div className="sidebar-brand">

            <div className="sidebar-logo">
              R
            </div>

            <div>
              <strong>
                Reminder
              </strong>

              <span>
                System
              </span>
            </div>

          </div>

          <button
            type="button"
            className="sidebar-mobile-close"
            aria-label="Cerrar menú"
            onClick={
              closeSidebar
            }
          >
            ×
          </button>

        </div>

        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className={
              navClass
            }
            onClick={
              closeSidebar
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/clients"
            className={
              navClass
            }
            onClick={
              closeSidebar
            }
          >
            Clientes
          </NavLink>

          <NavLink
            to="/documents"
            className={
              navClass
            }
            onClick={
              closeSidebar
            }
          >
            Documentos
          </NavLink>

          <NavLink
            to="/calendar"
            className={
              navClass
            }
            onClick={
              closeSidebar
            }
          >
            Calendario
          </NavLink>

          <NavLink
            to="/history"
            className={
              navClass
            }
            onClick={
              closeSidebar
            }
          >
            Historial
          </NavLink>

          {user?.role ===
            "ADMIN" && (

            <NavLink
              to="/users"
              className={
                navClass
              }
              onClick={
                closeSidebar
              }
            >
              Usuarios
            </NavLink>

          )}

        </nav>

        <div className="sidebar-user">

          <div className="sidebar-user-info">

            <strong>
              {
                user?.fullName ||
                "Usuario"
              }
            </strong>

            <span>
              {
                user?.role ||
                ""
              }
            </span>

          </div>

          <button
            type="button"
            className="sidebar-logout"
            onClick={
              handleLogout
            }
          >
            Cerrar sesión
          </button>

        </div>

      </aside>

      {/* CONTENIDO */}

      <div className="dashboard-content">

        {/* HEADER MÓVIL */}

        <div className="mobile-topbar">

          <button
            type="button"
            className="mobile-menu-button"
            aria-label="Abrir menú"
            onClick={() =>
              setSidebarOpen(
                true
              )
            }
          >
            ☰
          </button>

          <div className="mobile-brand">
            <div className="mobile-logo">
              R
            </div>

            <div>
              <strong>
                Reminder
              </strong>

              <span>
                {
                  location.pathname ===
                  "/dashboard"
                    ? "Dashboard"
                    : "System"
                }
              </span>
            </div>
          </div>

          <div className="mobile-user-initial">
            {user?.fullName
              ?.charAt(0)
              .toUpperCase() ||
              "U"}
          </div>

        </div>

        <main className="dashboard-main">
          <Outlet />
        </main>

      </div>

    </div>
  );
}