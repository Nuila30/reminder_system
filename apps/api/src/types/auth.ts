export type UserRole =
  | "ADMIN"
  | "SUPERVISOR"
  | "EMPLOYEE"
  | "READ_ONLY";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}