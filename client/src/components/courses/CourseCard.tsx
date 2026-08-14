import { BookOpen, ChevronRight, MessageSquare } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types/course";

function formatQuestionCount(count: number | undefined) {
  const safeCount = count ?? 0;
  return `${safeCount} ${safeCount === 1 ? "question" : "questions"}`;
}

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group flex min-h-48 flex-col rounded-xl border border-border bg-card p-5 transition hover:border-primary/40 hover:bg-accent/30 hover:shadow-sm"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary/20 text-primary">
            {course.code}
          </Badge>
          {course.department ? (
            <span className="text-xs font-medium text-muted-foreground">
              {course.department.name}
            </span>
          ) : null}
        </div>
        <BookOpen
          className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary"
          aria-hidden="true"
        />
      </div>

      <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
        {course.title}
      </h2>
      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-muted-foreground">
        {course.description ?? "No description available yet."}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs font-medium text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MessageSquare className="size-3.5" aria-hidden="true" />
          {formatQuestionCount(course.questionCount)}
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-primary">
          Open hub
          <ChevronRight
            className="size-3 transition group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
