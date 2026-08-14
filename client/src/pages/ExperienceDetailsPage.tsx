import axios from "axios";
import { ArrowLeft, Gauge } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getExperienceById } from "@/api/experiences.api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { ApiErrorResponse } from "@/types/auth";
import type { ExperienceDetails, ExperienceDifficulty } from "@/types/experience";

const difficultyLabels: Record<ExperienceDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export function ExperienceDetailsPage() {
  const { experienceId } = useParams();
  const [experience, setExperience] = useState<ExperienceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!experienceId) {
      setErrorMessage("Experience not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    getExperienceById(experienceId)
      .then((response) => {
        if (isActive) {
          setExperience(response.data.experience);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load experience.",
          );
          return;
        }

        setErrorMessage("Unable to load experience.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [experienceId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading experience...
        </CardContent>
      </Card>
    );
  }

  if (errorMessage || !experience) {
    return (
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-foreground">
            {errorMessage ?? "Experience not found"}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <Link
          to={`/courses/${experience.course.id}/experiences`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to {experience.course.code} Experiences
        </Link>

        <div className="mt-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-primary">
              {experience.course.code}
            </Badge>
            <Badge variant="secondary">
              <Gauge className="mr-1 size-3" aria-hidden="true" />
              {difficultyLabels[experience.difficulty]}
            </Badge>
            {experience.term ? (
              <Badge variant="outline">{experience.term}</Badge>
            ) : null}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {experience.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Shared by {experience.author.name ?? experience.author.email} •{" "}
            {formatDate(experience.createdAt)}
          </p>
          {experience.professorName ? (
            <p className="mt-2 text-sm font-semibold text-foreground">
              Professor: {experience.professorName}
            </p>
          ) : null}
        </div>

        <p className="mt-6 whitespace-pre-wrap leading-7 text-foreground">
          {experience.body}
        </p>
      </section>
    </div>
  );
}
