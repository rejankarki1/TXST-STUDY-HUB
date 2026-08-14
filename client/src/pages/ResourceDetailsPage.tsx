import axios from "axios";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import { getResourceById } from "@/api/resources.api";
import {
  getResourceDomain,
  resourceTypeLabels,
} from "@/components/resources/ResourceRow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import type { ApiErrorResponse } from "@/types/auth";
import type { ResourceDetails } from "@/types/resource";

export function ResourceDetailsPage() {
  const { resourceId } = useParams();
  const [resource, setResource] = useState<ResourceDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    if (!resourceId) {
      setErrorMessage("Resource not found");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    getResourceById(resourceId)
      .then((response) => {
        if (isActive) {
          setResource(response.data.resource);
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError<ApiErrorResponse>(error)) {
          setErrorMessage(
            error.response?.data.message ?? "Unable to load resource.",
          );
          return;
        }

        setErrorMessage("Unable to load resource.");
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [resourceId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading resource...
        </CardContent>
      </Card>
    );
  }

  if (errorMessage || !resource) {
    return (
      <Card>
        <CardContent className="p-6">
          <h1 className="text-2xl font-bold text-foreground">
            {errorMessage ?? "Resource not found"}
          </h1>
          <Button asChild className="mt-6">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const authorName = resource.author.name ?? resource.author.email;
  const domain = getResourceDomain(resource.url);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-xl border border-neutral-200 bg-white p-6">
        <Link
          to={`/courses/${resource.course.id}/resources`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to {resource.course.code} Resources
        </Link>

        <div className="mt-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline" className="text-primary">
              {resource.course.code}
            </Badge>
            <Badge variant="secondary">
              {resourceTypeLabels[resource.resourceType]}
            </Badge>
            <Badge variant="outline">{domain}</Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {resource.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Shared by {authorName} • {formatDate(resource.createdAt)}
          </p>
        </div>

        <p className="mt-6 whitespace-pre-wrap leading-7 text-foreground">
          {resource.description}
        </p>

        <Button asChild className="mt-6 bg-primary hover:bg-primary/90">
          <a href={resource.url} target="_blank" rel="noreferrer">
            Open Resource
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </section>
    </div>
  );
}
