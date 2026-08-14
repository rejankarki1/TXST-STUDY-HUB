import axios from "axios";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { getCourses } from "@/api/courses.api";
import { CourseCard } from "@/components/courses/CourseCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState, ErrorState } from "@/components/layout/StateBlock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";

const COURSES_PER_PAGE = 9;

function getCourseCodePrefix(courseCode: string) {
  return courseCode.split(" ")[0]?.toUpperCase() ?? "";
}

function getCourseDepartmentCode(course: Course) {
  return course.department?.code ?? getCourseCodePrefix(course.code);
}

function getCourseDepartmentLabel(course: Course) {
  return course.department?.name ?? getCourseDepartmentCode(course);
}

export function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [activeDepartment, setActiveDepartment] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
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
          if (isActive) {
            setCourses(response.data.courses);
          }
        })
        .catch((error: unknown) => {
          if (!isActive) return;

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

  const departments = useMemo(() => {
    const departmentMap = new Map<string, string>();

    for (const course of courses) {
      const code = getCourseDepartmentCode(course);
      if (code) {
        departmentMap.set(code, getCourseDepartmentLabel(course));
      }
    }

    return [
      { label: "All departments", prefix: "ALL" },
      ...Array.from(departmentMap.entries())
        .sort(([firstCode], [secondCode]) => firstCode.localeCompare(secondCode))
        .map(([prefix, label]) => ({ label, prefix })),
    ];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    if (activeDepartment === "ALL") {
      return courses;
    }

    return courses.filter(
      (course) => getCourseDepartmentCode(course) === activeDepartment,
    );
  }, [activeDepartment, courses]);

  useEffect(() => {
    if (
      activeDepartment !== "ALL" &&
      !departments.some((department) => department.prefix === activeDepartment)
    ) {
      setActiveDepartment("ALL");
    }
  }, [activeDepartment, departments]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCourses.length / COURSES_PER_PAGE),
  );

  const pagedCourses = filteredCourses.slice(
    (currentPage - 1) * COURSES_PER_PAGE,
    currentPage * COURSES_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  function onSearchChange(value: string) {
    setSearch(value);
    setCurrentPage(1);

    const nextSearch = value.trim();
    if (nextSearch) {
      setSearchParams({ search: nextSearch });
      return;
    }

    setSearchParams({});
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Course Directory"
        title="Explore courses"
        description="Search by course code, title, or department, then enter a course hub built around student knowledge."
      />

      <section className="rounded-2xl border border-border bg-white p-4 shadow-sm">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="courses-search"
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by course code or title..."
            className="h-12 rounded-xl pl-12"
          />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {departments.map((department) => {
            const isActive = department.prefix === activeDepartment;

            return (
              <button
                key={department.prefix}
                type="button"
                onClick={() => {
                  setActiveDepartment(department.prefix);
                  setCurrentPage(1);
                }}
                className={
                  isActive
                    ? "whitespace-nowrap rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground"
                    : "whitespace-nowrap rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
                }
              >
                {department.label}
              </button>
            );
          })}
        </div>
      </section>

      {errorMessage ? <ErrorState message={errorMessage} /> : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="min-h-48 rounded-xl border border-border bg-white p-5"
            >
              <div className="mb-5 h-5 w-20 rounded bg-muted" />
              <div className="mb-3 h-5 w-3/4 rounded bg-muted" />
              <div className="space-y-2">
                <div className="h-4 rounded bg-muted" />
                <div className="h-4 w-4/5 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && !errorMessage && pagedCourses.length === 0 ? (
        <EmptyState
          title="No courses found"
          description="Try a different course code, title, or department."
        />
      ) : null}

      {!isLoading && !errorMessage && pagedCourses.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pagedCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </section>
      ) : null}

      {!isLoading && !errorMessage && totalPages > 1 ? (
        <nav
          className="mt-10 flex items-center justify-center gap-3"
          aria-label="Course pages"
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
          </Button>

          <span className="text-sm font-medium text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
