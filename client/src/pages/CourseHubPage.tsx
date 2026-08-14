import axios from "axios";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  HelpCircle,
  Link2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";

import { getCourseById } from "@/api/courses.api";
import { getCourseExperiences } from "@/api/experiences.api";
import { getCourseQuestions } from "@/api/questions.api";
import { getCourseResources } from "@/api/resources.api";
import { getCourseStudyGroups } from "@/api/studyGroups.api";
import { CourseHeader } from "@/components/courses/CourseHeader";
import { ExperienceRow } from "@/components/experiences/ExperienceRow";
import { QuestionRow } from "@/components/questions/QuestionRow";
import { ResourceRow } from "@/components/resources/ResourceRow";
import { StudyGroupRow } from "@/components/study-groups/StudyGroupRow";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { EmptyState, ErrorState, LoadingState } from "@/components/layout/StateBlock";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApiErrorResponse } from "@/types/auth";
import type { Course } from "@/types/course";
import type { CourseExperience } from "@/types/experience";
import type { CourseQuestion } from "@/types/question";
import type { CourseResource } from "@/types/resource";
import type { CourseStudyGroup } from "@/types/studyGroup";

function PulseStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof HelpCircle;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-primary">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function CourseHubPage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<CourseQuestion[]>([]);
  const [experiences, setExperiences] = useState<CourseExperience[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [studyGroups, setStudyGroups] = useState<CourseStudyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!id) {
      setErrorMessage("Course not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      getCourseById(id),
      getCourseQuestions(id),
      getCourseExperiences(id),
      getCourseResources(id),
      getCourseStudyGroups(id),
    ])
      .then(
        ([
          courseResponse,
          questionsResponse,
          experiencesResponse,
          resourcesResponse,
          studyGroupsResponse,
        ]) => {
          if (!isActive) return;

          setCourse(courseResponse.data.course);
          setQuestions(questionsResponse.data.questions);
          setExperiences(experiencesResponse.data.experiences);
          setResources(resourcesResponse.data.resources);
          setStudyGroups(studyGroupsResponse.data.studyGroups);
        },
      )
      .catch((error: unknown) => {
        if (!isActive) return;

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load course overview.",
          );
          return;
        }

        setErrorMessage("Unable to load course overview.");
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

  const upcomingStudyGroups = useMemo(
    () =>
      studyGroups
        .filter((group) => new Date(group.startDateTime).getTime() > Date.now())
        .slice(0, 2),
    [studyGroups],
  );

  if (isLoading) {
    return <LoadingState label="Loading course hub..." />;
  }

  if (errorMessage || !course) {
    return (
      <ErrorState message={errorMessage ?? "This course could not be loaded."} />
    );
  }

  return (
    <div className="space-y-8">
      <CourseHeader course={course} description={course.description ?? undefined} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PulseStat icon={HelpCircle} label="Questions" value={questions.length} />
        <PulseStat
          icon={ClipboardList}
          label="Experiences"
          value={experiences.length}
        />
        <PulseStat icon={Link2} label="Resources" value={resources.length} />
        <PulseStat
          icon={Users}
          label="Study groups"
          value={studyGroups.length}
        />
      </section>

      <section className="rounded-2xl border border-border bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-semibold text-foreground">About this course</h2>
            <p className="mt-2 max-w-4xl text-sm leading-7 text-muted-foreground">
              {course.description ?? "No description available yet."}
            </p>
            {course.department ? (
              <Badge variant="secondary" className="mt-3 rounded-md">
                {course.department.name}
              </Badge>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <section>
            <SectionHeader
              title="Recent questions"
              description="Course-specific problems and answers from students."
              action={
                <Button asChild>
                  <Link to={`/courses/${course.id}/questions/new`}>
                    Ask Question
                  </Link>
                </Button>
              }
            />
            {questions.length === 0 ? (
              <EmptyState
                title="No questions yet"
                description={`Be the first to ask something about ${course.code}.`}
                action={
                  <Button asChild>
                    <Link to={`/courses/${course.id}/questions/new`}>
                      Ask Question
                    </Link>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-3">
                {questions.slice(0, 3).map((question) => (
                  <QuestionRow key={question.id} compact question={question} />
                ))}
                <Link
                  to={`/courses/${course.id}/questions`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  View all questions
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </section>

          <section>
            <SectionHeader
              title="Useful resources"
              description="Links, guides, tools, and official references."
              action={
                <Button asChild variant="outline">
                  <Link to={`/courses/${course.id}/resources/new`}>
                    Add Resource
                  </Link>
                </Button>
              }
            />
            {resources.length === 0 ? (
              <EmptyState
                title="No resources yet"
                description="Know a useful link? Add it for classmates."
              />
            ) : (
              <div className="space-y-3">
                {resources.slice(0, 3).map((resource) => (
                  <ResourceRow key={resource.id} compact resource={resource} />
                ))}
                <Link
                  to={`/courses/${course.id}/resources`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  View all resources
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-8">
          <section>
            <SectionHeader
              title="Upcoming groups"
              description="Study sessions connected to this course."
              action={
                <Button asChild variant="outline">
                  <Link to={`/courses/${course.id}/study-groups/new`}>
                    Create
                  </Link>
                </Button>
              }
            />
            {upcomingStudyGroups.length === 0 ? (
              <EmptyState
                title="No upcoming groups"
                description="Start a study session for this course."
              />
            ) : (
              <div className="space-y-3">
                {upcomingStudyGroups.map((studyGroup) => (
                  <StudyGroupRow
                    key={studyGroup.id}
                    compact
                    studyGroup={studyGroup}
                  />
                ))}
              </div>
            )}
          </section>

          <section>
            <SectionHeader
              title="Latest experiences"
              description="What classmates noticed while taking it."
              action={
                <Button asChild variant="outline">
                  <Link to={`/courses/${course.id}/experiences/new`}>
                    Add
                  </Link>
                </Button>
              }
            />
            {experiences.length === 0 ? (
              <EmptyState
                title="No experiences yet"
                description="Share what taking this course was like."
              />
            ) : (
              <div className="space-y-3">
                {experiences.slice(0, 2).map((experience) => (
                  <ExperienceRow
                    key={experience.id}
                    compact
                    experience={experience}
                  />
                ))}
                <Link
                  to={`/courses/${course.id}/experiences`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  View all experiences
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
