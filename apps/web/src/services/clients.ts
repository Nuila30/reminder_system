import {
  apiRequest
} from "./api";

import type {
  Client,
  ClientPagination,
  ClientStatus
} from "../types/client";

interface ClientsResponse {
  ok: boolean;

  data: Client[];

  pagination:
    ClientPagination;
}

interface ClientResponse {
  ok: boolean;

  message: string;

  data: Client;
}

export async function getClients(
  search = "",
  status = "ALL",
  page = 1
) {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    search
  );

  params.set(
    "status",
    status
  );

  params.set(
    "page",
    String(page)
  );

  params.set(
    "limit",
    "10"
  );

  return apiRequest<ClientsResponse>(
    `/api/clients?${params.toString()}`
  );
}

export async function createClient(
  name: string
) {
  return apiRequest<ClientResponse>(
    "/api/clients",
    {
      method: "POST",

      body:
        JSON.stringify({
          name
        })
    }
  );
}

export async function updateClient(
  id: string,
  data: {
    name?: string;
    status?: ClientStatus;
  }
) {
  return apiRequest<ClientResponse>(
    `/api/clients/${id}`,
    {
      method: "PUT",

      body:
        JSON.stringify(data)
    }
  );
}

export async function deleteClient(
  id: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/clients/${id}`,
    {
      method: "DELETE"
    }
  );
}
export async function getClientById(
  id: string
) {
  return apiRequest<{
    ok: boolean;

    data: {
      id: string;
      name: string;
      status:
        "ACTIVE" | "ARCHIVED";
      created_at: string;
      updated_at: string;
    };
  }>(
    `/api/clients/${id}`
  );
}