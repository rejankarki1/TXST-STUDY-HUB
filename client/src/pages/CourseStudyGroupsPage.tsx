import axios from "axios";
import { Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { getCourseStudyGroups } from "@/api/studyGroups.api";
import { CourseHeader } from "@/components/courses/CourseHeader";
import { SectionHeader } from "@/components/layout/SectionHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/layout/StateBlock";
import { StudyGroupRow, modeLabels } from "@/components/study-groups/StudyGroupRow";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { CourseStudyGroup, StudyGroupMode } from "@/types/studyGroup";

type StudyGroupFilter = "ALL" | StudyGroupMode;

const filters: Array<{ label: string; value: StudyGroupFilter }> = [
  { label: "All Groups", value: "ALL" },
  { label: "In person", value: "IN_PERSON" },
  { label: "Online", value: "ONLINE" },
];

export function CourseStudyGroupsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [studyGroups, setStudyGroups] = useState<CourseStudyGroup[]>([]);
  const [activeFilter, setActiveFilter] = useState<StudyGroupFilter>("ALL");
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

    Promise.all([getCourseById(courseId), getCourseStudyGroups(courseId)])
      .then(([courseResponse, studyGroupsResponse]) => {
        if (!isActive) {
          return;
        }

        setCourse(courseResponse.data.course);
        setStudyGroups(studyGroupsResponse.data.studyGroups);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load study groups.",
          );
          return;
        }

        setErrorMessage("Unable to load study groups.");
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

  const filteredStudyGroups = useMemo(() => {
    if (activeFilter === "ALL") {
      return studyGroups;
    }

    return studyGroups.filter((studyGroup) => studyGroup.mode === activeFilter);
  }, [activeFilter, studyGroups]);

  if (isLoading) {
    return <LoadingState label="Loading study groups..." />;
  }

  if (errorMessage || !course) {
    return <ErrorState message={errorMessage ?? "Course not found"} />;
  }

  const createGroupAction = (
    <Button asChild>
      <Link to={`/courses/${course.id}/study-groups/new`}>
        <Users className="size-4" aria-hidden="true" />
        Create Study Group
      </Link>
    </Button>
  );

  return (
    <div className="space-y-8">
      <CourseHeader course={course} />

      <section>
        <SectionHeader
          title="Study Groups"
          description="Find classmates to study with."
          action={createGroupAction}
        />

        <div className="mb-6 flex gap-2">
          {filters.map((filter) => {
            const isActive = filter.value === activeFilter;
            const label =
              filter.value === "ALL" ? filter.label : modeLabels[filter.value];

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
          {filteredStudyGroups.length === 0 ? (
            <EmptyState
              title={
                studyGroups.length === 0
                  ? "No study groups yet."
                  : "No study groups match this filter."
              }
              description={
                studyGroups.length === 0
                  ? `Start a study session for ${course.code}.`
                  : "Try a different group mode."
              }
              action={studyGroups.length === 0 ? createGroupAction : undefined}
            />
          ) : null}

          {filteredStudyGroups.map((studyGroup) => (
            <StudyGroupRow key={studyGroup.id} studyGroup={studyGroup} />
          ))}
        </div>
      </section>
    </div>
  );
}
