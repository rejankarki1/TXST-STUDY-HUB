import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { createCourseExperience } from "@/api/experiences.api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  experienceFormSchema,
  type ExperienceFormValues,
} from "@/schemas/experience.schema";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { ExperienceDifficulty } from "@/types/experience";

export function AddExperiencePage() {
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
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceFormSchema),
    defaultValues: {
      title: "",
      body: "",
      difficulty: "MEDIUM",
      professorName: "",
      term: "",
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
          setCourseError(
            error.response?.data.message ?? "Unable to load course.",
          );
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

  async function onSubmit(values: ExperienceFormValues) {
    if (!courseId) {
      return;
    }

    try {
      setServerError(null);
      const response = await createCourseExperience(courseId, {
        title: values.title,
        body: values.body,
        difficulty: values.difficulty as ExperienceDifficulty,
        professorName: values.professorName || undefined,
        term: values.term || undefined,
      });
      navigate(`/experiences/${response.data.experience.id}`);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setServerError(
          error.response?.data.message ?? "Unable to create experience.",
        );
        return;
      }

      setServerError("Unable to create experience.");
    }
  }

  if (isCourseLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading course...
        </CardContent>
      </Card>
    );
  }

  if (courseError || !course) {
    return (
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-foreground">
            {courseError ?? "Course not found"}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-3xl border-neutral-200 shadow-none">
      <CardContent className="p-5 sm:p-6">
        <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
          <Link
            to={`/courses/${course.id}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to {course.code}
          </Link>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            Add Course Experience
          </h1>
          <p className="mt-1 text-base font-semibold text-muted-foreground">
            {course.title}
          </p>

          {serverError ? (
            <Alert variant="destructive" className="mt-4">
              {serverError}
            </Alert>
          ) : null}

          <div className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="title"
                className="text-sm font-semibold text-foreground"
              >
                Title
              </label>
              <Input
                id="title"
                type="text"
                {...register("title")}
                className="mt-1"
                placeholder="What should students know?"
              />
              {errors.title ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="body"
                className="text-sm font-semibold text-foreground"
              >
                Experience
              </label>
              <Textarea
                id="body"
                rows={5}
                {...register("body")}
                className="mt-1"
                placeholder="Share what helped, what was difficult, or what you wish you knew before taking this course..."
              />
              {errors.body ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.body.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="difficulty"
                  className="text-sm font-semibold text-foreground"
                >
                  Difficulty
                </label>
                <select
                  id="difficulty"
                  {...register("difficulty")}
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="professorName"
                  className="text-sm font-semibold text-foreground"
                >
                  Professor
                </label>
                <Input
                  id="professorName"
                  type="text"
                  {...register("professorName")}
                  className="mt-1"
                  placeholder="Optional"
                />
                {errors.professorName ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.professorName.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="term"
                  className="text-sm font-semibold text-foreground"
                >
                  Term
                </label>
                <Input
                  id="term"
                  type="text"
                  {...register("term")}
                  className="mt-1"
                  placeholder="Fall 2026"
                />
                {errors.term ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.term.message}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild type="button" variant="outline">
              <Link to={`/courses/${course.id}`}>Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? "Posting..." : "Post Experience"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
