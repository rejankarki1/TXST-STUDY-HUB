import { Gauge } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { CourseExperience, ExperienceDifficulty } from "@/types/experience";

const difficultyLabels: Record<ExperienceDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

type ExperienceRowProps = {
  experience: CourseExperience;
  compact?: boolean;
};

export function ExperienceRow({
  compact = false,
  experience,
}: ExperienceRowProps) {
  const authorName = experience.author.name ?? experience.author.email;

  return (
    <Link
      to={`/experiences/${experience.id}`}
      className="group block rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-primary">
            <Gauge className="mr-1 size-3" aria-hidden="true" />
            {difficultyLabels[experience.difficulty]}
          </Badge>
          {experience.term ? (
            <Badge variant="secondary">{experience.term}</Badge>
          ) : null}
          <span className="text-xs font-medium text-muted-foreground">
            {formatDate(experience.createdAt)}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary">
          {experience.title}
        </h3>

        {!compact ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {experience.body}
          </p>
        ) : null}

        <p className="mt-2 text-xs text-muted-foreground">
          {experience.professorName
            ? `${experience.professorName} · `
            : "Any professor · "}
          Shared by {authorName}
        </p>
      </div>
    </Link>
  );
}
