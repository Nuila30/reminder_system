import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  useNavigate
} from "react-router-dom";

import {
  getCalendarEvents
} from "../services/calendar";

import type {
  CalendarDocumentOption,
  CalendarResponsible,
  CalendarStats
} from "../services/calendar";

import {
  createReminder
} from "../services/reminders";

import type {
  NotificationType,
  RecurrenceType,
  ReminderStatus
} from "../types/reminder";

import type {
  DocumentPriority
} from "../types/document";

import type {
  CalendarEvent
} from "../types/calendar";

import "../styles/calendar.css";

/* =====================================================
   CONSTANTES
===================================================== */

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre"
];

const weekDays = [
  "Dom",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb"
];

const priorityLabels: Record<
  DocumentPriority,
  string
> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  CRITICAL: "Crítica"
};

const statusLabels: Record<
  ReminderStatus,
  string
> = {
  SCHEDULED: "Programado",
  PROCESSING: "Procesando",
  SENT: "Enviado",
  FAILED: "Fallido",
  CANCELLED: "Cancelado"
};

/* =====================================================
   UTILIDADES
===================================================== */

function dateKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function sameDay(
  first: Date,
  second: Date
) {
  return (
    first.getFullYear() ===
      second.getFullYear() &&
    first.getMonth() ===
      second.getMonth() &&
    first.getDate() ===
      second.getDate()
  );
}

function toDateTimeLocal(
  date: Date
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  const hour =
    String(
      date.getHours()
    ).padStart(
      2,
      "0"
    );

  const minute =
    String(
      date.getMinutes()
    ).padStart(
      2,
      "0"
    );

  return (
    `${year}-${month}-${day}T${hour}:${minute}`
  );
}

function getTimeFromDateTimeLocal(
  value: string
) {
  if (!value) {
    return "09:00";
  }

  const parts =
    value.split("T");

  return (
    parts[1] ||
    "09:00"
  );
}

/* =====================================================
   COMPONENTE
===================================================== */

export function CalendarPage() {
  const navigate =
    useNavigate();

  const [
    currentMonth,
    setCurrentMonth
  ] =
    useState(
      new Date()
    );

  const [
    events,
    setEvents
  ] =
    useState<
      CalendarEvent[]
    >([]);

  const [
    stats,
    setStats
  ] =
    useState<CalendarStats>({
      total: 0,
      pending: 0,
      critical: 0,
      failed: 0
    });

  const [
    users,
    setUsers
  ] =
    useState<
      CalendarResponsible[]
    >([]);

  const [
    documents,
    setDocuments
  ] =
    useState<
      CalendarDocumentOption[]
    >([]);

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

  const [
    selectedDay,
    setSelectedDay
  ] =
    useState<Date | null>(
      new Date()
    );

  /* =====================================================
     FILTROS
  ===================================================== */

  const [
    statusFilter,
    setStatusFilter
  ] =
    useState("ALL");

  const [
    priorityFilter,
    setPriorityFilter
  ] =
    useState("ALL");

  const [
    responsibleFilter,
    setResponsibleFilter
  ] =
    useState("");

  /* =====================================================
     MODAL NUEVO RECORDATORIO
  ===================================================== */

  const [
    modalOpen,
    setModalOpen
  ] =
    useState(false);

  const [
    saving,
    setSaving
  ] =
    useState(false);

  const [
    documentId,
    setDocumentId
  ] =
    useState("");

  const [
    reminderAt,
    setReminderAt
  ] =
    useState("");

  const [
    notificationType,
    setNotificationType
  ] =
    useState<NotificationType>(
      "EMAIL"
    );

  const [
    emailTo,
    setEmailTo
  ] =
    useState("");

  const [
    whatsappTo,
    setWhatsappTo
  ] =
    useState("");

  const [
    recurrenceType,
    setRecurrenceType
  ] =
    useState<RecurrenceType>(
      "NONE"
    );

  const [
    recurrenceInterval,
    setRecurrenceInterval
  ] =
    useState("1");

  /* =====================================================
     RANGO DEL CALENDARIO
  ===================================================== */

  const calendarRange =
    useMemo(
      () => {
        const year =
          currentMonth
            .getFullYear();

        const month =
          currentMonth
            .getMonth();

        const firstDay =
          new Date(
            year,
            month,
            1
          );

        const start =
          new Date(
            year,
            month,
            1 -
              firstDay.getDay()
          );

        start.setHours(
          0,
          0,
          0,
          0
        );

        const end =
          new Date(start);

        end.setDate(
          start.getDate() +
          42
        );

        return {
          start,
          end
        };
      },
      [
        currentMonth
      ]
    );

  /* =====================================================
     CARGAR CALENDARIO
  ===================================================== */

  const loadCalendar =
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
            await getCalendarEvents(
              calendarRange
                .start
                .toISOString(),

              calendarRange
                .end
                .toISOString(),

              {
                status:
                  statusFilter,

                priority:
                  priorityFilter,

                assignedUserId:
                  responsibleFilter
              }
            );

          setEvents(
            response.data
          );

          setStats(
            response.stats
          );

          setUsers(
            response.options
              .users
          );

          setDocuments(
            response.options
              .documents
          );

        } catch (
          error
        ) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar el calendario"
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [
        calendarRange,
        statusFilter,
        priorityFilter,
        responsibleFilter
      ]
    );

  useEffect(
    () => {
      void loadCalendar();
    },
    [
      loadCalendar
    ]
  );

  /* =====================================================
     AGRUPAR EVENTOS POR DÍA
  ===================================================== */

  const eventsByDay =
    useMemo(
      () => {
        const map =
          new Map<
            string,
            CalendarEvent[]
          >();

        for (
          const calendarEvent of
          events
        ) {
          const date =
            new Date(
              calendarEvent
                .reminder_at
            );

          const key =
            dateKey(
              date
            );

          const current =
            map.get(
              key
            ) || [];

          current.push(
            calendarEvent
          );

          map.set(
            key,
            current
          );
        }

        return map;
      },
      [
        events
      ]
    );

  /* =====================================================
     DÍAS VISIBLES
  ===================================================== */

  const days =
    useMemo(
      () => {
        const result:
          Date[] = [];

        const date =
          new Date(
            calendarRange
              .start
          );

        for (
          let index = 0;
          index < 42;
          index++
        ) {
          result.push(
            new Date(
              date
            )
          );

          date.setDate(
            date.getDate() +
            1
          );
        }

        return result;
      },
      [
        calendarRange
      ]
    );

  /* =====================================================
     NAVEGACIÓN DEL MES
  ===================================================== */

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth
          .getFullYear(),

        currentMonth
          .getMonth() -
          1,

        1
      )
    );

    setSelectedDay(
      null
    );
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth
          .getFullYear(),

        currentMonth
          .getMonth() +
          1,

        1
      )
    );

    setSelectedDay(
      null
    );
  }

  function goToday() {
    const today =
      new Date();

    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedDay(
      today
    );
  }

  function clearFilters() {
    setStatusFilter(
      "ALL"
    );

    setPriorityFilter(
      "ALL"
    );

    setResponsibleFilter(
      ""
    );
  }

  /* =====================================================
     EVENTOS DEL DÍA SELECCIONADO
  ===================================================== */

  const selectedEvents:
    CalendarEvent[] =
      selectedDay
        ? (
            eventsByDay.get(
              dateKey(
                selectedDay
              )
            ) || []
          )
        : [];

  /* =====================================================
     CAMBIAR SOLO LA HORA
  ===================================================== */

  function updateReminderTime(
    newTime: string
  ) {
    if (
      !reminderAt
    ) {
      return;
    }

    const [
      datePart
    ] =
      reminderAt.split(
        "T"
      );

    setReminderAt(
      `${datePart}T${newTime}`
    );
  }

  /* =====================================================
     ABRIR RECORDATORIO RÁPIDO
  ===================================================== */

  function openQuickReminder(
    day?: Date
  ) {
    let targetDay =
      day ||
      selectedDay;

    if (
      !targetDay
    ) {
      targetDay =
        new Date();
    }

    const date =
      new Date(
        targetDay
      );

    /*
     * La fecha queda fijada
     * desde el calendario.
     *
     * La hora inicial será
     * 09:00 AM.
     */
    date.setHours(
      9,
      0,
      0,
      0
    );

    setDocumentId(
      ""
    );

    setReminderAt(
      toDateTimeLocal(
        date
      )
    );

    setNotificationType(
      "EMAIL"
    );

    setEmailTo(
      ""
    );

    setWhatsappTo(
      ""
    );

    setRecurrenceType(
      "NONE"
    );

    setRecurrenceInterval(
      "1"
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
  }

  /* =====================================================
     GUARDAR RECORDATORIO
  ===================================================== */

  async function handleCreateReminder(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !documentId
    ) {
      setError(
        "Selecciona un documento."
      );

      return;
    }

    if (
      !reminderAt
    ) {
      setError(
        "Selecciona una hora."
      );

      return;
    }

    if (
      (
        notificationType ===
          "EMAIL" ||
        notificationType ===
          "BOTH"
      ) &&
      !emailTo.trim()
    ) {
      setError(
        "Ingresa el correo electrónico."
      );

      return;
    }

    if (
      (
        notificationType ===
          "WHATSAPP" ||
        notificationType ===
          "BOTH"
      ) &&
      !whatsappTo.trim()
    ) {
      setError(
        "Ingresa el número de WhatsApp."
      );

      return;
    }

    if (
      recurrenceType ===
        "CUSTOM" &&
      (
        !recurrenceInterval ||
        Number(
          recurrenceInterval
        ) < 1
      )
    ) {
      setError(
        "El intervalo debe ser mayor a cero."
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

      const response =
        await createReminder({
          documentId,

          reminderAt:
            new Date(
              reminderAt
            ).toISOString(),

          notificationType,

          emailTo:
            emailTo.trim(),

          whatsappTo:
            whatsappTo.trim(),

          recurrenceType,

          recurrenceInterval:
            recurrenceType ===
            "CUSTOM"
              ? Number(
                  recurrenceInterval
                )
              : null
        });

      setSuccess(
        response.message
      );

      setModalOpen(
        false
      );

      await loadCalendar();

    } catch (
      error
    ) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible crear el recordatorio"
      );

    } finally {
      setSaving(
        false
      );
    }
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <>
      <header>

        <div>
          <span>
            CALENDARIO
          </span>

          <h1>
            Recordatorios
          </h1>

          <p className="page-description">
            Consulta y administra los
            recordatorios programados.
          </p>
        </div>

        <div className="calendar-page-actions">

          <button
            type="button"
            className="secondary-calendar-button"
            onClick={() =>
              navigate(
                "/documents"
              )
            }
          >
            Ver documentos
          </button>

          <button
            type="button"
            className="new-document"
            onClick={() =>
              openQuickReminder(
                selectedDay ||
                new Date()
              )
            }
          >
            + Nuevo recordatorio
          </button>

        </div>

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

      {/* ESTADÍSTICAS */}

      <section className="calendar-stats">

        <article>
          <span>
            Este período
          </span>

          <strong>
            {stats.total}
          </strong>
        </article>

        <article>
          <span>
            Pendientes
          </span>

          <strong>
            {stats.pending}
          </strong>
        </article>

        <article>
          <span>
            Críticos
          </span>

          <strong>
            {stats.critical}
          </strong>
        </article>

        <article>
          <span>
            Fallidos
          </span>

          <strong>
            {stats.failed}
          </strong>
        </article>

      </section>

      {/* FILTROS */}

      <section className="calendar-filters">

        <div>

          <label>
            Estado

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
                Todos
              </option>

              <option value="SCHEDULED">
                Programado
              </option>

              <option value="PROCESSING">
                Procesando
              </option>

              <option value="SENT">
                Enviado
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
                priorityFilter
              }
              onChange={(
                event
              ) =>
                setPriorityFilter(
                  event.target.value
                )
              }
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
            Responsable

            <select
              value={
                responsibleFilter
              }
              onChange={(
                event
              ) =>
                setResponsibleFilter(
                  event.target.value
                )
              }
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

        </div>

        <button
          type="button"
          onClick={
            clearFilters
          }
        >
          Limpiar filtros
        </button>

      </section>

      {/* CALENDARIO */}

      <section className="calendar-layout">

        <div className="calendar-card">

          <div className="calendar-header">

            <div className="calendar-navigation">

              <button
                type="button"
                onClick={
                  previousMonth
                }
              >
                ‹
              </button>

              <button
                type="button"
                className="today-button"
                onClick={
                  goToday
                }
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={
                  nextMonth
                }
              >
                ›
              </button>

            </div>

            <h2>
              {
                monthNames[
                  currentMonth
                    .getMonth()
                ]
              }{" "}
              {
                currentMonth
                  .getFullYear()
              }
            </h2>

            <div className="calendar-count">
              {events.length ===
              1
                ? "1 recordatorio"
                : `${events.length} recordatorios`}
            </div>

          </div>

          {/* DÍAS DE SEMANA */}

          <div className="week-header">

            {weekDays.map(
              (
                day
              ) => (
                <div
                  key={
                    day
                  }
                >
                  {day}
                </div>
              )
            )}

          </div>

          {/* GRID */}

          <div className="calendar-grid">

            {days.map(
              (
                day
              ) => {
                const key =
                  dateKey(
                    day
                  );

                const dayEvents =
                  eventsByDay.get(
                    key
                  ) || [];

                const isCurrentMonth =
                  day.getMonth() ===
                  currentMonth
                    .getMonth();

                const isToday =
                  sameDay(
                    day,
                    new Date()
                  );

                const isSelected =
                  selectedDay
                    ? sameDay(
                        day,
                        selectedDay
                      )
                    : false;

                return (
                  <div
                    key={
                      key
                    }
                    className={[
                      "calendar-day",

                      !isCurrentMonth
                        ? "other-month"
                        : "",

                      isToday
                        ? "today"
                        : "",

                      isSelected
                        ? "selected"
                        : ""
                    ]
                      .filter(
                        Boolean
                      )
                      .join(
                        " "
                      )}
                    onClick={() =>
                      setSelectedDay(
                        day
                      )
                    }
                  >

                    <div className="calendar-day-header">

                      <div className="calendar-day-number">
                        {
                          day.getDate()
                        }
                      </div>

                      {dayEvents.length >
                        0 && (
                        <span className="calendar-day-count">
                          {
                            dayEvents.length
                          }
                        </span>
                      )}

                    </div>

                    <div className="calendar-day-events">

                      {dayEvents
                        .slice(
                          0,
                          3
                        )
                        .map(
                          (
                            calendarEvent
                          ) => (

                            <button
                              type="button"
                              key={
                                calendarEvent.id
                              }
                              className={
                                `calendar-event calendar-priority-${calendarEvent.priority.toLowerCase()}`
                              }
                              onClick={(
                                clickEvent
                              ) => {
                                clickEvent
                                  .stopPropagation();

                                navigate(
                                  `/documents/${calendarEvent.document_id}/reminders`
                                );
                              }}
                            >

                              <span className="calendar-event-time">

                                {new Date(
                                  calendarEvent
                                    .reminder_at
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

                              <span className="calendar-event-title">
                                {
                                  calendarEvent
                                    .file_name
                                }
                              </span>

                            </button>

                          )
                        )}

                      {dayEvents.length >
                        3 && (

                        <div className="more-events">
                          +
                          {
                            dayEvents.length -
                            3
                          }{" "}
                          más
                        </div>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

          {loading && (
            <div className="calendar-loading">
              Actualizando...
            </div>
          )}

        </div>

        {/* PANEL LATERAL */}

        <aside className="calendar-sidebar">

          <div className="calendar-sidebar-header">

            <span>
              DETALLE DEL DÍA
            </span>

            <h2>

              {selectedDay
                ? selectedDay
                    .toLocaleDateString(
                      "es-SV",
                      {
                        weekday:
                          "long",

                        day:
                          "numeric",

                        month:
                          "long",

                        year:
                          "numeric"
                      }
                    )
                : "Selecciona un día"}

            </h2>

            {selectedDay && (

              <button
                type="button"
                className="add-day-reminder"
                onClick={() =>
                  openQuickReminder(
                    selectedDay
                  )
                }
              >
                + Agregar
              </button>

            )}

          </div>

          {!selectedDay ? (

            <div className="calendar-empty">
              Selecciona una fecha
              para ver sus
              recordatorios.
            </div>

          ) : selectedEvents.length ===
            0 ? (

            <div className="calendar-empty calendar-empty-with-action">

              <p>
                No hay recordatorios
                programados para este
                día.
              </p>

              <button
                type="button"
                onClick={() =>
                  openQuickReminder(
                    selectedDay
                  )
                }
              >
                + Crear recordatorio
              </button>

            </div>

          ) : (

            <div className="day-events-list">

              {selectedEvents.map(
                (
                  calendarEvent
                ) => (

                  <article
                    key={
                      calendarEvent.id
                    }
                    className="day-event-card"
                  >

                    <div className="day-event-top">

                      <span
                        className={
                          `priority-dot dot-${calendarEvent.priority.toLowerCase()}`
                        }
                      />

                      <strong>
                        {
                          calendarEvent
                            .file_name
                        }
                      </strong>

                    </div>

                    <div className="day-event-time">

                      {new Date(
                        calendarEvent
                          .reminder_at
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

                    </div>

                    <div className="day-event-meta">

                      <span>
                        Cliente
                      </span>

                      <strong>
                        {
                          calendarEvent
                            .client_name ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div className="day-event-meta">

                      <span>
                        Expediente
                      </span>

                      <strong>
                        {
                          calendarEvent
                            .case_number ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div className="day-event-meta">

                      <span>
                        Responsable
                      </span>

                      <strong>
                        {
                          calendarEvent
                            .responsible_name ||
                          "—"
                        }
                      </strong>

                    </div>

                    <div className="day-event-meta">

                      <span>
                        Prioridad
                      </span>

                      <strong>
                        {
                          priorityLabels[
                            calendarEvent
                              .priority
                          ]
                        }
                      </strong>

                    </div>

                    <div className="day-event-meta">

                      <span>
                        Estado
                      </span>

                      <strong>
                        {
                          statusLabels[
                            calendarEvent
                              .status
                          ]
                        }
                      </strong>

                    </div>

                    <div className="day-event-actions">

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/documents/${calendarEvent.document_id}/reminders`
                          )
                        }
                      >
                        Ver
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/documents/${calendarEvent.document_id}/edit`
                          )
                        }
                      >
                        Editar documento
                      </button>

                    </div>

                  </article>

                )
              )}

            </div>
          )}

        </aside>

      </section>

      {/* =================================================
          MODAL
      ================================================= */}

      {modalOpen && (

        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >

          <form
            className="calendar-reminder-modal"
            onSubmit={
              handleCreateReminder
            }
            onMouseDown={(
              event
            ) =>
              event
                .stopPropagation()
            }
          >

            <div className="modal-header">

              <div>
                <span>
                  CALENDARIO
                </span>

                <h2>
                  Nuevo recordatorio
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

            <div className="calendar-reminder-form">

              {/* DOCUMENTO */}

              <label className="full-field">
                Documento *

                <select
                  required
                  value={
                    documentId
                  }
                  onChange={(
                    event
                  ) =>
                    setDocumentId(
                      event.target.value
                    )
                  }
                >

                  <option value="">
                    Seleccionar documento
                  </option>

                  {documents.map(
                    (
                      document
                    ) => (

                      <option
                        key={
                          document.id
                        }
                        value={
                          document.id
                        }
                      >
                        {
                          document.client_name
                            ? `${document.client_name} — `
                            : ""
                        }

                        {
                          document.file_name
                        }

                        {
                          document.case_number
                            ? ` (${document.case_number})`
                            : ""
                        }
                      </option>

                    )
                  )}

                </select>

              </label>

              {/* FECHA FIJA */}

              <div className="calendar-fixed-date">

                <span>
                  Fecha seleccionada
                </span>

                <strong>

                  {reminderAt
                    ? new Date(
                        `${reminderAt}:00`
                      )
                        .toLocaleDateString(
                          "es-SV",
                          {
                            weekday:
                              "long",

                            day:
                              "numeric",

                            month:
                              "long",

                            year:
                              "numeric"
                          }
                        )
                    : "—"}

                </strong>

                <small>
                  La fecha fue seleccionada
                  desde el calendario.
                </small>

              </div>

              {/* HORA */}

              <label>
                Hora *

                <input
                  type="time"
                  required
                  value={
                    getTimeFromDateTimeLocal(
                      reminderAt
                    )
                  }
                  onChange={(
                    event
                  ) =>
                    updateReminderTime(
                      event.target.value
                    )
                  }
                />

              </label>

              {/* CANAL */}

              <label>
                Canal *

                <select
                  value={
                    notificationType
                  }
                  onChange={(
                    event
                  ) =>
                    setNotificationType(
                      event.target
                        .value as NotificationType
                    )
                  }
                >

                  <option value="EMAIL">
                    Correo
                  </option>

                  <option value="WHATSAPP">
                    WhatsApp
                  </option>

                  <option value="BOTH">
                    Correo + WhatsApp
                  </option>

                </select>

              </label>

              {/* CORREO */}

              {(
                notificationType ===
                  "EMAIL" ||
                notificationType ===
                  "BOTH"
              ) && (

                <label>
                  Correo *

                  <input
                    type="email"
                    value={
                      emailTo
                    }
                    placeholder="correo@empresa.com"
                    onChange={(
                      event
                    ) =>
                      setEmailTo(
                        event.target.value
                      )
                    }
                  />

                </label>

              )}

              {/* WHATSAPP */}

              {(
                notificationType ===
                  "WHATSAPP" ||
                notificationType ===
                  "BOTH"
              ) && (

                <label>
                  WhatsApp *

                  <input
                    type="tel"
                    value={
                      whatsappTo
                    }
                    placeholder="50370000000"
                    onChange={(
                      event
                    ) =>
                      setWhatsappTo(
                        event.target.value
                      )
                    }
                  />

                </label>

              )}

              {/* REPETICIÓN */}

              <label>
                Repetición

                <select
                  value={
                    recurrenceType
                  }
                  onChange={(
                    event
                  ) =>
                    setRecurrenceType(
                      event.target
                        .value as RecurrenceType
                    )
                  }
                >

                  <option value="NONE">
                    No repetir
                  </option>

                  <option value="DAILY">
                    Diario
                  </option>

                  <option value="WEEKLY">
                    Semanal
                  </option>

                  <option value="CUSTOM">
                    Personalizado
                  </option>

                </select>

              </label>

              {/* INTERVALO */}

              {recurrenceType ===
                "CUSTOM" && (

                <label>
                  Cada cuántos días

                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={
                      recurrenceInterval
                    }
                    onChange={(
                      event
                    ) =>
                      setRecurrenceInterval(
                        event.target.value
                      )
                    }
                  />

                </label>

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
                  : "Crear recordatorio"}
              </button>

            </div>

          </form>

        </div>
      )}

    </>
  );
}