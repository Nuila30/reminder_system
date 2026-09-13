import {
  useCallback,
  useEffect,
  useState
} from "react";

import type {
  FormEvent
} from "react";

import {
  useNavigate,
  useParams
} from "react-router-dom";

import {
  cancelReminder,
  createReminder,
  deleteReminder,
  getReminders,
  reactivateReminder,
  updateReminder
} from "../services/reminders";

import {
  getDocument
} from "../services/documents";

import type {
  DocumentRecord
} from "../types/document";

import type {
  NotificationType,
  RecurrenceType,
  ReminderRecord,
  ReminderStatus
} from "../types/reminder";

import "../styles/reminders.css";

const statusLabels:
  Record<
    ReminderStatus,
    string
  > = {
    SCHEDULED:
      "Programado",

    PROCESSING:
      "Procesando",

    SENT:
      "Enviado",

    FAILED:
      "Fallido",

    CANCELLED:
      "Cancelado"
  };

const notificationLabels:
  Record<
    NotificationType,
    string
  > = {
    EMAIL:
      "Correo",

    WHATSAPP:
      "WhatsApp",

    BOTH:
      "Correo + WhatsApp"
  };

const recurrenceLabels:
  Record<
    RecurrenceType,
    string
  > = {
    NONE:
      "No se repite",

    DAILY:
      "Diario",

    WEEKLY:
      "Semanal",

    CUSTOM:
      "Personalizado"
  };

function toLocalDateTime(
  value: string
) {
  const date =
    new Date(value);

  const local =
    new Date(
      date.getTime() -
      date.getTimezoneOffset() *
      60000
    );

  return local
    .toISOString()
    .slice(
      0,
      16
    );
}

export function RemindersPage() {
  const navigate =
    useNavigate();

  const {
    documentId
  } =
    useParams();

  const [
    document,
    setDocument
  ] =
    useState<
      DocumentRecord | null
    >(null);

  const [
    reminders,
    setReminders
  ] =
    useState<
      ReminderRecord[]
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
    editingReminder,
    setEditingReminder
  ] =
    useState<
      ReminderRecord | null
    >(null);

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

  const loadData =
    useCallback(
      async () => {
        if (!documentId) {
          return;
        }

        try {
          setLoading(
            true
          );

          setError(
            ""
          );

          const [
            documentResponse,
            remindersResponse
          ] =
            await Promise.all([
              getDocument(
                documentId
              ),

              getReminders(
                documentId
              )
            ]);

          setDocument(
            documentResponse.data
          );

          setReminders(
            remindersResponse.data
          );

        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar los recordatorios"
          );

        } finally {
          setLoading(
            false
          );
        }
      },
      [documentId]
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function resetForm() {
    setEditingReminder(
      null
    );

    setReminderAt(
      ""
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
  }

  function openCreateModal() {
    resetForm();

    const defaultDate =
      new Date(
        Date.now() +
        60 *
        60 *
        1000
      );

    setReminderAt(
      toLocalDateTime(
        defaultDate
          .toISOString()
      )
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

  function openEditModal(
    reminder:
      ReminderRecord
  ) {
    setEditingReminder(
      reminder
    );

    setReminderAt(
      toLocalDateTime(
        reminder.reminder_at
      )
    );

    setNotificationType(
      reminder.notification_type
    );

    setEmailTo(
      reminder.email_to ||
      ""
    );

    setWhatsappTo(
      reminder.whatsapp_to ||
      ""
    );

    setRecurrenceType(
      reminder.recurrence_type
    );

    setRecurrenceInterval(
      String(
        reminder.recurrence_interval ||
        1
      )
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
    if (saving) {
      return;
    }

    setModalOpen(
      false
    );

    resetForm();
  }

  async function handleSave(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !documentId ||
      !reminderAt
    ) {
      setError(
        "Selecciona la fecha y hora."
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
      Number(
        recurrenceInterval
      ) < 1
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

      const commonData = {
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
      };

      if (
        editingReminder
      ) {
        const response =
          await updateReminder(
            editingReminder.id,
            commonData
          );

        setSuccess(
          response.message
        );

      } else {
        const response =
          await createReminder({
            documentId,
            ...commonData
          });

        setSuccess(
          response.message
        );
      }

      setModalOpen(
        false
      );

      resetForm();

      await loadData();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el recordatorio"
      );

    } finally {
      setSaving(
        false
      );
    }
  }

  async function runAction(
    action:
      () => Promise<{
        message: string;
      }>
  ) {
    try {
      setError(
        ""
      );

      setSuccess(
        ""
      );

      const response =
        await action();

      setSuccess(
        response.message
      );

      await loadData();

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible realizar la operación"
      );
    }
  }

  async function handleDelete(
    reminder:
      ReminderRecord
  ) {
    const confirmed =
      window.confirm(
        "¿Eliminar definitivamente este recordatorio?"
      );

    if (!confirmed) {
      return;
    }

    await runAction(
      () =>
        deleteReminder(
          reminder.id
        )
    );
  }

  if (
    loading
  ) {
    return (
      <div className="reminders-loading">
        Cargando recordatorios...
      </div>
    );
  }

  if (
    !documentId
  ) {
    return (
      <div className="alert error">
        Documento inválido.
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
              navigate(
                "/documents"
              )
            }
          >
            ← Documentos
          </button>

          <span>
            RECORDATORIOS
          </span>

          <h1>
            {document?.file_name ||
              "Recordatorios"}
          </h1>

          {document && (
            <p className="page-description">
              {document.client_name}
              {" · "}
              {document.case_number}
            </p>
          )}

        </div>

        <button
          type="button"
          className="new-document"
          disabled={
            document?.status ===
              "COMPLETED" ||
            document?.status ===
              "CANCELLED"
          }
          onClick={
            openCreateModal
          }
        >
          + Nuevo recordatorio
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

      {document && (
        <section className="reminder-document-info">

          <div>
            <span>
              Fecha límite
            </span>

            <strong>
              {new Date(
                document.due_date
              ).toLocaleString(
                "es-SV",
                {
                  dateStyle:
                    "medium",

                  timeStyle:
                    "short"
                }
              )}
            </strong>
          </div>

          <div>
            <span>
              Estado
            </span>

            <strong>
              {
                document.status
              }
            </strong>
          </div>

          <div>
            <span>
              Prioridad
            </span>

            <strong>
              {
                document.priority
              }
            </strong>
          </div>

        </section>
      )}

      <section className="reminders-panel">

        <div className="reminders-count">
          {reminders.length ===
          1
            ? "1 recordatorio"
            : `${reminders.length} recordatorios`}
        </div>

        <div className="table-wrapper">

          <table className="reminders-table">

            <thead>
              <tr>
                <th>
                  Fecha y hora
                </th>

                <th>
                  Canal
                </th>

                <th>
                  Destino
                </th>

                <th>
                  Repetición
                </th>

                <th>
                  Estado
                </th>

                <th>
                  Intentos
                </th>

                <th>
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody>

              {reminders.length ===
              0 ? (

                <tr>
                  <td
                    colSpan={7}
                    className="table-message"
                  >
                    Este documento todavía no tiene recordatorios.
                  </td>
                </tr>

              ) : (

                reminders.map(
                  (
                    reminder
                  ) => (

                    <tr
                      key={
                        reminder.id
                      }
                    >

                      <td>
                        <strong>
                          {new Date(
                            reminder.reminder_at
                          ).toLocaleString(
                            "es-SV",
                            {
                              dateStyle:
                                "medium",

                              timeStyle:
                                "short"
                            }
                          )}
                        </strong>
                      </td>

                      <td>
                        {
                          notificationLabels[
                            reminder.notification_type
                          ]
                        }
                      </td>

                      <td>
                        <div className="reminder-destinations">

                          {reminder.email_to && (
                            <span>
                              {
                                reminder.email_to
                              }
                            </span>
                          )}

                          {reminder.whatsapp_to && (
                            <span>
                              {
                                reminder.whatsapp_to
                              }
                            </span>
                          )}

                        </div>
                      </td>

                      <td>
                        {reminder.recurrence_type ===
                        "CUSTOM"
                          ? `Cada ${reminder.recurrence_interval || 1} día(s)`
                          : recurrenceLabels[
                              reminder.recurrence_type
                            ]}
                      </td>

                      <td>
                        <span
                          className={
                            `reminder-status reminder-${reminder.status.toLowerCase()}`
                          }
                        >
                          {
                            statusLabels[
                              reminder.status
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        {
                          reminder.retry_count
                        }
                        {" / "}
                        {
                          reminder.max_retries
                        }
                      </td>

                      <td>
                        <div className="row-actions">

                          {reminder.status !==
                            "SENT" && (

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  reminder
                                )
                              }
                            >
                              Editar
                            </button>

                          )}

                          {(
                            reminder.status ===
                              "CANCELLED" ||
                            reminder.status ===
                              "FAILED"
                          ) ? (

                            <button
                              type="button"
                              onClick={() =>
                                void runAction(
                                  () =>
                                    reactivateReminder(
                                      reminder.id
                                    )
                                )
                              }
                            >
                              Reactivar
                            </button>

                          ) : reminder.status !==
                            "SENT" ? (

                            <button
                              type="button"
                              onClick={() =>
                                void runAction(
                                  () =>
                                    cancelReminder(
                                      reminder.id
                                    )
                                )
                              }
                            >
                              Cancelar
                            </button>

                          ) : null}

                          {reminder.status !==
                            "SENT" && (

                            <button
                              type="button"
                              className="danger-action"
                              onClick={() =>
                                void handleDelete(
                                  reminder
                                )
                              }
                            >
                              Eliminar
                            </button>

                          )}

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

      {modalOpen && (

        <div
          className="modal-backdrop"
          onMouseDown={
            closeModal
          }
        >

          <form
            className="reminder-modal"
            onSubmit={
              handleSave
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
                  RECORDATORIO
                </span>

                <h2>
                  {editingReminder
                    ? "Editar recordatorio"
                    : "Nuevo recordatorio"}
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

            <div className="reminder-form">

              <label>
                Fecha y hora *

                <input
                  type="datetime-local"
                  required
                  value={
                    reminderAt
                  }
                  onChange={(
                    event
                  ) =>
                    setReminderAt(
                      event.target.value
                    )
                  }
                />
              </label>

              <label>
                Tipo de notificación *

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

              {(
                notificationType ===
                  "EMAIL" ||
                notificationType ===
                  "BOTH"
              ) && (

                <label>
                  Correo de destino *

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

                  <small>
                    Incluye código de país.
                  </small>
                </label>

              )}

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

              {recurrenceType ===
                "CUSTOM" && (

                <label>
                  Repetir cada *

                  <div className="interval-field">

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

                    <span>
                      días
                    </span>

                  </div>
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
                  : editingReminder
                  ? "Guardar cambios"
                  : "Crear recordatorio"}
              </button>

            </div>

          </form>

        </div>
      )}
    </>
  );
}