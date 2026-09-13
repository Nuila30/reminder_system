import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate,
  useSearchParams
} from "react-router-dom";

import {
  cancelDocument,
  completeDocument,
  deleteDocument,
  getDocuments,
  reopenDocument,
  startDocument
} from "../services/documents";

import type {
  DocumentRecord
} from "../types/document";

import "../styles/documents.css";

const statusLabels = {
  PENDING:
    "Pendiente",

  IN_PROGRESS:
    "En proceso",

  COMPLETED:
    "Completado",

  EXPIRED:
    "Vencido",

  CANCELLED:
    "Cancelado"
};

const priorityLabels = {
  LOW:
    "Baja",

  MEDIUM:
    "Media",

  HIGH:
    "Alta",

  CRITICAL:
    "Crítica"
};

export function DocumentsPage() {
  const navigate =
    useNavigate();

  const [searchParams] =
    useSearchParams();

  const caseId =
    searchParams.get(
      "caseId"
    ) || "";

  const [
    documents,
    setDocuments
  ] =
    useState<
      DocumentRecord[]
    >([]);

  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("ALL");

  const [
    priority,
    setPriority
  ] =
    useState("ALL");

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [
    totalPages,
    setTotalPages
  ] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    success,
    setSuccess
  ] =
    useState("");

  const loadDocuments =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await getDocuments({
            search,
            status,
            priority,
            caseId,
            page
          });

        setDocuments(
          response.data
        );

        setTotal(
          response
            .pagination
            .total
        );

        setTotalPages(
          response
            .pagination
            .totalPages || 1
        );

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar los documentos"
        );

      } finally {
        setLoading(false);
      }
    }, [
      search,
      status,
      priority,
      caseId,
      page
    ]);

  useEffect(() => {
    const timer =
      window.setTimeout(
        () => {
          void loadDocuments();
        },
        250
      );

    return () =>
      window.clearTimeout(
        timer
      );

  }, [loadDocuments]);

  async function runAction(
    action:
      () => Promise<{
        message: string;
      }>
  ) {
    try {
      setError("");
      setSuccess("");

      const response =
        await action();

      setSuccess(
        response.message
      );

      await loadDocuments();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible realizar la operación"
      );
    }
  }

  async function handleDelete(
    document:
      DocumentRecord
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar definitivamente "${document.file_name}"?\n\nEsta acción no se puede deshacer.`
      );

    if (!confirmed) {
      return;
    }

    await runAction(
      () =>
        deleteDocument(
          document.id
        )
    );
  }

  function openNewDocument() {
    if (caseId) {
      navigate(
        `/documents/new?caseId=${caseId}`
      );

      return;
    }

    navigate(
      "/documents/new"
    );
  }

  return (
    <>
      <header>
        <div>
          <span>
            DOCUMENTOS
          </span>

          <h1>
            Documentos
          </h1>

          <p className="page-description">
            Gestiona fechas límite,
            prioridades y estados.
          </p>
        </div>

        <button
          type="button"
          className="new-document"
          onClick={
            openNewDocument
          }
        >
          + Nuevo documento
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

      <section className="documents-panel">

        <div className="documents-toolbar">

          <input
            type="search"
            placeholder="Buscar documento, cliente o expediente..."
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
              Todos los estados
            </option>

            <option value="PENDING">
              Pendiente
            </option>

            <option value="IN_PROGRESS">
              En proceso
            </option>

            <option value="COMPLETED">
              Completado
            </option>

            <option value="EXPIRED">
              Vencido
            </option>

            <option value="CANCELLED">
              Cancelado
            </option>
          </select>

          <select
            value={priority}
            onChange={(event) => {
              setPriority(
                event.target.value
              );

              setPage(1);
            }}
          >
            <option value="ALL">
              Todas las prioridades
            </option>

            <option value="LOW">
              Baja
            </option>

            <option value="MEDIUM">
              Media
            </option>

            <option value="HIGH">
              Alta
            </option>

            <option value="CRITICAL">
              Crítica
            </option>
          </select>

        </div>

        <div className="documents-total">
          {total === 1
            ? "1 documento"
            : `${total} documentos`}
        </div>

        <div className="table-wrapper">

          <table className="documents-table">

            <thead>
              <tr>
                <th>
                  Documento
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Expediente
                </th>

                <th>
                  Tipo
                </th>

                <th>
                  Fecha límite
                </th>

                <th>
                  Prioridad
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Recordatorios
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
                    colSpan={9}
                    className="table-message"
                  >
                    Cargando documentos...
                  </td>
                </tr>

              ) : documents.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="table-message"
                  >
                    No se encontraron documentos.
                  </td>
                </tr>

              ) : (

                documents.map(
                  (document) => (

                    <tr
                      key={
                        document.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            document.file_name
                          }
                        </strong>

                        <small className="assigned-user">
                          {
                            document.assigned_user_name
                          }
                        </small>
                      </td>

                      <td>
                        {
                          document.client_name ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          document.case_number ||
                          "—"
                        }
                      </td>

                      <td>
                        {
                          document.document_type_name ||
                          "—"
                        }
                      </td>

                      <td>
                        {new Date(
                          document.due_date
                        ).toLocaleString(
                          "es-SV",
                          {
                            dateStyle:
                              "short",

                            timeStyle:
                              "short"
                          }
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            `priority-badge priority-${document.priority.toLowerCase()}`
                          }
                        >
                          {
                            priorityLabels[
                              document.priority
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            `document-status status-${document.status.toLowerCase()}`
                          }
                        >
                          {
                            statusLabels[
                              document.status
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        {
                          document.reminders_count
                        }
                      </td>

                      <td>
                        <div className="document-actions">

                          <button
                            onClick={() =>
                              navigate(
                                `/documents/${document.id}/edit`
                              )
                            }
                          >
                            Editar
                          </button>

                          {document.status ===
                            "PENDING" && (
                            <button
                              onClick={() =>
                                void runAction(
                                  () =>
                                    startDocument(
                                      document.id
                                    )
                                )
                              }
                            >
                              Iniciar
                            </button>
                          )}

                          {document.status ===
                            "IN_PROGRESS" && (
                            <button
                              onClick={() =>
                                void runAction(
                                  () =>
                                    completeDocument(
                                      document.id
                                    )
                                )
                              }
                            >
                              Completar
                            </button>
                          )}

                          {(
                            document.status ===
                              "COMPLETED" ||
                            document.status ===
                              "CANCELLED"
                          ) && (
                            <button
                              onClick={() =>
                                void runAction(
                                  () =>
                                    reopenDocument(
                                      document.id
                                    )
                                )
                              }
                            >
                              Reabrir
                            </button>
                          )}

                          {document.status !==
                            "COMPLETED" &&
                            document.status !==
                              "CANCELLED" && (
                            <button
                              onClick={() =>
                                void runAction(
                                  () =>
                                    cancelDocument(
                                      document.id
                                    )
                                )
                              }
                            >
                              Cancelar
                            </button>
                          )}

                          <button
                            className="danger-action"
                            onClick={() =>
                              void handleDelete(
                                document
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
              disabled={
                page <= 1
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
              disabled={
                page >=
                totalPages
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
    </>
  );
}