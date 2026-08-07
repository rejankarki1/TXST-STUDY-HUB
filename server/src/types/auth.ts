import type { UserRole } from "../generated/prisma/enums.js";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

export type AccessTokenPayload = {
  userId: string;
  email: string;
  role: UserRole;
};

