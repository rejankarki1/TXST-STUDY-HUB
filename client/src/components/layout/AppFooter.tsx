import { Link } from "react-router";

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-4 py-12 text-xs font-medium text-neutral-500 sm:px-6 md:flex-row md:justify-between lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold uppercase tracking-tight text-neutral-500"
        >
          <span className="flex size-6 items-center justify-center rounded bg-primary text-[10px] text-primary-foreground opacity-80">
            TS
          </span>
          TXST STUDY HUB
        </Link>
        <div className="flex gap-8">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
        <span className="text-[10px] font-bold uppercase text-neutral-400">
          2026 Texas State University
        </span>
      </div>
    </footer>
  );
}
