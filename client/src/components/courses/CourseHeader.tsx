import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import type { Course } from "@/types/course";
import { CourseNav } from "./CourseNav";

type CourseHeaderProps = {
  action?: ReactNode;
  course: Course;
  description?: string;
};

export function CourseHeader({ action, course, description }: CourseHeaderProps) {
  return (
    <section className="-mx-4 border-b border-border bg-white px-4 pt-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
        >
          Courses
          <ChevronRight className="size-3" aria-hidden="true" />
          <span className="text-foreground">{course.code}</span>
        </Link>

        <div className="mt-3 flex flex-col gap-5 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Badge className="rounded-md">{course.code}</Badge>
              {course.department ? (
                <Badge variant="secondary" className="rounded-md">
                  {course.department.name}
                </Badge>
              ) : null}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {course.title}
              </h1>
            </div>
            {description ? (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </div>

      <CourseNav courseId={course.id} />
    </section>
  );
}
