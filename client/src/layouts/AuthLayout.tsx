import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 text-foreground">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            TS
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            TXST Study Hub
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue your study workflow.
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
