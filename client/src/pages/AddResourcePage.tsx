import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { createCourseResource } from "@/api/resources.api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  resourceFormSchema,
  type ResourceFormValues,
} from "@/schemas/resource.schema";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { ResourceType } from "@/types/resource";

export function AddResourcePage() {
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
  } = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceFormSchema),
    defaultValues: {
      title: "",
      url: "",
      description: "",
      resourceType: "GUIDE",
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

  async function onSubmit(values: ResourceFormValues) {
    if (!courseId) {
      return;
    }

    try {
      setServerError(null);
      const response = await createCourseResource(courseId, {
        title: values.title,
        description: values.description,
        url: values.url,
        resourceType: values.resourceType as ResourceType,
      });
      navigate(`/resources/${response.data.resource.id}`);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setServerError(
          error.response?.data.message ?? "Unable to create resource.",
        );
        return;
      }

      setServerError("Unable to create resource.");
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
            Add Resource
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
                placeholder="What resource are you sharing?"
              />
              {errors.title ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="url"
                className="text-sm font-semibold text-foreground"
              >
                URL
              </label>
              <Input
                id="url"
                type="url"
                {...register("url")}
                className="mt-1"
                placeholder="https://..."
              />
              {errors.url ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.url.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-semibold text-foreground"
              >
                Description
              </label>
              <Textarea
                id="description"
                rows={5}
                {...register("description")}
                className="mt-1"
                placeholder="Explain why this is useful and when students should use it..."
              />
              {errors.description ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="resourceType"
                className="text-sm font-semibold text-foreground"
              >
                Resource Type
              </label>
              <select
                id="resourceType"
                {...register("resourceType")}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="VIDEO">Video</option>
                <option value="PRACTICE">Practice</option>
                <option value="DOCUMENTATION">Documentation</option>
                <option value="GUIDE">Guide</option>
                <option value="TOOL">Tool</option>
                <option value="OFFICIAL">Official</option>
              </select>
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
              {isSubmitting ? "Posting..." : "Post Resource"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
