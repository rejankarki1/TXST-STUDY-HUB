import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";

import { useAuth } from "../../hooks/useAuth.ts";
import {
  loginFormSchema,
  type LoginFormValues,
} from "../../schemas/auth.schema.ts";
import type { ApiErrorResponse } from "../../types/auth.ts";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);
  const from =
    (location.state as LocationState | null)?.from?.pathname ?? "/";

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setServerError(null);
      await login(values);
      navigate(from, { replace: true });
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setServerError(error.response?.data.message ?? "Login failed");
        return;
      }

      setServerError("Login failed");
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-900">Log in</h2>
      <p className="mt-1 text-sm text-slate-600">
        Use your account to access protected pages.
      </p>

      {serverError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-red-700">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-red-700">
              {errors.password.message}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Logging in..." : "Log In"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-600">
        Need an account?{" "}
        <Link to="/signup" className="font-medium text-red-900 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}

