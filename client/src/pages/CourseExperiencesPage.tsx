import axios from "axios";
import { PenSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { getCourseExperiences } from "@/api/experiences.api";
import { CourseHeader } from "@/components/courses/CourseHeader";
import { ExperienceRow } from "@/components/experiences/ExperienceRow";
import { SectionHeader } from "@/components/layout/SectionHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/layout/StateBlock";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { CourseExperience } from "@/types/experience";

export function CourseExperiencesPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [experiences, setExperiences] = useState<CourseExperience[]>([]);
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

    Promise.all([getCourseById(courseId), getCourseExperiences(courseId)])
      .then(([courseResponse, experiencesResponse]) => {
        if (!isActive) {
          return;
        }

        setCourse(courseResponse.data.course);
        setExperiences(experiencesResponse.data.experiences);
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load experiences.",
          );
          return;
        }

        setErrorMessage("Unable to load experiences.");
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

  if (isLoading) {
    return <LoadingState label="Loading experiences..." />;
  }

  if (errorMessage || !course) {
    return <ErrorState message={errorMessage ?? "Course not found"} />;
  }

  const shareExperienceAction = (
    <Button asChild>
      <Link to={`/courses/${course.id}/experiences/new`}>
        <PenSquare className="size-4" aria-hidden="true" />
        Share Experience
      </Link>
    </Button>
  );

  return (
    <div className="space-y-8">
      <CourseHeader course={course} />

      <section>
        <SectionHeader
          title="Course Experiences"
          description="Read what students experienced in this course."
          action={shareExperienceAction}
        />

        {experiences.length === 0 ? (
          <EmptyState
            title="No experiences yet."
            description="Share what helped, what was difficult, or what students should expect."
            action={shareExperienceAction}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {experiences.map((experience) => (
              <ExperienceRow key={experience.id} experience={experience} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
