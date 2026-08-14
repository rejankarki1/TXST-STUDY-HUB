import { CalendarClock, MapPin, Monitor, Users } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type {
  CourseStudyGroup,
  StudyGroupMode,
  StudyGroupStatus,
} from "@/types/studyGroup";

const modeLabels: Record<StudyGroupMode, string> = {
  ONLINE: "Online",
  IN_PERSON: "In person",
};

const statusLabels: Record<StudyGroupStatus, string> = {
  OPEN: "Open",
  FULL: "Full",
  CANCELLED: "Cancelled",
};

type StudyGroupRowProps = {
  studyGroup: CourseStudyGroup;
  compact?: boolean;
};

export function StudyGroupRow({
  compact = false,
  studyGroup,
}: StudyGroupRowProps) {
  const place =
    studyGroup.mode === "ONLINE"
      ? studyGroup.onlineDetails ?? "Online"
      : studyGroup.location ?? "Campus";
  const isOpen = studyGroup.status === "OPEN";

  return (
    <Link
      to={`/study-groups/${studyGroup.id}`}
      className="group grid gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isOpen ? "success" : "secondary"}>
            {statusLabels[studyGroup.status]}
          </Badge>
          <Badge variant="outline" className="text-primary">
            {studyGroup.mode === "ONLINE" ? (
              <Monitor className="mr-1 size-3" aria-hidden="true" />
            ) : (
              <MapPin className="mr-1 size-3" aria-hidden="true" />
            )}
            {modeLabels[studyGroup.mode]}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <CalendarClock className="size-3" aria-hidden="true" />
            {formatDate(studyGroup.startDateTime)}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary">
          {studyGroup.title}
        </h3>

        {!compact ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {studyGroup.description}
          </p>
        ) : null}

        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
          {place} · Organized by{" "}
          {studyGroup.creator.name ?? studyGroup.creator.email}
        </p>
      </div>

      <div className="flex h-10 min-w-28 items-center justify-start gap-2 rounded-md bg-secondary px-3 text-sm font-semibold text-foreground sm:justify-center">
        <Users className="size-4 text-muted-foreground" aria-hidden="true" />
        {studyGroup._count.members}/{studyGroup.maxMembers}
      </div>
    </Link>
  );
}

export { modeLabels, statusLabels };
