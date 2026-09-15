const API_URL =
  import.meta.env.DEV
    ? "http://localhost:4000"
    : "";

interface RequestOptions
  extends RequestInit {
  body?: BodyInit | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {

  const url =
    `${API_URL}${endpoint}`;

  try {

    const response =
      await fetch(
        url,
        {
          ...options,

          credentials:
            "include",

          headers: {
            "Content-Type":
              "application/json",

            ...options.headers
          }
        }
      );

    const contentType =
      response.headers.get(
        "content-type"
      );

    let data: any;

    if (
      contentType?.includes(
        "application/json"
      )
    ) {
      data =
        await response.json();

    } else {

      const text =
        await response.text();

      data = {
        message:
          text ||
          `Respuesta inválida del servidor (${response.status})`
      };
    }

    if (
      !response.ok
    ) {
      throw new Error(
        data.message ||
        `Error ${response.status}`
      );
    }

    return data as T;

  } catch (error) {

    console.error(
      "[API ERROR]",
      {
        url,
        error
      }
    );

    if (
      error instanceof TypeError
    ) {
      throw new Error(
        "No fue posible conectar con el servidor."
      );
    }

    throw error;
  }
}