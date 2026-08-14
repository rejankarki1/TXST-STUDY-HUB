import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { createCourseStudyGroup } from "@/api/studyGroups.api";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  studyGroupFormSchema,
  type StudyGroupFormValues,
} from "@/schemas/studyGroup.schema";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";

export function CreateStudyGroupPage() {
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
    watch,
  } = useForm<StudyGroupFormValues>({
    resolver: zodResolver(studyGroupFormSchema),
    defaultValues: {
      title: "",
      description: "",
      startDateTime: "",
      mode: "IN_PERSON",
      location: "",
      onlineDetails: "",
      maxMembers: 4,
    },
  });

  const selectedMode = watch("mode");

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

  async function onSubmit(values: StudyGroupFormValues) {
    if (!courseId) {
      return;
    }

    try {
      setServerError(null);
      const response = await createCourseStudyGroup(courseId, {
        title: values.title,
        description: values.description,
        startDateTime: new Date(values.startDateTime).toISOString(),
        mode: values.mode,
        location: values.location || undefined,
        onlineDetails: values.onlineDetails || undefined,
        maxMembers: values.maxMembers,
      });
      navigate(`/study-groups/${response.data.studyGroup.id}`);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setServerError(
          error.response?.data.message ?? "Unable to create study group.",
        );
        return;
      }

      setServerError("Unable to create study group.");
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
            Create Study Group
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
                Group title
              </label>
              <Input
                id="title"
                type="text"
                {...register("title")}
                className="mt-1"
                placeholder="Exam 1 review group"
              />
              {errors.title ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.title.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-semibold text-foreground"
              >
                What will the group study?
              </label>
              <Textarea
                id="description"
                rows={5}
                {...register("description")}
                className="mt-1"
                placeholder="Share the topic, goal, or what classmates should bring..."
              />
              {errors.description ? (
                <p className="mt-1 text-sm text-destructive">
                  {errors.description.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="startDateTime"
                  className="text-sm font-semibold text-foreground"
                >
                  Date and time
                </label>
                <Input
                  id="startDateTime"
                  type="datetime-local"
                  {...register("startDateTime")}
                  className="mt-1"
                />
                {errors.startDateTime ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.startDateTime.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor="maxMembers"
                  className="text-sm font-semibold text-foreground"
                >
                  Maximum members
                </label>
                <Input
                  id="maxMembers"
                  type="number"
                  min={2}
                  max={100}
                  {...register("maxMembers", { valueAsNumber: true })}
                  className="mt-1"
                />
                {errors.maxMembers ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.maxMembers.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label
                htmlFor="mode"
                className="text-sm font-semibold text-foreground"
              >
                Mode
              </label>
              <select
                id="mode"
                {...register("mode")}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <option value="IN_PERSON">In person</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            {selectedMode === "IN_PERSON" ? (
              <div>
                <label
                  htmlFor="location"
                  className="text-sm font-semibold text-foreground"
                >
                  Location
                </label>
                <Input
                  id="location"
                  type="text"
                  {...register("location")}
                  className="mt-1"
                  placeholder="Alkek Library, 4th floor"
                />
                {errors.location ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.location.message}
                  </p>
                ) : null}
              </div>
            ) : (
              <div>
                <label
                  htmlFor="onlineDetails"
                  className="text-sm font-semibold text-foreground"
                >
                  Online details
                </label>
                <Input
                  id="onlineDetails"
                  type="text"
                  {...register("onlineDetails")}
                  className="mt-1"
                  placeholder="Zoom link or Discord channel"
                />
                {errors.onlineDetails ? (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.onlineDetails.message}
                  </p>
                ) : null}
              </div>
            )}
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
              {isSubmitting ? "Creating..." : "Create Study Group"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
