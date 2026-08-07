export type UserRole = "STUDENT" | "MODERATOR" | "ADMIN";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  name?: string;
  email: string;
  password: string;
};

export type AuthSuccessResponse = {
  success: true;
  message: string;
  data: {
    user: AuthUser;
    accessToken: string;
  };
};

export type CurrentUserResponse = {
  success: true;
  data: {
    user: AuthUser;
  };
};

export type BasicSuccessResponse = {
  success: true;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

