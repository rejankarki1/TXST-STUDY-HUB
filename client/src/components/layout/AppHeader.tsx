import { LogOut, Plus, Search } from "lucide-react";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative inline-flex h-12 items-center px-1 text-sm font-medium transition md:h-16",
    isActive
      ? "text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
      : "text-neutral-500 hover:text-neutral-950",
  );

export function AppHeader() {
  const { isAuthenticated, logout, user } = useAuth();
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  function onSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/courses?search=${encodeURIComponent(query)}` : "/courses");
    setSearch("");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <nav className="mx-auto flex min-h-16 max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between xl:py-0">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
          <Link
            to="/"
            className="flex items-center gap-3 text-lg font-bold uppercase tracking-tight text-foreground"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground shadow-sm">
              TS
            </span>
            <span>TXST Study Hub</span>
          </Link>

          <div className="flex items-center gap-6 overflow-x-auto">
            <NavLink to="/" end className={navLinkClass}>
              Discover
            </NavLink>
            <NavLink to="/courses" className={navLinkClass}>
              Courses
            </NavLink>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <form onSubmit={onSearchSubmit} className="relative min-w-0 md:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
              aria-label="Search courses"
            />
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {isAuthenticated ? (
              <Button asChild size="sm">
                <NavLink to="/create">
                  <Plus className="size-4" aria-hidden="true" />
                  Create
                </NavLink>
              </Button>
            ) : null}

            {isAuthenticated && user ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) =>
                    cn(
                      "inline-flex size-10 items-center justify-center rounded-full border border-border bg-secondary text-xs font-bold uppercase transition hover:bg-accent",
                      isActive
                        ? "text-primary ring-2 ring-primary/15"
                        : "text-muted-foreground hover:text-foreground",
                    )
                  }
                  aria-label="Profile"
                >
                  {(user.name ?? user.email).slice(0, 1)}
                </NavLink>
                <Button
                  type="button"
                  onClick={() => void logout()}
                  size="icon"
                  variant="ghost"
                  aria-label="Logout"
                >
                  <LogOut className="size-4" aria-hidden="true" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm">
                  <Link to="/create">
                    <Plus className="size-4" aria-hidden="true" />
                    Create
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log In</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
