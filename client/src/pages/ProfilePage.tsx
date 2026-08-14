import { useAuth } from "../hooks/useAuth.ts";

export function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-neutral-200 bg-white p-6">
      <div className="flex items-center gap-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary text-lg font-bold uppercase text-primary-foreground">
          {(user.name ?? user.email).slice(0, 1)}
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">
            Profile
          </h1>
          <p className="text-sm text-neutral-500">
            Your TXST Study Hub account.
          </p>
        </div>
      </div>

      <dl className="mt-6 divide-y divide-neutral-100">
        <div className="py-4">
          <dt className="text-sm font-medium text-neutral-500">Name</dt>
          <dd className="mt-1 text-neutral-950">{user.name ?? "Not provided"}</dd>
        </div>
        <div className="py-4">
          <dt className="text-sm font-medium text-neutral-500">Email</dt>
          <dd className="mt-1 text-neutral-950">{user.email}</dd>
        </div>
        <div className="py-4">
          <dt className="text-sm font-medium text-neutral-500">Role</dt>
          <dd className="mt-1 text-neutral-950">{user.role}</dd>
        </div>
      </dl>
    </section>
  );
}
