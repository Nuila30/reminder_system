export type UserRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "EMPLOYEE"
  | "READ_ONLY";

export type UserStatus =
  | "ACTIVE"
  | "INACTIVE";

export interface SystemUser {
  id: string;

  email: string;

  full_name: string;

  role:
    UserRole;

  status:
    UserStatus;

  must_change_password:
    boolean;

  last_login_at:
    string | null;

  created_at:
    string;

  updated_at:
    string;
}

export interface UserStats {
  total:
    number;

  active:
    number;

  inactive:
    number;

  admins:
    number;
}

export interface UsersResponse {
  ok:
    boolean;

  data:
    SystemUser[];

  stats:
    UserStats;
}

export interface CreateUserData {
  fullName:
    string;

  email:
    string;

  role:
    UserRole;

  password:
    string;

  mustChangePassword:
    boolean;
}

export interface UpdateUserData {
  fullName:
    string;

  email:
    string;

  role:
    UserRole;
}