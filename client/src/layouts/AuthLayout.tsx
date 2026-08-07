import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-red-950">TXST Study Hub</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to continue your study workflow.
          </p>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

