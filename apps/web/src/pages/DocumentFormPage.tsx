import {
  useEffect,
  useState
} from "react";
import type {
  FormEvent
} from "react";
import {
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";

import {
  createDocument,
  getDocument,
  getDocumentFormOptions,
  updateDocument
} from "../services/documents";

import {
  getCases
} from "../services/cases";

import type {
  CaseRecord
} from "../types/case";

import type {
  DocumentFormOptions,
  DocumentPriority
} from "../types/document";

import "../styles/document-form.css";

export function DocumentFormPage() {
  const navigate =
    useNavigate();

  const { documentId } =
    useParams();

  const [searchParams] =
    useSearchParams();

  const initialCaseId =
    searchParams.get(
      "caseId"
    ) || "";

  const isEditing =
    Boolean(
      documentId
    );

  const [
    options,
    setOptions
  ] =
    useState<
      DocumentFormOptions
    >({
      clients: [],
      documentTypes: [],
      users: []
    });

  const [cases, setCases] =
    useState<CaseRecord[]>(
      []
    );

  const [
    clientId,
    setClientId
  ] =
    useState("");

  const [
    caseId,
    setCaseId
  ] =
    useState(
      initialCaseId
    );

  const [
    documentTypeId,
    setDocumentTypeId
  ] =
    useState("");

  const [
    assignedUserId,
    setAssignedUserId
  ] =
    useState("");

  const [
    fileName,
    setFileName
  ] =
    useState("");

  const [
    dueDate,
    setDueDate
  ] =
    useState("");

  const [
    priority,
    setPriority
  ] =
    useState<DocumentPriority>(
      "MEDIUM"
    );

  const [notes, setNotes] =
    useState("");

  const [
    loading,
    setLoading
  ] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        const response =
          await getDocumentFormOptions();

        setOptions(
          response.data
        );

        if (
          documentId
        ) {
          const documentResponse =
            await getDocument(
              documentId
            );

          const document =
            documentResponse.data;

          setClientId(
            document.client_id
          );

          setCaseId(
            document.case_id
          );

          setDocumentTypeId(
            document.document_type_id
          );

          setAssignedUserId(
            document.assigned_user_id
          );

          setFileName(
            document.file_name
          );

          setPriority(
            document.priority
          );

          setNotes(
            document.notes || ""
          );

          const date =
            new Date(
              document.due_date
            );

          const local =
            new Date(
              date.getTime() -
              date.getTimezoneOffset() *
              60000
            )
              .toISOString()
              .slice(
                0,
                16
              );

          setDueDate(
            local
          );
        }

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar el formulario"
        );

      } finally {
        setLoading(false);
      }
    }

    void load();

  }, [documentId]);

  useEffect(() => {
    if (
      !clientId
    ) {
      setCases([]);
      return;
    }

    async function loadClientCases() {
      try {
        const response =
          await getCases(
            clientId,
            "",
            "ACTIVE",
            1
          );

        setCases(
          response.data
        );

      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "No fue posible obtener los expedientes"
        );
      }
    }

    void loadClientCases();

  }, [clientId]);

  /*
   * Si llegamos desde un expediente
   * averiguamos automáticamente
   * a qué cliente pertenece.
   */
  useEffect(() => {
    if (
      !initialCaseId ||
      clientId ||
      options.clients.length ===
        0
    ) {
      return;
    }

    async function resolveCase() {
      for (
        const client of
        options.clients
      ) {
        try {
          const response =
            await getCases(
              client.id,
              "",
              "ALL",
              1
            );

          const exists =
            response.data.some(
              (item) =>
                item.id ===
                initialCaseId
            );

          if (exists) {
            setClientId(
              client.id
            );

            break;
          }

        } catch {
          // continuar
        }
      }
    }

    void resolveCase();

  }, [
    initialCaseId,
    clientId,
    options.clients
  ]);

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>
){
    event.preventDefault();

    if (
      !clientId ||
      !caseId ||
      !documentTypeId ||
      !assignedUserId ||
      !fileName.trim() ||
      !dueDate
    ) {
      setError(
        "Completa todos los campos obligatorios."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");

      const data = {
        caseId,

        documentTypeId,

        assignedUserId,

        fileName:
          fileName.trim(),

        dueDate:
          new Date(
            dueDate
          ).toISOString(),

        priority,

        notes:
          notes.trim()
      };

      if (
        documentId
      ) {
        await updateDocument(
          documentId,
          data
        );

      } else {
        await createDocument(
          data
        );
      }

      navigate(
        caseId
          ? `/documents?caseId=${caseId}`
          : "/documents"
      );

    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible guardar el documento"
      );

    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="document-form-loading">
        Cargando formulario...
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
            DOCUMENTOS
          </span>

          <h1>
            {isEditing
              ? "Editar documento"
              : "Nuevo documento"}
          </h1>

          <p className="page-description">
            Registra la información
            del documento y su fecha
            límite.
          </p>

        </div>
      </header>

      {error && (
        <div className="alert error">
          {error}
        </div>
      )}

      <form
        className="document-form-card"
        onSubmit={
          handleSubmit
        }
      >

        <section className="form-section">

          <div className="form-section-header">
            <span>01</span>

            <div>
              <h2>
                Expediente
              </h2>

              <p>
                Selecciona el cliente
                y expediente relacionado.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <label>
              Cliente *

              <select
                value={clientId}
                onChange={(event) => {
                  setClientId(
                    event.target.value
                  );

                  setCaseId("");
                }}
              >
                <option value="">
                  Seleccionar cliente
                </option>

                {options.clients.map(
                  (client) => (
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
              Expediente *

              <select
                value={caseId}
                disabled={
                  !clientId
                }
                onChange={(event) =>
                  setCaseId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar expediente
                </option>

                {cases.map(
                  (item) => (
                    <option
                      key={
                        item.id
                      }
                      value={
                        item.id
                      }
                    >
                      {
                        item.case_number
                      }
                    </option>
                  )
                )}
              </select>
            </label>

          </div>

        </section>

        <section className="form-section">

          <div className="form-section-header">
            <span>02</span>

            <div>
              <h2>
                Documento
              </h2>

              <p>
                Información principal
                del documento.
              </p>
            </div>
          </div>

          <div className="form-grid">

            <label className="full-column">
              Nombre del documento *

              <input
                type="text"
                maxLength={255}
                placeholder="Ej. I-589 - Maria Lopez"
                value={fileName}
                onChange={(event) =>
                  setFileName(
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Tipo de documento *

              <select
                value={
                  documentTypeId
                }
                onChange={(event) =>
                  setDocumentTypeId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar tipo
                </option>

                {options.documentTypes.map(
                  (type) => (
                    <option
                      key={
                        type.id
                      }
                      value={
                        type.id
                      }
                    >
                      {
                        type.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Responsable *

              <select
                value={
                  assignedUserId
                }
                onChange={(event) =>
                  setAssignedUserId(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Seleccionar responsable
                </option>

                {options.users.map(
                  (user) => (
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
              Fecha límite *

              <input
                type="datetime-local"
                value={dueDate}
                onChange={(event) =>
                  setDueDate(
                    event.target.value
                  )
                }
              />
            </label>

            <label>
              Prioridad *

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target
                      .value as DocumentPriority
                  )
                }
              >
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

            <label className="full-column">
              Notas

              <textarea
                rows={5}
                maxLength={5000}
                placeholder="Información adicional..."
                value={notes}
                onChange={(event) =>
                  setNotes(
                    event.target.value
                  )
                }
              />
            </label>

          </div>

        </section>

        <div className="document-form-actions">

          <button
            type="button"
            className="secondary-button"
            disabled={saving}
            onClick={() =>
              navigate(
                "/documents"
              )
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : isEditing
              ? "Guardar cambios"
              : "Crear documento"}
          </button>

        </div>

      </form>
    </>
  );
}