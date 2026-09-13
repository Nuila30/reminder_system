import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  createClient,
  deleteClient,
  getClients,
  updateClient
} from "../services/clients";

import type {
  Client
} from "../types/client";

import "../styles/clients.css";

export function ClientsPage() {
  const navigate = useNavigate();

  const [clients, setClients] =
    useState<Client[]>([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [
    editingClient,
    setEditingClient
  ] = useState<Client | null>(null);

  const [name, setName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  /* =====================================================
     CARGAR CLIENTES
  ===================================================== */

  const loadClients =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getClients(
            search,
            status,
            page
          );

        setClients(
          response.data
        );

        setTotal(
          response.pagination.total
        );

        setTotalPages(
          response.pagination.totalPages ||
            1
        );

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar los clientes"
        );

      } finally {
        setLoading(false);
      }
    }, [
      search,
      status,
      page
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadClients();
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );

  }, [loadClients]);

  /* =====================================================
     MODAL
  ===================================================== */

  function openCreateModal() {
    setEditingClient(null);

    setName("");

    setError("");
    setSuccess("");

    setModalOpen(true);
  }

  function openEditModal(
    client: Client
  ) {
    setEditingClient(client);

    setName(
      client.name
    );

    setError("");

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);

    setEditingClient(null);

    setName("");
  }

  /* =====================================================
     GUARDAR
  ===================================================== */

  async function handleSave() {
    const cleanName =
      name.trim();

    if (
      cleanName.length < 2
    ) {
      setError(
        "Ingresa un nombre válido."
      );

      return;
    }

    try {
      setSaving(true);

      setError("");
      setSuccess("");

      if (editingClient) {
        const response =
          await updateClient(
            editingClient.id,
            {
              name: cleanName
            }
          );

        setSuccess(
          response.message
        );

      } else {
        const response =
          await createClient(
            cleanName
          );

        setSuccess(
          response.message
        );
      }

      setModalOpen(false);

      setEditingClient(null);

      setName("");

      await loadClients();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar"
      );

    } finally {
      setSaving(false);
    }
  }

  /* =====================================================
     ARCHIVAR / REACTIVAR
  ===================================================== */

  async function handleArchive(
    client: Client
  ) {
    const nextStatus =
      client.status === "ACTIVE"
        ? "ARCHIVED"
        : "ACTIVE";

    try {
      setError("");
      setSuccess("");

      const response =
        await updateClient(
          client.id,
          {
            status:
              nextStatus
          }
        );

      setSuccess(
        response.message
      );

      await loadClients();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado"
      );
    }
  }

  /* =====================================================
     ELIMINAR
  ===================================================== */

  async function handleDelete(
    client: Client
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar definitivamente a "${client.name}"?\n\nEsta acción no se puede deshacer.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await deleteClient(
          client.id
        );

      setSuccess(
        response.message
      );

      /*
       * Si eliminamos el último elemento
       * de una página superior,
       * regresamos una página.
       */
      if (
        clients.length === 1 &&
        page > 1
      ) {
        setPage(
          (current) =>
            current - 1
        );

        return;
      }

      await loadClients();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el cliente"
      );
    }
  }

  /* =====================================================
     ABRIR EXPEDIENTES
  ===================================================== */

  function handleOpenCases(
    client: Client
  ) {
    navigate(
      `/clients/${client.id}/cases`
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <header>
        <div>
          <span>
            CLIENTES
          </span>

          <h1>
            Clientes
          </h1>

          <p className="page-description">
            Administra los clientes
            y sus expedientes.
          </p>
        </div>

        <button
          type="button"
          className="new-document"
          onClick={
            openCreateModal
          }
        >
          + Nuevo cliente
        </button>
      </header>

      {/* MENSAJES */}

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

      {/* PANEL */}

      <section className="clients-panel">

        {/* BUSCADOR / FILTRO */}

        <div className="clients-toolbar">

          <div className="client-search">
            <input
              type="search"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(event) => {
                setSearch(
                  event.target.value
                );

                setPage(1);
              }}
            />
          </div>

          <select
            value={status}
            onChange={(event) => {
              setStatus(
                event.target.value
              );

              setPage(1);
            }}
          >
            <option value="ALL">
              Todos
            </option>

            <option value="ACTIVE">
              Activos
            </option>

            <option value="ARCHIVED">
              Archivados
            </option>
          </select>
        </div>

        {/* TOTAL */}

        <div className="clients-summary">
          {total === 1
            ? "1 cliente"
            : `${total} clientes`}
        </div>

        {/* TABLA */}

        <div className="table-wrapper">

          <table className="clients-table">

            <thead>
              <tr>
                <th>
                  Cliente
                </th>

                <th>
                  Expedientes
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Creado por
                </th>

                <th>
                  Fecha
                </th>

                <th className="actions-column">
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
                    Cargando clientes...
                  </td>
                </tr>

              ) : clients.length === 0 ? (

                <tr>
                  <td
                    colSpan={6}
                    className="table-message"
                  >
                    No se encontraron clientes.
                  </td>
                </tr>

              ) : (

                clients.map(
                  (client) => (

                    <tr
                      key={client.id}
                    >

                      {/* NOMBRE */}

                      <td>
                        <strong>
                          {client.name}
                        </strong>
                      </td>

                      {/* EXPEDIENTES */}

                      <td>
                        {
                          client.cases_count
                        }
                      </td>

                      {/* ESTADO */}

                      <td>
                        <span
                          className={
                            client.status ===
                            "ACTIVE"
                              ? "status-badge active"
                              : "status-badge archived"
                          }
                        >
                          {client.status ===
                          "ACTIVE"
                            ? "Activo"
                            : "Archivado"}
                        </span>
                      </td>

                      {/* CREADO POR */}

                      <td>
                        {
                          client.created_by_name ||
                          "—"
                        }
                      </td>

                      {/* FECHA */}

                      <td>
                        {new Date(
                          client.created_at
                        ).toLocaleDateString(
                          "es-SV"
                        )}
                      </td>

                      {/* ACCIONES */}

                      <td>
                        <div className="row-actions">

                          {/* EXPEDIENTES */}

                          <button
                            type="button"
                            className="open-action"
                            onClick={() =>
                              handleOpenCases(
                                client
                              )
                            }
                          >
                            Expedientes
                          </button>

                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                client
                              )
                            }
                          >
                            Editar
                          </button>

                          {/* ARCHIVAR */}

                          <button
                            type="button"
                            onClick={() =>
                              void handleArchive(
                                client
                              )
                            }
                          >
                            {client.status ===
                            "ACTIVE"
                              ? "Archivar"
                              : "Reactivar"}
                          </button>

                          {/* ELIMINAR */}

                          <button
                            type="button"
                            className="danger-action"
                            onClick={() =>
                              void handleDelete(
                                client
                              )
                            }
                          >
                            Eliminar
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

        {/* PAGINACIÓN */}

        {totalPages > 1 && (
          <div className="pagination">

            <button
              type="button"
              disabled={
                page <= 1 ||
                loading
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current - 1
                )
              }
            >
              Anterior
            </button>

            <span>
              Página {page} de{" "}
              {totalPages}
            </span>

            <button
              type="button"
              disabled={
                page >= totalPages ||
                loading
              }
              onClick={() =>
                setPage(
                  (current) =>
                    current + 1
                )
              }
            >
              Siguiente
            </button>

          </div>
        )}

      </section>

      {/* MODAL */}

      {modalOpen && (

        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >

          <div
            className="client-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="modal-header">

              <div>
                <span>
                  {editingClient
                    ? "EDITAR"
                    : "NUEVO"}
                </span>

                <h2>
                  {editingClient
                    ? "Editar cliente"
                    : "Nuevo cliente"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                ×
              </button>

            </div>

            {/* MODAL BODY */}

            <div className="modal-body">

              <label>
                Nombre del cliente

                <input
                  autoFocus
                  type="text"
                  value={name}
                  maxLength={200}
                  placeholder="Nombre completo"
                  disabled={saving}
                  onChange={(event) =>
                    setName(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                        "Enter" &&
                      !saving
                    ) {
                      void handleSave();
                    }
                  }}
                />

              </label>

            </div>

            {/* MODAL FOOTER */}

            <div className="modal-footer">

              <button
                type="button"
                className="secondary-button"
                onClick={
                  closeModal
                }
                disabled={
                  saving
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  void handleSave()
                }
                disabled={
                  saving
                }
              >
                {saving
                  ? "Guardando..."
                  : editingClient
                  ? "Guardar cambios"
                  : "Crear cliente"}
              </button>

            </div>

          </div>

        </div>
      )}

    </>
  );
}