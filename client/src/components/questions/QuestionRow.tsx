import { CheckCircle2, Clock3, MessageSquare } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CourseQuestion } from "@/types/question";

type QuestionRowProps = {
  question: CourseQuestion;
  compact?: boolean;
};

export function QuestionRow({ compact = false, question }: QuestionRowProps) {
  const isSolved = question.status === "RESOLVED";
  const authorName = question.author.name ?? question.author.email;

  return (
    <Link
      to={`/questions/${question.id}`}
      className={cn(
        "group grid gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm",
        "sm:grid-cols-[minmax(0,1fr)_auto]",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isSolved ? "success" : "secondary"}>
            {isSolved ? (
              <CheckCircle2 className="mr-1 size-3" aria-hidden="true" />
            ) : null}
            {isSolved ? "Solved" : "Open"}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Clock3 className="size-3" aria-hidden="true" />
            {formatDate(question.createdAt)}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary">
          {question.title}
        </h3>

        {!compact ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {question.body}
          </p>
        ) : null}

        <p className="mt-2 text-xs text-muted-foreground">
          Asked by {authorName}
        </p>
      </div>

      <div className="flex h-10 min-w-28 items-center justify-start gap-2 rounded-md bg-secondary px-3 text-sm font-semibold text-foreground sm:justify-center">
        <MessageSquare
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        {question._count.answers}{" "}
        {question._count.answers === 1 ? "answer" : "answers"}
      </div>
    </Link>
  );
}
