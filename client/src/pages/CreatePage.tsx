import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Link2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

import { CourseSelector } from "@/components/courses/CourseSelector";
import { Card, CardContent } from "@/components/ui/card";
import type { Course } from "@/types/course";

type ContributionType = "question" | "experience" | "resource" | "studyGroup";

const contributionOptions: Array<{
  type: ContributionType;
  icon: typeof HelpCircle;
  title: string;
  description: string;
}> = [
  {
    type: "question",
    icon: HelpCircle,
    title: "Ask a Question",
    description: "Get help from students who know the course.",
  },
  {
    type: "experience",
    icon: ClipboardList,
    title: "Share Course Experience",
    description: "Tell future students what taking the course was like.",
  },
  {
    type: "resource",
    icon: Link2,
    title: "Share a Resource",
    description: "Recommend a useful tutorial, guide, or practice tool.",
  },
  {
    type: "studyGroup",
    icon: GraduationCap,
    title: "Create Study Group",
    description: "Find classmates to study with.",
  },
];

function getTargetPath(type: ContributionType, courseId: string) {
  switch (type) {
    case "question":
      return `/courses/${courseId}/questions/new`;
    case "experience":
      return `/courses/${courseId}/experiences/new`;
    case "resource":
      return `/courses/${courseId}/resources/new`;
    case "studyGroup":
      return `/courses/${courseId}/study-groups/new`;
  }
}

export function CreatePage() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<ContributionType | null>(
    null,
  );

  function onCourseSelect(course: Course) {
    if (!selectedType) {
      return;
    }

    navigate(getTargetPath(selectedType, course.id));
  }

  const selectedOption = contributionOptions.find(
    (option) => option.type === selectedType,
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section>
        <p className="text-sm font-semibold text-primary">Create</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          What do you want to contribute?
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Choose a contribution type, then select the course it belongs to.
        </p>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            1
          </span>
          <span
            className={
              selectedOption
                ? "font-semibold text-primary"
                : "font-semibold text-neutral-950"
            }
          >
            Contribution
          </span>
        </div>
        <ArrowRight className="size-4 text-neutral-300" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span
            className={
              selectedOption
                ? "flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                : "flex size-7 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-400"
            }
          >
            2
          </span>
          <span
            className={
              selectedOption
                ? "font-semibold text-neutral-950"
                : "font-semibold text-neutral-400"
            }
          >
            Course
          </span>
        </div>
        {selectedOption ? (
          <p className="ml-auto text-sm text-neutral-500">
            {selectedOption.title} → choose a course
          </p>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {contributionOptions.map((option, index) => {
          const Icon = option.icon;
          const isSelected = option.type === selectedType;

          return (
            <button
              key={option.type}
              type="button"
              onClick={() => setSelectedType(option.type)}
              className={`rounded-xl border bg-card p-5 text-left transition hover:border-primary/40 hover:bg-accent/40 ${
                isSelected
                  ? "border-primary bg-accent/50 ring-2 ring-primary/15"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <span
                  className={
                    isSelected
                      ? "rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground"
                      : "rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-400"
                  }
                >
                  {isSelected ? "Selected" : `Option ${index + 1}`}
                </span>
              </div>
              <h2 className="mt-4 text-lg font-semibold text-foreground">
                {option.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {option.description}
              </p>
            </button>
          );
        })}
      </section>

      {selectedOption ? (
        <Card className="border-neutral-200 shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BookOpen className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-semibold text-foreground">
                  Select a course
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedOption.title} will open after you choose a course.
                </p>
              </div>
            </div>
            <CourseSelector onSelect={onCourseSelect} />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-neutral-200 shadow-none">
          <CardContent className="p-5 text-sm text-muted-foreground sm:p-6">
            Choose a contribution type above to continue to course selection.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
