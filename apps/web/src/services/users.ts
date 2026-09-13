import {
  apiRequest
} from "./api";

import type {
  CreateUserData,
  SystemUser,
  UpdateUserData,
  UsersResponse,
  UserStatus
} from "../types/user";

interface UserFilters {
  search?:
    string;

  role?:
    string;

  status?:
    string;
}

export async function getUsers(
  filters:
    UserFilters = {}
) {
  const params =
    new URLSearchParams();

  params.set(
    "search",
    filters.search ||
      ""
  );

  params.set(
    "role",
    filters.role ||
      "ALL"
  );

  params.set(
    "status",
    filters.status ||
      "ALL"
  );

  return apiRequest<UsersResponse>(
    `/api/users?${params.toString()}`
  );
}

export async function createUser(
  data:
    CreateUserData
) {
  return apiRequest<{
    ok: boolean;
    message: string;
    data: SystemUser;
  }>(
    "/api/users",
    {
      method:
        "POST",

      body:
        JSON.stringify(
          data
        )
    }
  );
}

export async function updateUser(
  id: string,
  data:
    UpdateUserData
) {
  return apiRequest<{
    ok: boolean;
    message: string;
    data: SystemUser;
  }>(
    `/api/users/${id}`,
    {
      method:
        "PUT",

      body:
        JSON.stringify(
          data
        )
    }
  );
}

export async function changeUserStatus(
  id: string,
  status:
    UserStatus
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/users/${id}/status`,
    {
      method:
        "POST",

      body:
        JSON.stringify({
          status
        })
    }
  );
}

export async function resetUserPassword(
  id: string,
  password: string
) {
  return apiRequest<{
    ok: boolean;
    message: string;
  }>(
    `/api/users/${id}/reset-password`,
    {
      method:
        "POST",

      body:
        JSON.stringify({
          password
        })
    }
  );
}