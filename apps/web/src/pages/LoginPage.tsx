import {
  useEffect,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  useAuth
} from "../context/AuthContext";

import "../styles/login.css";

export function LoginPage() {
  const navigate = useNavigate();

  const {
    login,
    loading,
    isAuthenticated
  } = useAuth();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (
      !loading &&
      isAuthenticated
    ) {
      navigate(
        "/dashboard",
        {
          replace: true
        }
      );
    }
  }, [
    loading,
    isAuthenticated,
    navigate
  ]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError(
        "Ingresa tu correo."
      );

      return;
    }

    if (!password) {
      setError(
        "Ingresa tu contraseña."
      );

      return;
    }

    try {
      setSubmitting(true);

      await login({
        email: email.trim(),
        password
      });

      navigate(
        "/dashboard",
        {
          replace: true
        }
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión."
      );

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-left">
        <div className="login-brand">
          <span>
            REMINDER SYSTEM
          </span>

          <h1>
            Gestión de documentos
            y recordatorios
          </h1>

          <p>
            Controla fechas límite,
            prioridades y notificaciones
            desde un solo lugar.
          </p>
        </div>
      </section>

      <section className="login-right">
        <div className="login-card">
          <div className="login-logo">
            R
          </div>

          <h2>
            Iniciar sesión
          </h2>

          <p className="login-description">
            Ingresa tus credenciales
            para continuar.
          </p>

          <form
            onSubmit={handleSubmit}
          >
            <label>
              Correo electrónico

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="correo@empresa.com"
                autoComplete="email"
              />
            </label>

            <label>
              Contraseña

              <div className="password-wrapper">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Contraseña"
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >
                  {showPassword
                    ? "Ocultar"
                    : "Ver"}
                </button>
              </div>
            </label>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-submit"
              disabled={submitting}
            >
              {submitting
                ? "Ingresando..."
                : "Ingresar"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}