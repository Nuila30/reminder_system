const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000";

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,

      headers: {
        "Content-Type": "application/json",
        ...options.headers
      },

      credentials: "include"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
      "Error al procesar la solicitud"
    );
  }

  return data as T;
}