interface RequestOptions
  extends RequestInit {
  body?: BodyInit | null;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {

  /* =================================================
     NORMALIZAR URL
  ================================================= */

  const normalizedEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  /*
   * LOCAL:
   *
   * /api/... -> Vite proxy -> localhost:4000
   *
   * PRODUCCION:
   *
   * /api/... -> Netlify -> Function -> Express
   */

  const url =
    normalizedEndpoint;

  console.log(
    "[API REQUEST]",
    url
  );

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

    /* =================================================
       LEER RESPUESTA
    ================================================= */

    const contentType =
      response.headers.get(
        "content-type"
      ) || "";

    let data: any;

    if (
      contentType.includes(
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

    /* =================================================
       ERROR HTTP
    ================================================= */

    if (
      !response.ok
    ) {

      throw new Error(
        data.message ||
        `Error ${response.status}`
      );
    }

    /* =================================================
       OK
    ================================================= */

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