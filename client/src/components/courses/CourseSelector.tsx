import axios from "axios";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { createCourse, getCourses } from "@/api/courses.api";
import { getDepartments } from "@/api/departments.api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { Department } from "@/types/department";

type CourseSelectorProps = {
  onSelect: (course: Course) => void;
};

type CourseSelectorMode = "search" | "create";

function normalizeCourseCode(code: string) {
  return code
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/^([A-Z]+)\s*(\d)/, "$1 $2");
}

export function CourseSelector({ onSelect }: CourseSelectorProps) {
  const [mode, setMode] = useState<CourseSelectorMode>("search");
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isDepartmentLoading, setIsDepartmentLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(
    null,
  );
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseDescription, setNewCourseDescription] = useState("");
  const [newDepartmentName, setNewDepartmentName] = useState("");

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
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const trimmedSearch = search.trim();
  const normalizedSearchCode = normalizeCourseCode(trimmedSearch);
  const normalizedCourseCode = normalizeCourseCode(newCourseCode);
  const isValidCourseCode = /^[A-Z]{2,5} \d{4}[A-Z]?$/.test(
    normalizedCourseCode,
  );
  const coursePrefix = isValidCourseCode
    ? normalizedCourseCode.split(" ")[0]
    : "";
  const selectedDepartmentMatchesCourse =
    !selectedDepartment || selectedDepartment.code === coursePrefix;
  const canUseExistingDepartment =
    selectedDepartment !== null && selectedDepartmentMatchesCourse;
  const canCreateDepartment =
    coursePrefix.length > 0 && newDepartmentName.trim().length >= 2;

  useEffect(() => {
    if (coursePrefix && !selectedDepartment) {
      setDepartmentSearch(coursePrefix);
    }
  }, [coursePrefix, selectedDepartment]);

  useEffect(() => {
    let isActive = true;
    const searchTerm = departmentSearch.trim();

    const timeoutId = window.setTimeout(() => {
      setIsDepartmentLoading(true);

      getDepartments(searchTerm)
        .then((response) => {
          if (isActive) {
            setDepartments(response.data.departments);
          }
        })
        .finally(() => {
          if (isActive) {
            setIsDepartmentLoading(false);
          }
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [departmentSearch]);

  function openCreateMode(prefillCode?: string) {
    setMode("create");
    setCreateErrorMessage(null);
    setSelectedDepartment(null);
    setNewDepartmentName("");

    if (prefillCode) {
      setNewCourseCode(prefillCode);
    }
  }

  async function onCreateCourse() {
    setIsCreating(true);
    setCreateErrorMessage(null);

    try {
      const response = await createCourse({
        code: normalizedCourseCode,
        title: newCourseTitle,
        description: newCourseDescription || undefined,
        ...(canUseExistingDepartment
          ? { departmentId: selectedDepartment.id }
          : {
              departmentCode: coursePrefix,
              departmentName: newDepartmentName,
            }),
      });

      onSelect(response.data.course);
    } catch (error: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setCreateErrorMessage(
          error.response?.data.message ?? "Unable to add course.",
        );
        return;
      }

      setCreateErrorMessage("Unable to add course.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 rounded-xl border border-border bg-muted/40 p-1 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setMode("search")}
          className={
            mode === "search"
              ? "rounded-lg bg-background px-4 py-3 text-left shadow-sm ring-1 ring-border"
              : "rounded-lg px-4 py-3 text-left transition hover:bg-background/70"
          }
        >
          <span className="block text-sm font-semibold text-foreground">
            Find existing course
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Search courses already in TXST Study Hub.
          </span>
        </button>
        <button
          type="button"
          onClick={() => openCreateMode()}
          className={
            mode === "create"
              ? "rounded-lg bg-background px-4 py-3 text-left shadow-sm ring-1 ring-border"
              : "rounded-lg px-4 py-3 text-left transition hover:bg-background/70"
          }
        >
          <span className="block text-sm font-semibold text-foreground">
            Add new course
          </span>
          <span className="mt-1 block text-xs text-muted-foreground">
            Add a missing course and continue.
          </span>
        </button>
      </div>

      {mode === "search" ? (
        <div className="space-y-3">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label
                htmlFor="create-course-search"
                className="text-sm font-medium text-foreground"
              >
                Search courses
              </label>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto justify-start px-0 text-primary"
                onClick={() => openCreateMode(normalizedSearchCode)}
              >
                Course missing? Add it
              </Button>
            </div>
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="create-course-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by course code or title..."
                className="h-11 pl-9"
              />
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}

          {isLoading ? (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Loading courses...
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && courses.length === 0 ? (
            <Card className="border-dashed shadow-none">
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-foreground">
                    Course not found
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add this course once, then continue to the contribution
                    form.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => openCreateMode(normalizedSearchCode)}
                  className="shrink-0"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add this course
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {!isLoading && !errorMessage && courses.length > 0 ? (
            <div className="grid gap-2">
              {courses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => onSelect(course)}
                  className="group flex items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="rounded-md border border-primary/20 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase text-primary">
                        {course.code}
                      </span>
                      <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
                        {course.title}
                      </h3>
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">
                      {course.description ?? "No description available yet."}
                    </p>
                  </div>
                  <span className="hidden shrink-0 items-center gap-1 text-xs font-bold text-primary sm:inline-flex">
                    Select
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <Card className="border-neutral-200 shadow-none">
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="font-semibold text-foreground">Add new course</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a missing course and connect it to a department.
                </p>
              </div>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto justify-start px-0 text-primary"
                onClick={() => setMode("search")}
              >
                Search existing courses instead
              </Button>
            </div>

            <div className="grid gap-3">
              <div>
                <label
                  htmlFor="new-course-code"
                  className="text-sm font-medium text-foreground"
                >
                  Course code
                </label>
                <Input
                  id="new-course-code"
                  value={normalizedCourseCode}
                  onChange={(event) => setNewCourseCode(event.target.value)}
                  placeholder="CS 2308"
                  className="mt-1 h-10"
                />
                {!isValidCourseCode && normalizedCourseCode.length > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Use a course code like CS 2308.
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="new-course-department"
                  className="text-sm font-medium text-foreground"
                >
                  Department
                </label>
                <div className="relative mt-1">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    id="new-course-department"
                    value={departmentSearch}
                    onChange={(event) => {
                      setDepartmentSearch(event.target.value);
                      setSelectedDepartment(null);
                    }}
                    placeholder="Search CS or Computer Science"
                    className="h-10 pl-9"
                  />
                </div>

                <div className="mt-2 grid gap-2">
                  {isDepartmentLoading ? (
                    <p className="text-xs text-muted-foreground">
                      Loading departments...
                    </p>
                  ) : null}

                  {!isDepartmentLoading && departments.length > 0
                    ? departments.slice(0, 4).map((department) => {
                        const isSelected =
                          selectedDepartment?.id === department.id;

                        return (
                          <button
                            key={department.id}
                            type="button"
                            onClick={() => {
                              setSelectedDepartment(department);
                              setDepartmentSearch(
                                `${department.code} · ${department.name}`,
                              );
                              setNewDepartmentName("");
                            }}
                            className={
                              isSelected
                                ? "rounded-lg border border-primary bg-primary/5 p-3 text-left text-sm"
                                : "rounded-lg border border-border bg-background p-3 text-left text-sm transition hover:border-primary/40"
                            }
                          >
                            <span className="font-semibold text-foreground">
                              {department.code}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              · {department.name}
                            </span>
                          </button>
                        );
                      })
                    : null}
                </div>

                {selectedDepartment && !selectedDepartmentMatchesCourse ? (
                  <p className="mt-2 text-xs text-destructive">
                    Selected department code must match {coursePrefix}.
                  </p>
                ) : null}

                {!canUseExistingDepartment ? (
                  <div className="mt-3 rounded-lg border border-dashed border-border p-3">
                    <p className="text-xs font-medium text-muted-foreground">
                      Add a new department for {coursePrefix || "this course"}
                    </p>
                    <Input
                      value={coursePrefix}
                      readOnly
                      aria-label="New department code"
                      className="mt-2 h-10 bg-muted"
                    />
                    <Input
                      value={newDepartmentName}
                      onChange={(event) =>
                        setNewDepartmentName(event.target.value)
                      }
                      placeholder="Department name, e.g. Biology"
                      className="mt-2 h-10"
                    />
                  </div>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="new-course-title"
                  className="text-sm font-medium text-foreground"
                >
                  Course title
                </label>
                <Input
                  id="new-course-title"
                  value={newCourseTitle}
                  onChange={(event) => setNewCourseTitle(event.target.value)}
                  placeholder="Foundations of Computer Science II"
                  className="mt-1 h-10"
                />
              </div>

              <div>
                <label
                  htmlFor="new-course-description"
                  className="text-sm font-medium text-foreground"
                >
                  Description
                </label>
                <Textarea
                  id="new-course-description"
                  value={newCourseDescription}
                  onChange={(event) =>
                    setNewCourseDescription(event.target.value)
                  }
                  placeholder="Briefly describe what this course covers."
                  className="mt-1 min-h-20"
                />
              </div>
            </div>

            {createErrorMessage ? (
              <p className="text-sm text-destructive">{createErrorMessage}</p>
            ) : null}

            <Button
              type="button"
              onClick={onCreateCourse}
              disabled={
                isCreating ||
                !isValidCourseCode ||
                newCourseTitle.trim().length < 3 ||
                (!canUseExistingDepartment && !canCreateDepartment)
              }
              className="w-full sm:w-auto"
            >
              <Plus className="size-4" aria-hidden="true" />
              {isCreating ? "Adding course..." : "Add course and continue"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
