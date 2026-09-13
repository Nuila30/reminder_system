import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

export function DashboardPage() {
  const navigate = useNavigate();

  const { user } = useAuth();

  return (
    <>
      <header>
        <div>
          <span>
            RESUMEN GENERAL
          </span>

          <h1>
            Hola, {user?.fullName}
          </h1>
        </div>

        <button
          type="button"
          className="new-document"
          onClick={() =>
            navigate("/documents/new")
          }
        >
          + Nuevo documento
        </button>
      </header>

      <section className="stats">
        <article>
          <span>Pendientes</span>
          <strong>0</strong>
        </article>

        <article>
          <span>Próximos</span>
          <strong>0</strong>
        </article>

        <article>
          <span>Vencidos</span>
          <strong>0</strong>
        </article>

        <article>
          <span>Críticos</span>
          <strong>0</strong>
        </article>
      </section>

      <section className="dashboard-panels">
        <article>
          <h2>
            Próximos recordatorios
          </h2>

          <div className="empty">
            No hay recordatorios programados.
          </div>
        </article>

        <article>
          <h2>
            Prioridades
          </h2>

          <div className="priorities">
            <p>
              Baja
              <strong>0</strong>
            </p>

            <p>
              Media
              <strong>0</strong>
            </p>

            <p>
              Alta
              <strong>0</strong>
            </p>

            <p>
              Crítica
              <strong>0</strong>
            </p>
          </div>
        </article>
      </section>
    </>
  );
}