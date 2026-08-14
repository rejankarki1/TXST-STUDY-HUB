import axios from "axios";
import {
  ArrowLeft,
  CalendarClock,
  MapPin,
  Monitor,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import {
  getStudyGroupById,
  joinStudyGroup,
  leaveStudyGroup,
} from "@/api/studyGroups.api";
import {
  modeLabels,
  statusLabels,
} from "@/components/study-groups/StudyGroupRow";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { ApiErrorResponse } from "@/types/auth";
import type { CourseStudyGroup } from "@/types/studyGroup";
import { useAuth } from "@/hooks/useAuth";

export function StudyGroupDetailsPage() {
  const { groupId } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [studyGroup, setStudyGroup] = useState<CourseStudyGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!groupId) {
      setErrorMessage("Study group not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    getStudyGroupById(groupId)
      .then((response) => {
        if (isActive) {
          setStudyGroup(response.data.studyGroup);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load study group.",
          );
          return;
        }

        setErrorMessage("Unable to load study group.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [groupId]);

  async function handleJoin() {
    if (!studyGroup) {
      return;
    }

    try {
      setIsActionLoading(true);
      setActionError(null);
      const response = await joinStudyGroup(studyGroup.id);
      setStudyGroup(response.data.studyGroup);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setActionError(
          error.response?.data.message ?? "Unable to join study group.",
        );
        return;
      }

      setActionError("Unable to join study group.");
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleLeave() {
    if (!studyGroup) {
      return;
    }

    try {
      setIsActionLoading(true);
      setActionError(null);
      const response = await leaveStudyGroup(studyGroup.id);
      setStudyGroup(response.data.studyGroup);
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        setActionError(
          error.response?.data.message ?? "Unable to leave study group.",
        );
        return;
      }

      setActionError("Unable to leave study group.");
    } finally {
      setIsActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading study group...
        </CardContent>
      </Card>
    );
  }

  if (errorMessage || !studyGroup) {
    return (
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-foreground">
            {errorMessage ?? "Study group not found"}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const isOrganizer = user?.id === studyGroup.creatorId;
  const isMember = studyGroup.members.some(
    (membership) => membership.user.id === user?.id,
  );
  const isFull = studyGroup.status === "FULL";
  const place =
    studyGroup.mode === "ONLINE"
      ? studyGroup.onlineDetails ?? "Online"
      : studyGroup.location ?? "Campus";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <Link
          to={`/courses/${studyGroup.course.id}/study-groups`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to {studyGroup.course.code} Study Groups
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="outline" className="text-primary">
                {studyGroup.course.code}
              </Badge>
              <Badge variant={studyGroup.status === "OPEN" ? "success" : "secondary"}>
                {statusLabels[studyGroup.status]}
              </Badge>
              <Badge variant="outline">{modeLabels[studyGroup.mode]}</Badge>
              {isOrganizer ? (
                <Badge variant="secondary">
                  <ShieldCheck className="mr-1 size-3" aria-hidden="true" />
                  Organizer
                </Badge>
              ) : null}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {studyGroup.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Organized by{" "}
              {studyGroup.creator.name ?? studyGroup.creator.email} ·{" "}
              {formatDate(studyGroup.createdAt)}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            {!isAuthenticated ? (
              <Button asChild className="bg-primary hover:bg-primary/90">
                <Link to="/login">Log in to Join</Link>
              </Button>
            ) : null}

            {isAuthenticated && !isMember && !isFull ? (
              <Button
                type="button"
                onClick={() => void handleJoin()}
                disabled={isActionLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isActionLoading ? "Joining..." : "Join Group"}
              </Button>
            ) : null}

            {isAuthenticated && !isMember && isFull ? (
              <Button type="button" disabled>
                Full
              </Button>
            ) : null}

            {isAuthenticated && isMember && !isOrganizer ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleLeave()}
                disabled={isActionLoading}
              >
                {isActionLoading ? "Leaving..." : "Leave Group"}
              </Button>
            ) : null}
          </div>
        </div>

        {actionError ? (
          <Alert variant="destructive" className="mt-4">
            {actionError}
          </Alert>
        ) : null}

        <p className="mt-6 whitespace-pre-wrap leading-7 text-foreground">
          {studyGroup.description}
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarClock
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Date and time
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {formatDate(studyGroup.startDateTime)}
            </p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              {studyGroup.mode === "ONLINE" ? (
                <Monitor
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              ) : (
                <MapPin
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              {modeLabels[studyGroup.mode]}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{place}</p>
          </div>

          <div className="rounded-lg border border-border bg-secondary/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Members
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {studyGroup._count.members}/{studyGroup.maxMembers} joined
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-border p-5">
          <h2 className="text-xl font-bold text-foreground">Members</h2>
          <p className="text-sm text-muted-foreground">
            Students currently in this study group.
          </p>
        </div>
        <div className="divide-y divide-border">
          {studyGroup.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-4 p-5"
            >
              <div>
                <p className="font-semibold text-foreground">
                  {member.user.name ?? member.user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  Joined {formatDate(member.joinedAt)}
                </p>
              </div>
              {member.user.id === studyGroup.creatorId ? (
                <Badge variant="secondary">Organizer</Badge>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
