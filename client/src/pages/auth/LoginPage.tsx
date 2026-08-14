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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-foreground">Log in</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Use your account to access protected pages.
      </p>

      {serverError ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            {...register("email")}
            className="mt-1"
          />
          {errors.email ? (
            <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="password"
            className="text-sm font-medium text-foreground"
          >
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
            className="mt-1"
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full"
      >
        {isSubmitting ? "Logging in..." : "Log In"}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Need an account?{" "}
        <Link to="/signup" className="font-medium text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
