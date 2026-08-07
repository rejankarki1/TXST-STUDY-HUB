import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-slate-600">
        The page you requested does not exist.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex rounded-md bg-red-900 px-4 py-2 font-semibold text-white hover:bg-red-950"
      >
        Go Home
      </Link>
    </section>
  );
}

