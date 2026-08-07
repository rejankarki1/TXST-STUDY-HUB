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
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-slate-900">Create account</h2>
      <p className="mt-1 text-sm text-slate-600">
        Join the study hub with your basic account details.
      </p>

      {serverError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            {...register("name")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
          {errors.name ? (
            <p className="mt-1 text-sm text-red-700">{errors.name.message}</p>
          ) : null}
        </div>

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
            autoComplete="new-password"
            {...register("password")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
          {errors.password ? (
            <p className="mt-1 text-sm text-red-700">
              {errors.password.message}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            {...register("confirmPassword")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
          {errors.confirmPassword ? (
            <p className="mt-1 text-sm text-red-700">
              {errors.confirmPassword.message}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 w-full rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account..." : "Sign Up"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-red-900 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}

