import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

import { useAuth } from "../../hooks/useAuth.ts";
import {
  signupFormSchema,
  type SignupFormValues,
} from "../../schemas/auth.schema.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiErrorResponse } from "../../types/auth.ts";

export function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    try {
      setServerError(null);
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      navigate("/", { replace: true });
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setServerError(error.response?.data.message ?? "Signup failed");
        return;
      }

      setServerError("Signup failed");
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-foreground">Create account</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Join the study hub with your basic account details.
      </p>

      {serverError ? (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {serverError}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Name
          </label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            className="mt-1"
          />
          {errors.name ? (
            <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
          ) : null}
        </div>

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
            autoComplete="new-password"
            {...register("password")}
            className="mt-1"
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-destructive">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-foreground"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="mt-1"
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-sm text-destructive">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full"
      >
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
