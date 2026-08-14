import { ExternalLink, Link2 } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { CourseResource, ResourceType } from "@/types/resource";

export const resourceTypeLabels: Record<ResourceType, string> = {
  VIDEO: "Video",
  PRACTICE: "Practice",
  DOCUMENTATION: "Documentation",
  GUIDE: "Guide",
  TOOL: "Tool",
  OFFICIAL: "Official",
};

export function getResourceDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "External link";
  }
}

type ResourceRowProps = {
  resource: CourseResource;
  compact?: boolean;
};

export function ResourceRow({ compact = false, resource }: ResourceRowProps) {
  const authorName = resource.author.name ?? resource.author.email;
  const domain = getResourceDomain(resource.url);

  return (
    <Link
      to={`/resources/${resource.id}`}
      className="group grid gap-4 rounded-lg border border-border bg-card p-4 transition hover:border-primary/40 hover:bg-accent/40 hover:shadow-sm sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-primary">
            <Link2 className="mr-1 size-3" aria-hidden="true" />
            {resourceTypeLabels[resource.resourceType]}
          </Badge>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <ExternalLink className="size-3" aria-hidden="true" />
            {domain}
          </span>
          <span className="text-xs font-medium text-muted-foreground">
            {formatDate(resource.createdAt)}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold text-foreground group-hover:text-primary">
          {resource.title}
        </h3>

        {!compact ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {resource.description}
          </p>
        ) : null}

        <p className="mt-2 text-xs text-muted-foreground">
          Shared by {authorName}
        </p>
      </div>

      <div className="flex h-10 min-w-28 items-center justify-start gap-2 rounded-md bg-secondary px-3 text-sm font-semibold text-foreground sm:justify-center">
        <ExternalLink
          className="size-4 text-muted-foreground"
          aria-hidden="true"
        />
        Open
      </div>
    </Link>
  );
}
