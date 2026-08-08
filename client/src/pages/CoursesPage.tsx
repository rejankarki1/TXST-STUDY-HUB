import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router";

import { getCourses } from "../api/courses.api.ts";
import type { ApiErrorResponse } from "../types/auth.ts";
import type { Course } from "../types/course.ts";

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const searchTerm = search.trim();

    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setErrorMessage(null);

      getCourses(searchTerm)
        .then((response) => {
          if (!isActive) {
            return;
          }

          setCourses(response.data.courses);
        })
        .catch((error: unknown) => {
          if (!isActive) {
            return;
          }

          if (axios.isAxiosError<ApiErrorResponse>(error)) {
            setErrorMessage(
              error.response?.data.message ?? "Unable to load courses.",
            );
            return;
          }

          setErrorMessage("Unable to load courses.");
        })
        .finally(() => {
          if (isActive) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-slate-900">Courses</h1>
          <p className="mt-2 text-slate-600">
            Browse TXST courses and open a course hub to find questions,
            experiences, resources, and study groups.
          </p>
        </div>

        <div className="mt-6 max-w-2xl">
          <label
            htmlFor="courses-search"
            className="text-sm font-medium text-slate-700"
          >
            Search courses
          </label>
          <input
            id="courses-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Try CS, Calculus, MATH 2471..."
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-base shadow-sm outline-none transition focus:border-red-900 focus:ring-2 focus:ring-red-900/20"
          />
        </div>
      </section>

      {errorMessage ? (
        <section className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-900">
          {errorMessage}
        </section>
      ) : null}

      <section className="space-y-3">
        {isLoading ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">
            Loading courses...
          </div>
        ) : null}

        {!isLoading && !errorMessage && courses.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-5 text-slate-600 shadow-sm">
            No courses found.
          </div>
        ) : null}

        {!isLoading && !errorMessage
          ? courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-red-900/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
                  <h2 className="text-lg font-bold text-red-950">
                    {course.code}
                  </h2>
                  <p className="text-base font-semibold text-slate-900">
                    {course.title}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {course.description ?? "No description available yet."}
                </p>
              </Link>
            ))
          : null}
      </section>
    </div>
  );
}
