import {
  useCallback,
  useEffect,
  useState
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  getHistory
} from "../services/history";

import type {
  HistoryClientOption,
  HistoryRecord,
  HistoryStats,
  HistoryUserOption
} from "../types/history";

import "../styles/history.css";

const priorityLabels:
  Record<
    string,
    string
  > = {
    LOW:
      "Baja",

    MEDIUM:
      "Media",

    HIGH:
      "Alta",

    CRITICAL:
      "Crítica"
  };

const statusLabels:
  Record<
    string,
    string
  > = {
    PENDING:
      "Pendiente",

    IN_PROGRESS:
      "En proceso",

    COMPLETED:
      "Completado",

    EXPIRED:
      "Vencido",

    CANCELLED:
      "Cancelado",

    SCHEDULED:
      "Programado",

    PROCESSING:
      "Procesando",

    SENT:
      "Enviado",

    FAILED:
      "Fallido",

    SUCCESS:
      "Exitoso"
  };

const sourceLabels:
  Record<
    string,
    string
  > = {
    DOCUMENT:
      "Documento",

    REMINDER:
      "Recordatorio",

    STATUS:
      "Estado",

    NOTIFICATION:
      "Envío"
  };

function getActionLabel(
  history:
    HistoryRecord
) {
  if (
    history.source ===
      "NOTIFICATION"
  ) {
    if (
      history.delivery_status ===
      "SUCCESS"
    ) {
      return "Notificación enviada";
    }

    return "Intento de envío fallido";
  }

  if (
    history.source ===
      "STATUS"
  ) {
    return "Cambio de estado";
  }

  switch (
    history.action
  ) {
    case "CREATE":
      return "Creación";

    case "UPDATE":
      return "Modificación";

    case "DELETE":
      return "Eliminación";

    case "CANCEL":
      return "Cancelación";

    case "STATUS_CHANGE":
      return "Cambio de estado";

    default:
      return history.action;
  }
}

export function HistoryPage() {
  const navigate =
    useNavigate();

  const [
    history,
    setHistory
  ] =
    useState<
      HistoryRecord[]
    >([]);

  const [
    clients,
    setClients
  ] =
    useState<
      HistoryClientOption[]
    >([]);

  const [
    users,
    setUsers
  ] =
    useState<
      HistoryUserOption[]
    >([]);

  const [
    stats,
    setStats
  ] =
    useState<HistoryStats>({
      successful: 0,
      failed: 0,
      cancelled: 0,
      scheduled: 0
    });

  const [
    clientId,
    setClientId
  ] =
    useState("");

  const [
    status,
    setStatus
  ] =
    useState("ALL");

  const [
    priority,
    setPriority
  ] =
    useState("ALL");

  const [
    userId,
    setUserId
  ] =
    useState("");

  const [
    dateFrom,
    setDateFrom
  ] =
    useState("");

  const [
    dateTo,
    setDateTo
  ] =
    useState("");

  const [
    page,
    setPage
  ] =
    useState(1);

  const [
    total,
    setTotal
  ] =
    useState(0);

  const [
    totalPages,
    setTotalPages
  ] =
    useState(1);

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

  /* =====================================================
     CARGAR
  ===================================================== */

  const loadHistory =
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
            await getHistory({
              clientId,
              status,
              priority,
              userId,
              dateFrom,
              dateTo,
              page,
              limit: 20
            });

          setHistory(
            response.data
          );

          setClients(
            response.options
              .clients
          );

          setUsers(
            response.options
              .users
          );

          setStats(
            response.stats
          );

          setTotal(
            response.pagination
              .total
          );

          setTotalPages(
            response.pagination
              .totalPages ||
              1
          );

        } catch (
          error
        ) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar el historial"
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        clientId,
        status,
        priority,
        userId,
        dateFrom,
        dateTo,
        page
      ]
    );

  useEffect(
    () => {
      void loadHistory();
    },
    [
      loadHistory
    ]
  );

  /* =====================================================
     LIMPIAR FILTROS
  ===================================================== */

  function clearFilters() {
    setClientId(
      ""
    );

    setStatus(
      "ALL"
    );

    setPriority(
      "ALL"
    );

    setUserId(
      ""
    );

    setDateFrom(
      ""
    );

    setDateTo(
      ""
    );

    setPage(
      1
    );
  }

  /* =====================================================
     EXPORTAR CSV
  ===================================================== */

  function exportCurrentPageCsv() {
    if (
      history.length ===
      0
    ) {
      return;
    }

    const rows =
      history.map(
        (
          item
        ) => [
          new Date(
            item.event_at
          )
            .toLocaleString(
              "es-SV"
            ),

          sourceLabels[
            item.source
          ] ||
            item.source,

          getActionLabel(
            item
          ),

          item.client_name ||
            "",

          item.case_number ||
            "",

          item.document_name ||
            "",

          priorityLabels[
            item.priority
          ] ||
            item.priority,

          statusLabels[
            item.delivery_status ||
              item.status ||
              ""
          ] ||
            item.delivery_status ||
            item.status ||
            "",

          item.channel ||
            "",

          item.user_name ||
            ""
        ]
      );

    const headers = [
      "Fecha",
      "Origen",
      "Actividad",
      "Cliente",
      "Expediente",
      "Documento",
      "Prioridad",
      "Estado",
      "Canal",
      "Usuario"
    ];

    const escape =
      (
        value:
          string
      ) =>
        `"${value.replace(
          /"/g,
          '""'
        )}"`;

    const csv = [
      headers
        .map(
          escape
        )
        .join(","),

      ...rows.map(
        (
          row
        ) =>
          row
            .map(
              (
                value
              ) =>
                escape(
                  String(
                    value
                  )
                )
            )
            .join(",")
      )
    ].join(
      "\r\n"
    );

    const blob =
      new Blob(
        [
          "\uFEFF",
          csv
        ],
        {
          type:
            "text/csv;charset=utf-8"
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href =
      url;

    anchor.download =
      `historial-${new Date()
        .toISOString()
        .slice(
          0,
          10
        )}.csv`;

    document.body
      .appendChild(
        anchor
      );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
      url
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
            HISTORIAL
          </span>

          <h1>
            Historial del sistema
          </h1>

          <p className="page-description">
            Consulta cambios,
            recordatorios e intentos
            de notificación.
          </p>
        </div>

        <button
          type="button"
          className="history-export-button"
          disabled={
            history.length ===
            0
          }
          onClick={
            exportCurrentPageCsv
          }
        >
          Exportar CSV
        </button>

      </header>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <section className="history-stats">

        <article>
          <span>
            Programados
          </span>

          <strong>
            {
              stats.scheduled
            }
          </strong>
        </article>

        <article>
          <span>
            Envíos exitosos
          </span>

          <strong>
            {
              stats.successful
            }
          </strong>
        </article>

        <article>
          <span>
            Fallidos
          </span>

          <strong>
            {
              stats.failed
            }
          </strong>
        </article>

        <article>
          <span>
            Cancelados
          </span>

          <strong>
            {
              stats.cancelled
            }
          </strong>
        </article>

      </section>

      {/* =================================================
          FILTROS
      ================================================= */}

      <section className="history-filters">

        <div className="history-filter-grid">

          <label>
            Cliente

            <select
              value={
                clientId
              }
              onChange={(
                event
              ) => {
                setClientId(
                  event.target.value
                );

                setPage(
                  1
                );
              }}
            >
              <option value="">
                Todos
              </option>

              {clients.map(
                (
                  client
                ) => (
                  <option
                    key={
                      client.id
                    }
                    value={
                      client.id
                    }
                  >
                    {
                      client.name
                    }
                  </option>
                )
              )}

            </select>
          </label>

          <label>
            Estado

            <select
              value={
                status
              }
              onChange={(
                event
              ) => {
                setStatus(
                  event.target.value
                );

                setPage(
                  1
                );
              }}
            >
              <option value="ALL">
                Todos
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

              <option value="SCHEDULED">
                Programado
              </option>

              <option value="SENT">
                Enviado
              </option>

              <option value="SUCCESS">
                Exitoso
              </option>

              <option value="FAILED">
                Fallido
              </option>

              <option value="CANCELLED">
                Cancelado
              </option>
            </select>
          </label>

          <label>
            Prioridad

            <select
              value={
                priority
              }
              onChange={(
                event
              ) => {
                setPriority(
                  event.target.value
                );

                setPage(
                  1
                );
              }}
            >
              <option value="ALL">
                Todas
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
          </label>

          <label>
            Usuario

            <select
              value={
                userId
              }
              onChange={(
                event
              ) => {
                setUserId(
                  event.target.value
                );

                setPage(
                  1
                );
              }}
            >
              <option value="">
                Todos
              </option>

              {users.map(
                (
                  user
                ) => (
                  <option
                    key={
                      user.id
                    }
                    value={
                      user.id
                    }
                  >
                    {
                      user.full_name
                    }
                  </option>
                )
              )}

            </select>
          </label>

          <label>
            Desde

            <input
              type="date"
              value={
                dateFrom
              }
              onChange={(
                event
              ) => {
                setDateFrom(
                  event.target.value
                );

                setPage(
                  1
                );
              }}
            />
          </label>

          <label>
            Hasta

            <input
              type="date"
              value={
                dateTo
              }
              onChange={(
                event
              ) => {
                setDateTo(
                  event.target.value
                );

                setPage(
                  1
                );
              }}
            />
          </label>

        </div>

        <button
          type="button"
          className="history-clear-button"
          onClick={
            clearFilters
          }
        >
          Limpiar filtros
        </button>

      </section>

      {/* =================================================
          TABLA
      ================================================= */}

      <section className="history-panel">

        <div className="history-summary">
          {total ===
          1
            ? "1 registro"
            : `${total} registros`}
        </div>

        <div className="table-wrapper">

          <table className="history-table">

            <thead>
              <tr>
                <th>
                  Fecha
                </th>

                <th>
                  Actividad
                </th>

                <th>
                  Cliente
                </th>

                <th>
                  Documento
                </th>

                <th>
                  Prioridad
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Usuario / Canal
                </th>

                <th>
                  Acción
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan={8}
                    className="table-message"
                  >
                    Cargando historial...
                  </td>
                </tr>

              ) : history.length ===
                0 ? (

                <tr>
                  <td
                    colSpan={8}
                    className="table-message"
                  >
                    No se encontraron
                    registros.
                  </td>
                </tr>

              ) : (

                history.map(
                  (
                    item
                  ) => {

                    const visualStatus =
                      item.delivery_status ||
                      item.status ||
                      "";

                    return (
                      <tr
                        key={
                          `${item.source}-${item.id}`
                        }
                      >

                        <td className="history-date">

                          <strong>
                            {new Date(
                              item.event_at
                            )
                              .toLocaleDateString(
                                "es-SV"
                              )}
                          </strong>

                          <span>
                            {new Date(
                              item.event_at
                            )
                              .toLocaleTimeString(
                                "es-SV",
                                {
                                  hour:
                                    "2-digit",

                                  minute:
                                    "2-digit"
                                }
                              )}
                          </span>

                        </td>

                        <td>

                          <span
                            className={
                              `history-source source-${item.source.toLowerCase()}`
                            }
                          >
                            {
                              sourceLabels[
                                item.source
                              ]
                            }
                          </span>

                          <strong className="history-action-title">
                            {
                              getActionLabel(
                                item
                              )
                            }
                          </strong>

                        </td>

                        <td>

                          <strong>
                            {
                              item.client_name ||
                              "—"
                            }
                          </strong>

                          <small>
                            {
                              item.case_number ||
                              ""
                            }
                          </small>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="history-document-link"
                            onClick={() =>
                              navigate(
                                `/documents/${item.document_id}/reminders`
                              )
                            }
                          >
                            {
                              item.document_name
                            }
                          </button>

                        </td>

                        <td>

                          <span
                            className={
                              `history-priority priority-${item.priority.toLowerCase()}`
                            }
                          >
                            {
                              priorityLabels[
                                item.priority
                              ] ||
                              item.priority
                            }
                          </span>

                        </td>

                        <td>

                          {visualStatus ? (

                            <span
                              className={
                                `history-status status-${visualStatus.toLowerCase()}`
                              }
                            >
                              {
                                statusLabels[
                                  visualStatus
                                ] ||
                                visualStatus
                              }
                            </span>

                          ) : (
                            "—"
                          )}

                        </td>

                        <td>

                          <strong>
                            {
                              item.user_name ||
                              "Sistema"
                            }
                          </strong>

                          {item.channel && (
                            <small>
                              {
                                item.channel
                              }
                            </small>
                          )}

                        </td>

                        <td>

                          <button
                            type="button"
                            className="history-view-button"
                            onClick={() =>
                              navigate(
                                `/documents/${item.document_id}/reminders`
                              )
                            }
                          >
                            Ver
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINACIÓN */}

        {totalPages >
          1 && (

          <div className="pagination">

            <button
              type="button"
              disabled={
                page <=
                1 ||
                loading
              }
              onClick={() =>
                setPage(
                  (
                    current
                  ) =>
                    current -
                    1
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
                page >=
                  totalPages ||
                loading
              }
              onClick={() =>
                setPage(
                  (
                    current
                  ) =>
                    current +
                    1
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