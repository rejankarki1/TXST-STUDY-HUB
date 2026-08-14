import axios from "axios";
import {
  ArrowRight,
  CalendarClock,
  FileText,
  HelpCircle,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { getHomeOverview } from "@/api/home.api";
import { CourseCard } from "@/components/courses/CourseCard";
import { EmptyState, ErrorState, LoadingState } from "@/components/layout/StateBlock";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import type { ApiErrorResponse } from "@/types/auth";
import type { HomeExperience, HomeOverview, HomeQuestion, HomeResource } from "@/types/home";
import type { CourseStudyGroup } from "@/types/studyGroup";

type ActivityItem =
  | {
      id: string;
      courseCode: string;
      createdAt: string;
      href: string;
      kind: "Question";
      meta: string;
      title: string;
    }
  | {
      id: string;
      courseCode: string;
      createdAt: string;
      href: string;
      kind: "Experience";
      meta: string;
      title: string;
    }
  | {
      id: string;
      courseCode: string;
      createdAt: string;
      href: string;
      kind: "Resource";
      meta: string;
      title: string;
    };

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon =
    item.kind === "Question"
      ? HelpCircle
      : item.kind === "Resource"
        ? FileText
        : Users;

  return (
    <Link
      to={item.href}
      className="group grid gap-3 rounded-lg border border-transparent p-3 transition hover:border-border hover:bg-card sm:grid-cols-[auto_minmax(0,1fr)_auto]"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
          <Badge variant="outline" className="px-2 py-0 text-[10px] text-primary">
            {item.kind}
          </Badge>
          {item.courseCode}
          <span aria-hidden="true">·</span>
          {formatDate(item.createdAt)}
        </span>
        <span className="mt-1 block line-clamp-1 font-medium text-foreground group-hover:text-primary">
          {item.title}
        </span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {item.meta}
        </span>
      </span>
      <ArrowRight
        className="hidden size-4 self-center text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary sm:block"
        aria-hidden="true"
      />
    </Link>
  );
}

function StudySessionPanel({
  isLoading,
  studyGroup,
}: {
  isLoading: boolean;
  studyGroup?: CourseStudyGroup;
}) {
  return (
    <section className="rounded-2xl border border-primary/20 bg-primary p-5 text-primary-foreground">
      <SectionHeader
        title="Up next"
        description="Upcoming study sessions from course hubs."
      />

      {isLoading ? (
        <p className="text-sm text-primary-foreground/75">Loading sessions...</p>
      ) : null}

      {!isLoading && !studyGroup ? (
        <div className="rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-4">
          <p className="font-semibold">No upcoming sessions yet.</p>
          <p className="mt-2 text-sm leading-6 text-primary-foreground/75">
            Open a course hub to create the first study group.
          </p>
          <Button asChild className="mt-4 w-full bg-white text-primary hover:bg-white/90">
            <Link to="/courses">Browse courses</Link>
          </Button>
        </div>
      ) : null}

      {!isLoading && studyGroup ? (
        <Link
          to={`/study-groups/${studyGroup.id}`}
          className="group block rounded-xl border border-primary-foreground/15 bg-primary-foreground/10 p-4 transition hover:bg-primary-foreground/15"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge className="bg-white/15 text-primary-foreground">
              {studyGroup.course.code}
            </Badge>
            <Badge className="bg-white/20 text-primary-foreground">
              {studyGroup.status}
            </Badge>
          </div>
          <h3 className="font-semibold">{studyGroup.title}</h3>
          <div className="mt-3 space-y-2 text-sm text-primary-foreground/75">
            <p className="flex items-center gap-2">
              <CalendarClock className="size-4" aria-hidden="true" />
              {formatDate(studyGroup.startDateTime)}
            </p>
            <p className="flex items-center gap-2">
              <MapPin className="size-4" aria-hidden="true" />
              {studyGroup.mode === "ONLINE"
                ? studyGroup.onlineDetails ?? "Online"
                : studyGroup.location ?? "Campus"}
            </p>
            <p className="flex items-center gap-2">
              <Users className="size-4" aria-hidden="true" />
              {studyGroup._count.members}/{studyGroup.maxMembers} members
            </p>
          </div>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold">
            View group
            <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
          </span>
        </Link>
      ) : null}
    </section>
  );
}

export function HomePage() {
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState<HomeOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setErrorMessage(null);

    getHomeOverview()
      .then((response) => {
        if (isActive) {
          setOverview(response.data);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) return;

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load discovery data.",
          );
          return;
        }

        setErrorMessage("Unable to load discovery data.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/courses?search=${encodeURIComponent(query)}` : "/courses");
  }

  const courses = (overview?.courses ?? []).slice(0, 4);
  const studyGroup = overview?.studyGroups[0];
  const activityItems = useMemo<ActivityItem[]>(() => {
    const questionItems: ActivityItem[] = (overview?.questions ?? []).map(
      (question: HomeQuestion) => ({
        id: `question-${question.id}`,
        courseCode: question.course.code,
        createdAt: question.createdAt,
        href: `/questions/${question.id}`,
        kind: "Question",
        meta: `${question._count.answers} ${
          question._count.answers === 1 ? "answer" : "answers"
        }`,
        title: question.title,
      }),
    );

    const experienceItems: ActivityItem[] = (overview?.experiences ?? []).map(
      (experience: HomeExperience) => ({
        id: `experience-${experience.id}`,
        courseCode: experience.course.code,
        createdAt: experience.createdAt,
        href: `/experiences/${experience.id}`,
        kind: "Experience",
        meta: [experience.professorName, experience.term].filter(Boolean).join(" · ") ||
          "Student course insight",
        title: experience.title,
      }),
    );

    const resourceItems: ActivityItem[] = (overview?.resources ?? []).map(
      (resource: HomeResource) => ({
        id: `resource-${resource.id}`,
        courseCode: resource.course.code,
        createdAt: resource.createdAt,
        href: `/resources/${resource.id}`,
        kind: "Resource",
        meta: resource.resourceType,
        title: resource.title,
      }),
    );

    return [...questionItems, ...experienceItems, ...resourceItems]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      )
      .slice(0, 6);
  }, [overview]);

  return (
    <div className="space-y-12">
      <section className="mx-auto max-w-4xl py-8 text-center">
        <Badge variant="outline" className="mb-5 border-primary/20 text-primary">
          Built for Texas State students
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Everything you need for your next course.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">
          Ask students, read course experiences, find resources, and study
          together inside one course-centered hub.
        </p>
        <form onSubmit={onSearchSubmit} className="mx-auto mt-8 max-w-2xl">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search CS 2308, Calculus II, Discrete Math..."
              className="h-14 rounded-xl bg-white pl-12 text-base shadow-sm"
              aria-label="Search for a course"
            />
          </div>
        </form>
        {courses.length > 0 ? (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
              >
                {course.code}
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      {errorMessage ? <ErrorState message={errorMessage} /> : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-10">
          <section>
            <SectionHeader
              title="Courses to explore"
              description="Start with a course, then enter its questions, resources, experiences, and groups."
              action={
                <Button asChild variant="outline">
                  <Link to="/courses">
                    View all
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              }
            />

            {isLoading ? <LoadingState label="Loading courses..." /> : null}
            {!isLoading && courses.length === 0 ? (
              <EmptyState
                title="No courses yet"
                description="Courses will appear here after they are added."
              />
            ) : null}
            {!isLoading && courses.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {courses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : null}
          </section>

          <section>
            <SectionHeader
              title="Recent student activity"
              description="A compact look at what students are asking, sharing, and reviewing."
            />
            {isLoading ? <LoadingState label="Loading activity..." /> : null}
            {!isLoading && activityItems.length === 0 ? (
              <EmptyState
                title="No activity yet"
                description="Questions, experiences, and resources will show up here."
              />
            ) : null}
            {!isLoading && activityItems.length > 0 ? (
              <div className="rounded-xl border border-border bg-white p-2">
                {activityItems.map((item) => (
                  <ActivityRow key={item.id} item={item} />
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-6">
          <StudySessionPanel isLoading={isLoading} studyGroup={studyGroup} />
        </aside>
      </div>
    </div>
  );
}
