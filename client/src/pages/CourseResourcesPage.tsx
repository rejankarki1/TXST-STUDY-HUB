import axios from "axios";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { getCourseResources } from "@/api/resources.api";
import { CourseHeader } from "@/components/courses/CourseHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/layout/StateBlock";
import { ResourceRow, resourceTypeLabels } from "@/components/resources/ResourceRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { CourseResource, ResourceType } from "@/types/resource";

type ResourceFilter = "ALL" | ResourceType;

const filters: Array<{ label: string; value: ResourceFilter }> = [
  { label: "All", value: "ALL" },
  { label: "Video", value: "VIDEO" },
  { label: "Practice", value: "PRACTICE" },
  { label: "Docs", value: "DOCUMENTATION" },
  { label: "Guide", value: "GUIDE" },
  { label: "Tool", value: "TOOL" },
  { label: "Official", value: "OFFICIAL" },
];

export function CourseResourcesPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [activeFilter, setActiveFilter] = useState<ResourceFilter>("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!courseId) {
      setErrorMessage("Course not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([getCourseById(courseId), getCourseResources(courseId)])
      .then(([courseResponse, resourcesResponse]) => {
        if (!isActive) {
          return;
        }

        setCourse(courseResponse.data.course);
        setResources(resourcesResponse.data.resources);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load resources.",
          );
          return;
        }

        setErrorMessage("Unable to load resources.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [courseId]);

  const filteredResources = useMemo(() => {
    if (activeFilter === "ALL") {
      return resources;
    }

    return resources.filter(
      (resource) => resource.resourceType === activeFilter,
    );
  }, [activeFilter, resources]);

  if (isLoading) {
    return <LoadingState label="Loading resources..." />;
  }

  if (errorMessage || !course) {
    return <ErrorState message={errorMessage ?? "Course not found"} />;
  }

  const addResourceAction = (
    <Button asChild>
      <Link to={`/courses/${course.id}/resources/new`}>
        <Plus className="size-4" aria-hidden="true" />
        Add Resource
      </Link>
    </Button>
  );

  return (
    <div className="space-y-8">
      <CourseHeader course={course} />

      <section>
        <SectionHeader
          title="Resources"
          description="Useful external links and learning material for this course."
          action={addResourceAction}
        />

        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((filter) => {
            const isActive = filter.value === activeFilter;
            const label =
              filter.value === "ALL"
                ? filter.label
                : resourceTypeLabels[filter.value];

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {filteredResources.length === 0 ? (
            <EmptyState
              title={
                resources.length === 0
                  ? "No resources yet."
                  : "No resources match this filter."
              }
              description={
                resources.length === 0
                  ? "Know a helpful video, guide, practice tool, or official reference? Add it for this course."
                  : "Try a different resource type."
              }
              action={resources.length === 0 ? addResourceAction : undefined}
            />
          ) : null}

          {filteredResources.map((resource) => (
            <ResourceRow key={resource.id} resource={resource} />
          ))}
        </div>
      </section>
    </div>
  );
}
