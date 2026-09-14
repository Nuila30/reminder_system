const API_URL =
  import.meta.env.VITE_API_URL ||
  (
    import.meta.env.DEV
      ? "http://localhost:4000"
      : ""
  );

interface RequestOptions
  extends RequestInit {
  body?:
    BodyInit | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options:
    RequestOptions = {}
): Promise<T> {

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          ...options.headers
        },

        credentials:
          "include"
      }
    );

  const contentType =
    response.headers.get(
      "content-type"
    );

  const data =
    contentType?.includes(
      "application/json"
    )
      ? await response.json()
      : {
          message:
            await response.text()
        };

  if (
    !response.ok
  ) {
    throw new Error(
      data.message ||
      "Ocurrió un error al procesar la solicitud"
    );
  }

  return data as T;
}