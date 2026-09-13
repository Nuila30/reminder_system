import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  createCase,
  deleteCase,
  getCases,
  updateCase
} from "../services/cases";

import {
  getClientById
} from "../services/clients";

import type {
  CaseRecord
} from "../types/case";

import "../styles/cases.css";

export function CasesPage() {
  const navigate =
    useNavigate();

  const { clientId } =
    useParams();

  const [clientName, setClientName] =
    useState("");

  const [clientStatus, setClientStatus] =
    useState<
      "ACTIVE" | "ARCHIVED"
    >("ACTIVE");

  const [cases, setCases] =
    useState<CaseRecord[]>([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [editingCase, setEditingCase] =
    useState<CaseRecord | null>(
      null
    );

  const [caseNumber, setCaseNumber] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const loadClient =
    useCallback(async () => {
      if (!clientId) {
        return;
      }

      try {
        const response =
          await getClientById(
            clientId
          );

        setClientName(
          response.data.name
        );

        setClientStatus(
          response.data.status
        );

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible obtener el cliente"
        );
      }
    }, [clientId]);

  const loadCases =
    useCallback(async () => {
      if (!clientId) {
        return;
      }

      try {
        setLoading(true);

        const response =
          await getCases(
            clientId,
            search,
            status,
            page
          );

        setCases(
          response.data
        );

        setTotal(
          response.pagination.total
        );

        setTotalPages(
          response.pagination
            .totalPages || 1
        );

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar los expedientes"
        );

      } finally {
        setLoading(false);
      }
    }, [
      clientId,
      search,
      status,
      page
    ]);

  useEffect(() => {
    void loadClient();
  }, [loadClient]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadCases();
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );

  }, [loadCases]);

  function openCreateModal() {
    setEditingCase(null);
    setCaseNumber("");
    setDescription("");
    setError("");
    setModalOpen(true);
  }

  function openEditModal(
    item: CaseRecord
  ) {
    setEditingCase(item);

    setCaseNumber(
      item.case_number
    );

    setDescription(
      item.description || ""
    );

    setModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setModalOpen(false);
    setEditingCase(null);
  }

  async function handleSave() {
    if (!clientId) {
      return;
    }

    const cleanCaseNumber =
      caseNumber.trim();

    if (!cleanCaseNumber) {
      setError(
        "Ingresa el número del expediente."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingCase) {
        const response =
          await updateCase(
            editingCase.id,
            {
              caseNumber:
                cleanCaseNumber,

              description:
                description.trim()
            }
          );

        setSuccess(
          response.message
        );

      } else {
        const response =
          await createCase({
            clientId,

            caseNumber:
              cleanCaseNumber,

            description:
              description.trim()
          });

        setSuccess(
          response.message
        );
      }

      setModalOpen(false);
      setEditingCase(null);

      await loadCases();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el expediente"
      );

    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(
    item: CaseRecord
  ) {
    try {
      setError("");
      setSuccess("");

      const response =
        await updateCase(
          item.id,
          {
            status:
              item.status ===
              "ACTIVE"
                ? "ARCHIVED"
                : "ACTIVE"
          }
        );

      setSuccess(
        response.message
      );

      await loadCases();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible cambiar el estado"
      );
    }
  }

  async function handleDelete(
    item: CaseRecord
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar definitivamente el expediente "${item.case_number}"?\n\nEsta acción no se puede deshacer.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response =
        await deleteCase(
          item.id
        );

      setSuccess(
        response.message
      );

      await loadCases();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible eliminar el expediente"
      );
    }
  }

  if (!clientId) {
    return (
      <div>
        Cliente inválido.
      </div>
    );
  }

  return (
    <>
      <header>
        <div>
          <button
            type="button"
            className="back-link"
            onClick={() =>
              navigate("/clients")
            }
          >
            ← Clientes
          </button>

          <span>
            EXPEDIENTES
          </span>

          <h1>
            {clientName ||
              "Expedientes"}
          </h1>

          <p className="page-description">
            Administra los casos y
            expedientes asociados al
            cliente.
          </p>
        </div>

        <button
          type="button"
          className="new-document"
          disabled={
            clientStatus ===
            "ARCHIVED"
          }
          onClick={
            openCreateModal
          }
        >
          + Nuevo expediente
        </button>
      </header>

      {clientStatus ===
        "ARCHIVED" && (
        <div className="alert error">
          Este cliente está archivado.
          No se pueden crear nuevos
          expedientes hasta reactivarlo.
        </div>
      )}

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

      <section className="cases-panel">
        <div className="cases-toolbar">
          <input
            type="search"
            placeholder="Buscar expediente..."
            value={search}
            onChange={(event) => {
              setSearch(
                event.target.value
              );

              setPage(1);
            }}
          />

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

        <div className="cases-total">
          {total === 1
            ? "1 expediente"
            : `${total} expedientes`}
        </div>

        <div className="table-wrapper">
          <table className="cases-table">
            <thead>
              <tr>
                <th>
                  Expediente
                </th>

                <th>
                  Descripción
                </th>

                <th>
                  Documentos
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Fecha
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
                    Cargando expedientes...
                  </td>
                </tr>

              ) : cases.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="table-message"
                  >
                    No se encontraron
                    expedientes.
                  </td>
                </tr>

              ) : (
                cases.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {
                            item.case_number
                          }
                        </strong>
                      </td>

                      <td>
                        {item.description ||
                          "—"}
                      </td>

                      <td>
                        {
                          item.documents_count
                        }
                      </td>

                      <td>
                        <span
                          className={
                            item.status ===
                            "ACTIVE"
                              ? "status-badge active"
                              : "status-badge archived"
                          }
                        >
                          {item.status ===
                          "ACTIVE"
                            ? "Activo"
                            : "Archivado"}
                        </span>
                      </td>

                      <td>
                        {new Date(
                          item.created_at
                        ).toLocaleDateString(
                          "es-SV"
                        )}
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="open-action"
                            onClick={() =>
                              navigate(
                                `/documents?caseId=${item.id}`
                              )
                            }
                          >
                            Documentos
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                item
                              )
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void handleArchive(
                                item
                              )
                            }
                          >
                            {item.status ===
                            "ACTIVE"
                              ? "Archivar"
                              : "Reactivar"}
                          </button>

                          <button
                            type="button"
                            className="danger-action"
                            onClick={() =>
                              void handleDelete(
                                item
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

        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() =>
                setPage(
                  page - 1
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
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage(
                  page + 1
                )
              }
            >
              Siguiente
            </button>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={closeModal}
        >
          <div
            className="case-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="modal-header">
              <div>
                <span>
                  {editingCase
                    ? "EDITAR"
                    : "NUEVO"}
                </span>

                <h2>
                  {editingCase
                    ? "Editar expediente"
                    : "Nuevo expediente"}
                </h2>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={closeModal}
              >
                ×
              </button>
            </div>

            <div className="case-modal-body">
              <label>
                Número de expediente *

                <input
                  autoFocus
                  type="text"
                  maxLength={100}
                  value={caseNumber}
                  placeholder="Ej. A-123456789"
                  onChange={(event) =>
                    setCaseNumber(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Descripción

                <textarea
                  value={description}
                  maxLength={2000}
                  rows={5}
                  placeholder="Descripción opcional del expediente..."
                  onChange={(event) =>
                    setDescription(
                      event.target.value
                    )
                  }
                />
              </label>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-button"
                disabled={saving}
                onClick={closeModal}
              >
                Cancelar
              </button>

              <button
                className="primary-button"
                disabled={saving}
                onClick={() =>
                  void handleSave()
                }
              >
                {saving
                  ? "Guardando..."
                  : editingCase
                  ? "Guardar cambios"
                  : "Crear expediente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}