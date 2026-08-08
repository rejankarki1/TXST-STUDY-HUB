import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";

import { getCourseById } from "../api/courses.api.ts";
import { createCourseQuestion } from "../api/questions.api.ts";
import {
  askQuestionFormSchema,
  type AskQuestionFormValues,
} from "../schemas/question.schema.ts";
import type { ApiErrorResponse } from "../types/auth.ts";
import type { Course } from "../types/course.ts";

export function AskQuestionPage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [isCourseLoading, setIsCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
  } = useForm<AskQuestionFormValues>({
    resolver: zodResolver(askQuestionFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  useEffect(() => {
    let isActive = true;

    if (!courseId) {
      setCourseError("Course not found");
      setIsCourseLoading(false);
      return;
    }

    setIsCourseLoading(true);
    setCourseError(null);

    getCourseById(courseId)
      .then((response) => {
        if (isActive) {
          setCourse(response.data.course);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setCourseError(error.response?.data.message ?? "Unable to load course.");
          return;
        }

        setCourseError("Unable to load course.");
      })
      .finally(() => {
        if (isActive) {
          setIsCourseLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [courseId]);

  async function onSubmit(values: AskQuestionFormValues) {
    if (!courseId) {
      return;
    }

    try {
      setServerError(null);
      const response = await createCourseQuestion(courseId, {
        title: values.title,
        body: values.description,
      });
      navigate(`/questions/${response.data.question.id}`);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setServerError(error.response?.data.message ?? "Unable to create question.");
        return;
      }

      setServerError("Unable to create question.");
    }
  }

  if (isCourseLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
        Loading course...
      </section>
    );
  }

  if (courseError || !course) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {courseError ?? "Course not found"}
        </h1>
        <Link
          to="/courses"
          className="mt-6 inline-flex rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950"
        >
          Back to Courses
        </Link>
      </section>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <Link
        to={`/courses/${course.id}`}
        className="text-sm font-medium text-red-900 hover:underline"
      >
        Back to {course.code}
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-slate-900">
        Ask a Question
      </h1>
      <p className="mt-2 text-slate-600">
        Your question will be posted in {course.code}: {course.title}.
      </p>

      {serverError ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="title" className="text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
          {errors.title ? (
            <p className="mt-1 text-sm text-red-700">{errors.title.message}</p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="description"
            className="text-sm font-medium text-slate-700"
          >
            Description
          </label>
          <textarea
            id="description"
            rows={8}
            {...register("description")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
          {errors.description ? (
            <p className="mt-1 text-sm text-red-700">
              {errors.description.message}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Posting..." : "Post Question"}
      </button>
    </form>
  );
}
