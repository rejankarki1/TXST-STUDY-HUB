import { useAuth } from "../hooks/useAuth.ts";

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="max-w-2xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <dl className="mt-6 space-y-4">
        <div>
          <dt className="text-sm font-medium text-slate-500">Name</dt>
          <dd className="mt-1 text-slate-900">{user.name ?? "Not provided"}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Email</dt>
          <dd className="mt-1 text-slate-900">{user.email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-slate-500">Role</dt>
          <dd className="mt-1 text-slate-900">{user.role}</dd>
        </div>
      </dl>
    </section>
  );
}

