import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StateBlockProps = {
  action?: ReactNode;
  className?: string;
  description?: string;
  title: string;
  tone?: "default" | "danger";
};

export function StateBlock({
  action,
  className,
  description,
  title,
  tone = "default",
}: StateBlockProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6",
        tone === "danger"
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-border text-card-foreground",
        className,
      )}
    >
      <h2 className="font-semibold">{title}</h2>
      {description ? (
        <p
          className={cn(
            "mt-2 text-sm leading-6",
            tone === "danger" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
      {label}
    </div>
  );
}

export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <StateBlock
      tone="danger"
      title="Something went wrong"
      description={message}
      action={
        retry ? (
          <Button type="button" variant="outline" onClick={retry}>
            Try again
          </Button>
        ) : null
      }
    />
  );
}

export function EmptyState({
  action,
  description,
  title,
}: Pick<StateBlockProps, "action" | "description" | "title">) {
  return (
    <StateBlock
      className="border-dashed"
      title={title}
      description={description}
      action={action}
    />
  );
}
