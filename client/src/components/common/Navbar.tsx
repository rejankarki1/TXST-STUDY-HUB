import { Link, NavLink } from "react-router";

import { useAuth } from "../../hooks/useAuth.ts";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive
      ? "bg-red-900 text-white"
      : "text-slate-700 hover:bg-slate-100 hover:text-red-900"
  }`;

export function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link to="/" className="text-lg font-bold text-red-950">
            TXST Study Hub
          </Link>
          <div className="flex flex-wrap gap-1">
            <NavLink to="/" className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/courses" className={navLinkClass}>
              Courses
            </NavLink>
            <NavLink to="/create" className={navLinkClass}>
              Create
            </NavLink>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAuthenticated && user ? (
            <>
              <span className="text-sm text-slate-600">
                {user.name ?? user.email}
              </span>
              <Link
                to="/profile"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-red-900"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="rounded-md bg-red-900 px-3 py-2 text-sm font-semibold text-white hover:bg-red-950"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-red-900"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-red-900 px-3 py-2 text-sm font-semibold text-white hover:bg-red-950"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

