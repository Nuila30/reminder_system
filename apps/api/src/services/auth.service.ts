import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { sql } from "../config/db.js";
import { env } from "../config/env.js";

import type {
  AuthTokenPayload,
  UserRole
} from "../types/auth.js";

interface DatabaseUser {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  must_change_password: boolean;
}

interface AuthenticatedDatabaseUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: "ACTIVE" | "INACTIVE";
  must_change_password: boolean;
}

export async function authenticateUser(
  email: string,
  password: string
) {
  const result = await sql`
    SELECT
      id,
      email,
      password_hash,
      full_name,
      role,
      status,
      must_change_password
    FROM users
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `;

  if (result.length === 0) {
    return null;
  }

  const user =
    result[0] as unknown as DatabaseUser;

  if (user.status !== "ACTIVE") {
    return null;
  }

  const passwordIsValid =
    await bcrypt.compare(
      password,
      user.password_hash
    );

  if (!passwordIsValid) {
    return null;
  }

  await sql`
    UPDATE users
    SET
      last_login_at = NOW(),
      updated_at = NOW()
    WHERE id = ${user.id}
  `;

  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(
    payload,
    env.JWT_SECRET,
    {
      expiresIn: "8h"
    }
  );

  return {
    token,

    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      mustChangePassword:
        user.must_change_password
    }
  };
}

export async function getAuthenticatedUser(
  userId: string
) {
  const result = await sql`
    SELECT
      id,
      email,
      full_name,
      role,
      status,
      must_change_password
    FROM users
    WHERE id = ${userId}
    LIMIT 1
  `;

  if (result.length === 0) {
    return null;
  }

  const user =
    result[0] as unknown as AuthenticatedDatabaseUser;

  if (user.status !== "ACTIVE") {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    mustChangePassword:
      user.must_change_password
  };
}