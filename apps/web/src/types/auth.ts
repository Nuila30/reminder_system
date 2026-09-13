export type UserRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "EMPLOYEE"
  | "READ_ONLY";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  mustChangePassword: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}