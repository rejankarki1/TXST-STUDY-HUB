import { NavLink } from "react-router";

import { cn } from "@/lib/utils";

type CourseNavProps = {
  courseId: string;
};

const courseTabs = [
  {
    label: "Overview",
    to: (courseId: string) => `/courses/${courseId}`,
    end: true,
  },
  {
    label: "Questions",
    to: (courseId: string) => `/courses/${courseId}/questions`,
  },
  {
    label: "Experiences",
    to: (courseId: string) => `/courses/${courseId}/experiences`,
  },
  {
    label: "Resources",
    to: (courseId: string) => `/courses/${courseId}/resources`,
  },
  {
    label: "Study Groups",
    to: (courseId: string) => `/courses/${courseId}/study-groups`,
  },
];

export function CourseNav({ courseId }: CourseNavProps) {
  return (
    <div className="sticky top-16 z-30 -mx-4 overflow-x-auto border-t border-border bg-white/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <nav className="mx-auto flex max-w-7xl min-w-max gap-6" aria-label="Course">
        {courseTabs.map((tab) => (
          <NavLink
            key={tab.label}
            to={tab.to(courseId)}
            end={tab.end}
            className={({ isActive }) =>
              cn(
                "relative inline-flex h-12 items-center text-sm font-medium transition",
                isActive
                  ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
