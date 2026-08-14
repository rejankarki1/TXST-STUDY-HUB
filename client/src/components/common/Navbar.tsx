import { Link, NavLink } from "react-router";

import { Button } from "@/components/ui/button";
import { useAuth } from "../../hooks/useAuth.ts";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-semibold transition ${
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
  }`;

export function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-black text-primary"
          >
            <span className="flex size-9 items-center justify-center rounded-md bg-primary text-sm text-primary-foreground shadow-sm">
              TS
            </span>
            <span>TXST Study Hub</span>
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
              <span className="max-w-52 truncate text-sm font-medium text-muted-foreground">
                {user.name ?? user.email}
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile">Profile</Link>
              </Button>
              <Button
                type="button"
                onClick={() => void logout()}
                size="sm"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Log In</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
