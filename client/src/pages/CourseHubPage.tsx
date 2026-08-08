import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getCourseById } from "../api/courses.api.ts";
import { getCourseQuestions } from "../api/questions.api.ts";
import type { ApiErrorResponse } from "../types/auth.ts";
import type { Course } from "../types/course.ts";
import type { CourseQuestion } from "../types/question.ts";

const hubSections = [
  {
    title: "Overview",
    emptyText: "Course overview will be expanded later.",
  },
  {
    title: "Experiences",
    emptyText: "No experiences yet.",
  },
  {
    title: "Resources",
    emptyText: "No resources yet.",
  },
  {
    title: "Study Groups",
    emptyText: "No study groups yet.",
  },
];

export function CourseHubPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [questionsErrorMessage, setQuestionsErrorMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    let isActive = true;

    if (!id) {
      setErrorMessage("Course not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    getCourseById(id)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setCourse(response.data.course);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load course.",
          );
          return;
        }

        setErrorMessage("Unable to load course.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    let isActive = true;

    if (!id) {
      setQuestions([]);
      setIsQuestionsLoading(false);
      return;
    }

    setIsQuestionsLoading(true);
    setQuestionsErrorMessage(null);

    getCourseQuestions(id)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setQuestions(response.data.questions);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setQuestionsErrorMessage(
            error.response?.data.message ?? "Unable to load questions.",
          );
          return;
        }

        setQuestionsErrorMessage("Unable to load questions.");
      })
      .finally(() => {
        if (isActive) {
          setIsQuestionsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [id]);

  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
        Loading course...
      </section>
    );
  }

  if (errorMessage || !course) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">
          {errorMessage ?? "Course not found"}
        </h1>
        <p className="mt-2 text-slate-600">
          This course could not be loaded.
        </p>
        <Link
          to="/courses"
          className="mt-6 inline-flex rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950"
        >
          Back to Courses
        </Link>
      </section>
    );
  }

  const recentQuestions = questions.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <Link
          to="/courses"
          className="text-sm font-medium text-red-900 hover:underline"
        >
          Back to Courses
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-red-950">
          {course.code}
        </h1>
        <p className="mt-2 text-xl font-semibold text-slate-900">
          {course.title}
        </p>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">
          {course.description ?? "No description available yet."}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Questions
            </h2>
            <Link
              to={`/courses/${course.id}/questions/new`}
              className="inline-flex rounded-md bg-red-900 px-3 py-2 text-sm font-semibold text-white hover:bg-red-950"
            >
              Ask Question
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {isQuestionsLoading ? (
              <p className="text-sm text-slate-600">Loading questions...</p>
            ) : null}

            {!isQuestionsLoading && questionsErrorMessage ? (
              <p className="text-sm text-red-900">{questionsErrorMessage}</p>
            ) : null}

            {!isQuestionsLoading &&
            !questionsErrorMessage &&
            recentQuestions.length === 0 ? (
              <p className="text-sm text-slate-600">No questions yet.</p>
            ) : null}

            {!isQuestionsLoading && !questionsErrorMessage
              ? recentQuestions.map((question) => (
                  <Link
                    key={question.id}
                    to={`/questions/${question.id}`}
                    className="block rounded-md border border-slate-200 p-3 transition hover:border-red-900/40 hover:bg-slate-50"
                  >
                    <h3 className="font-medium text-slate-900">
                      {question.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {question._count.answers}{" "}
                      {question._count.answers === 1 ? "answer" : "answers"}
                    </p>
                  </Link>
                ))
              : null}
          </div>

          {questions.length > 3 ? (
            <Link
              to={`/courses/${course.id}/questions`}
              className="mt-4 inline-flex text-sm font-medium text-red-900 hover:underline"
            >
              View all questions -&gt;
            </Link>
          ) : null}
        </article>

        {hubSections.map((section) => (
          <article
            key={section.title}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {section.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {section.title === "Overview"
                ? course.description ?? section.emptyText
                : section.emptyText}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
