import {
  useCallback,
  useEffect,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  changeUserStatus,
  createUser,
  getUsers,
  resetUserPassword,
  updateUser
} from "../services/users";

import type {
  SystemUser,
  UserRole,
  UserStats
} from "../types/user";

import {
  useAuth
} from "../context/AuthContext";

import "../styles/users.css";

const roleLabels:
  Record<
    UserRole,
    string
  > = {
    ADMIN:
      "Administrador",

    SUPERVISOR:
      "Supervisor",

    EMPLOYEE:
      "Empleado",

    READ_ONLY:
      "Solo lectura"
  };

export function UsersPage() {
  const {
    user: currentUser
  } =
    useAuth();

  const [
    users,
    setUsers
  ] =
    useState<
      SystemUser[]
    >([]);

  const [
    stats,
    setStats
  ] =
    useState<UserStats>({
      total: 0,
      active: 0,
      inactive: 0,
      admins: 0
    });

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [
    error,
    setError
  ] =
    useState("");

  const [
    success,
    setSuccess
  ] =
    useState("");

  /* =====================================================
     FILTROS
  ===================================================== */

  const [
    search,
    setSearch
  ] =
    useState("");

  const [
    roleFilter,
    setRoleFilter
  ] =
    useState("ALL");

  const [
    statusFilter,
    setStatusFilter
  ] =
    useState("ALL");

  /* =====================================================
     MODAL
  ===================================================== */

  const [
    modalOpen,
    setModalOpen
  ] =
    useState(false);

  const [
    editingUser,
    setEditingUser
  ] =
    useState<
      SystemUser | null
    >(null);

  const [
    fullName,
    setFullName
  ] =
    useState("");

  const [
    email,
    setEmail
  ] =
    useState("");

  const [
    role,
    setRole
  ] =
    useState<UserRole>(
      "EMPLOYEE"
    );

  const [
    password,
    setPassword
  ] =
    useState("");

  const [
    showPassword,
    setShowPassword
  ] =
    useState(false);

  const [
    mustChangePassword,
    setMustChangePassword
  ] =
    useState(true);

  const [
    saving,
    setSaving
  ] =
    useState(false);

  /* =====================================================
     RESET PASSWORD
  ===================================================== */

  const [
    passwordModalOpen,
    setPasswordModalOpen
  ] =
    useState(false);

  const [
    passwordUser,
    setPasswordUser
  ] =
    useState<
      SystemUser | null
    >(null);

  const [
    newPassword,
    setNewPassword
  ] =
    useState("");

  /* =====================================================
     CARGAR USUARIOS
  ===================================================== */

  const loadUsers =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const response =
            await getUsers({
              search,
              role:
                roleFilter,
              status:
                statusFilter
            });

          setUsers(
            response.data
          );

          setStats(
            response.stats
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los usuarios"
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        search,
        roleFilter,
        statusFilter
      ]
    );

  useEffect(
    () => {
      const timer =
        window.setTimeout(
          () => {
            void loadUsers();
          },
          250
        );

      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      loadUsers
    ]
  );

  /* =====================================================
     FORMULARIO
  ===================================================== */

  function resetForm() {
    setEditingUser(
      null
    );

    setFullName(
      ""
    );

    setEmail(
      ""
    );

    setRole(
      "EMPLOYEE"
    );

    setPassword(
      ""
    );

    setShowPassword(
      false
    );

    setMustChangePassword(
      true
    );
  }

  function openCreateModal() {
    resetForm();

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setModalOpen(
      true
    );
  }

  function openEditModal(
    user:
      SystemUser
  ) {
    setEditingUser(
      user
    );

    setFullName(
      user.full_name
    );

    setEmail(
      user.email
    );

    setRole(
      user.role
    );

    setPassword(
      ""
    );

    setMustChangePassword(
      user.must_change_password
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setModalOpen(
      true
    );
  }

  function closeModal() {
    if (
      saving
    ) {
      return;
    }

    setModalOpen(
      false
    );

    resetForm();
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !fullName.trim()
    ) {
      setError(
        "Ingresa el nombre completo."
      );

      return;
    }

    if (
      !email.trim()
    ) {
      setError(
        "Ingresa el correo electrónico."
      );

      return;
    }

    if (
      !editingUser &&
      password.length <
        8
    ) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );

      if (
        editingUser
      ) {
        const response =
          await updateUser(
            editingUser.id,
            {
              fullName:
                fullName.trim(),

              email:
                email.trim(),

              role
            }
          );

        setSuccess(
          response.message
        );

      } else {
        const response =
          await createUser({
            fullName:
              fullName.trim(),

            email:
              email.trim(),

            role,

            password,

            mustChangePassword
          });

        setSuccess(
          response.message
        );
      }

      setModalOpen(
        false
      );

      resetForm();

      await loadUsers();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el usuario"
      );

    } finally {
      setSaving(
        false
      );
    }
  }

  /* =====================================================
     ACTIVAR / DESACTIVAR
  ===================================================== */

  async function handleStatus(
    user:
      SystemUser
  ) {
    const nextStatus =
      user.status ===
      "ACTIVE"
        ? "INACTIVE"
        : "ACTIVE";

    const text =
      nextStatus ===
      "INACTIVE"
        ? `¿Desactivar a ${user.full_name}?`
        : `¿Activar a ${user.full_name}?`;

    if (
      !window.confirm(
        text
      )
    ) {
      return;
    }

    try {
      setError(
        ""
      );

      setSuccess(
        ""
      );

      const response =
        await changeUserStatus(
          user.id,
          nextStatus
        );

      setSuccess(
        response.message
      );

      await loadUsers();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado"
      );
    }
  }

  /* =====================================================
     RESET PASSWORD
  ===================================================== */

  function openPasswordModal(
    user:
      SystemUser
  ) {
    setPasswordUser(
      user
    );

    setNewPassword(
      ""
    );

    setError(
      ""
    );

    setSuccess(
      ""
    );

    setPasswordModalOpen(
      true
    );
  }

  async function handlePasswordReset(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !passwordUser
    ) {
      return;
    }

    if (
      newPassword.length <
      8
    ) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }

    try {
      setSaving(
        true
      );

      setError(
        ""
      );

      const response =
        await resetUserPassword(
          passwordUser.id,
          newPassword
        );

      setSuccess(
        response.message
      );

      setPasswordModalOpen(
        false
      );

      setPasswordUser(
        null
      );

      setNewPassword(
        ""
      );

      await loadUsers();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar la contraseña"
      );

    } finally {
      setSaving(
        false
      );
    }
  }

  return (
    <>
      <header>

        <div>
          <span>
            ADMINISTRACIÓN
          </span>

          <h1>
            Usuarios
          </h1>

          <p className="page-description">
            Administra el acceso,
            roles y estado de los
            usuarios del sistema.
          </p>
        </div>

        <button
          type="button"
          className="new-document"
          onClick={
            openCreateModal
          }
        >
          + Nuevo usuario
        </button>

      </header>

      {success && (
        <div className="alert success">
          {success}
        </div>
      )}

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {/* ESTADÍSTICAS */}

      <section className="user-stats">

        <article>
          <span>
            Total
          </span>

          <strong>
            {stats.total}
          </strong>
        </article>

        <article>
          <span>
            Activos
          </span>

          <strong>
            {stats.active}
          </strong>
        </article>

        <article>
          <span>
            Inactivos
          </span>

          <strong>
            {stats.inactive}
          </strong>
        </article>

        <article>
          <span>
            Administradores
          </span>

          <strong>
            {stats.admins}
          </strong>
        </article>

      </section>

      {/* FILTROS */}

      <section className="users-filters">

        <input
          type="search"
          placeholder="Buscar por nombre o correo..."
          value={
            search
          }
          onChange={(
            event
          ) =>
            setSearch(
              event.target.value
            )
          }
        />

        <select
          value={
            roleFilter
          }
          onChange={(
            event
          ) =>
            setRoleFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            Todos los roles
          </option>

          <option value="ADMIN">
            Administrador
          </option>

          <option value="SUPERVISOR">
            Supervisor
          </option>

          <option value="EMPLOYEE">
            Empleado
          </option>

          <option value="READ_ONLY">
            Solo lectura
          </option>
        </select>

        <select
          value={
            statusFilter
          }
          onChange={(
            event
          ) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="ALL">
            Todos los estados
          </option>

          <option value="ACTIVE">
            Activos
          </option>

          <option value="INACTIVE">
            Inactivos
          </option>
        </select>

      </section>

      {/* TABLA */}

      <section className="users-panel">

        <div className="users-count">
          {users.length === 1
            ? "1 usuario"
            : `${users.length} usuarios`}
        </div>

        <div className="table-wrapper">

          <table className="users-table">

            <thead>
              <tr>
                <th>
                  Usuario
                </th>

                <th>
                  Rol
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Cambio contraseña
                </th>

                <th>
                  Último acceso
                </th>

                <th>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={6}
                    className="table-message"
                  >
                    Cargando usuarios...
                  </td>
                </tr>

              ) : users.length ===
                0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="table-message"
                  >
                    No se encontraron usuarios.
                  </td>
                </tr>

              ) : (

                users.map(
                  (
                    systemUser
                  ) => (

                    <tr
                      key={
                        systemUser.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            systemUser.full_name
                          }
                        </strong>

                        <small>
                          {
                            systemUser.email
                          }
                        </small>
                      </td>

                      <td>
                        <span
                          className={
                            `user-role role-${systemUser.role.toLowerCase()}`
                          }
                        >
                          {
                            roleLabels[
                              systemUser.role
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            systemUser.status ===
                            "ACTIVE"
                              ? "user-status user-active"
                              : "user-status user-inactive"
                          }
                        >
                          {systemUser.status ===
                          "ACTIVE"
                            ? "Activo"
                            : "Inactivo"}
                        </span>
                      </td>

                      <td>
                        {systemUser.must_change_password
                          ? "Pendiente"
                          : "No"}
                      </td>

                      <td>
                        {systemUser.last_login_at
                          ? new Date(
                              systemUser.last_login_at
                            )
                              .toLocaleString(
                                "es-SV",
                                {
                                  dateStyle:
                                    "medium",

                                  timeStyle:
                                    "short"
                                }
                              )
                          : "Nunca"}
                      </td>

                      <td>
                        <div className="user-actions">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                systemUser
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openPasswordModal(
                                systemUser
                              )
                            }
                          >
                            Contraseña
                          </button>

                          <button
                            type="button"
                            className={
                              systemUser.status ===
                              "ACTIVE"
                                ? "danger-user-action"
                                : "activate-user-action"
                            }
                            disabled={
                              systemUser.id ===
                              currentUser?.id &&
                              systemUser.status ===
                              "ACTIVE"
                            }
                            onClick={() =>
                              void handleStatus(
                                systemUser
                              )
                            }
                          >
                            {systemUser.status ===
                            "ACTIVE"
                              ? "Desactivar"
                              : "Activar"}
                          </button>

                        </div>
                      </td>

                    </tr>

                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* MODAL CREAR / EDITAR */}

      {modalOpen && (

        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >

          <form
            className="user-modal"
            onSubmit={
              handleSubmit
            }
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span>
                  USUARIO
                </span>

                <h2>
                  {editingUser
                    ? "Editar usuario"
                    : "Nuevo usuario"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                disabled={
                  saving
                }
                onClick={
                  closeModal
                }
              >
                ×
              </button>

            </div>

            <div className="user-form">

              <label className="full-field">
                Nombre completo *

                <input
                  type="text"
                  required
                  value={
                    fullName
                  }
                  onChange={(
                    event
                  ) =>
                    setFullName(
                      event.target.value
                    )
                  }
                />
              </label>

              <label className="full-field">
                Correo electrónico *

                <input
                  type="email"
                  required
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Rol *

                <select
                  value={
                    role
                  }
                  onChange={(
                    event
                  ) =>
                    setRole(
                      event.target
                        .value as UserRole
                    )
                  }
                >
                  <option value="ADMIN">
                    Administrador
                  </option>

                  <option value="SUPERVISOR">
                    Supervisor
                  </option>

                  <option value="EMPLOYEE">
                    Empleado
                  </option>

                  <option value="READ_ONLY">
                    Solo lectura
                  </option>
                </select>
              </label>

              {!editingUser && (
                <>
                  <label>
                    Contraseña temporal *

                    <div className="user-password-field">

                      <input
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        required
                        minLength={8}
                        value={
                          password
                        }
                        onChange={(
                          event
                        ) =>
                          setPassword(
                            event.target.value
                          )
                        }
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (
                              current
                            ) =>
                              !current
                          )
                        }
                      >
                        {showPassword
                          ? "Ocultar"
                          : "Ver"}
                      </button>

                    </div>
                  </label>

                  <label className="user-checkbox-field">

                    <input
                      type="checkbox"
                      checked={
                        mustChangePassword
                      }
                      onChange={(
                        event
                      ) =>
                        setMustChangePassword(
                          event.target.checked
                        )
                      }
                    />

                    <span>
                      Solicitar cambio de contraseña al iniciar sesión
                    </span>

                  </label>
                </>
              )}

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="secondary-button"
                disabled={
                  saving
                }
                onClick={
                  closeModal
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Guardando..."
                  : editingUser
                  ? "Guardar cambios"
                  : "Crear usuario"}
              </button>

            </div>

          </form>

        </div>
      )}

      {/* MODAL PASSWORD */}

      {passwordModalOpen &&
        passwordUser && (

        <div
          className="modal-backdrop"
          onMouseDown={() => {
            if (
              !saving
            ) {
              setPasswordModalOpen(
                false
              );
            }
          }}
        >

          <form
            className="password-reset-modal"
            onSubmit={
              handlePasswordReset
            }
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span>
                  SEGURIDAD
                </span>

                <h2>
                  Restablecer contraseña
                </h2>

                <p>
                  {
                    passwordUser.full_name
                  }
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setPasswordModalOpen(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <div className="password-reset-form">

              <label>
                Nueva contraseña temporal *

                <input
                  type="password"
                  required
                  minLength={8}
                  value={
                    newPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setNewPassword(
                      event.target.value
                    )
                  }
                />

                <small>
                  El usuario deberá cambiarla en su próximo inicio de sesión.
                </small>
              </label>

            </div>

            <div className="modal-footer">

              <button
                type="button"
                className="secondary-button"
                disabled={
                  saving
                }
                onClick={() =>
                  setPasswordModalOpen(
                    false
                  )
                }
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={
                  saving
                }
              >
                {saving
                  ? "Guardando..."
                  : "Restablecer"}
              </button>

            </div>

          </form>

        </div>
      )}
    </>
  );
}