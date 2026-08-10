import type { Metadata } from "next";
import Link from "next/link";
import { AuthControls } from "@/app/components/AuthControls";
import { SchoolsBrowser } from "@/app/components/schools/SchoolsBrowser";

// The real destination for the top bar's "Schools" link.
//
// Previously that link went to /pathway — the classic 1.0 search page, which
// has nothing to do with browsing schools and confused anyone who clicked
// expecting a directory. This is the directory: every Florida school we
// know, on a map, sortable by distance and by real Scorecard figures where
// we have them, searchable by program. /pathway is still reachable from the
// footer's "Classic search" link — nothing here removes it.
//
// Nav destinations here match app/page.tsx's current nav: Pathways goes to
// /pathways (the saved-plan collection, Phase 2) and Insights goes to
// /insights (the real labour-market page, Phase 3).

export const metadata: Metadata = {
  title: "Schools | Vocation",
  description:
    "Every Florida school Vocation knows, mapped and sortable by distance, earnings, completion rate, and program.",
};

function Wordmark() {
  return (
    <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>
  );
}

export default function SchoolsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-5 py-4 md:px-16">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <Wordmark />
            </Link>

            <nav className="hidden items-center gap-5 sm:flex">
              <Link
                href="/pathways"
                className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
              >
                Pathways
              </Link>
              <Link
                href="/schools"
                className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
              >
                Schools
              </Link>
              <Link
                href="/insights"
                className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
              >
                Insights
              </Link>
            </nav>
          </div>

          <AuthControls />
        </div>
      </header>

      <main className="flex-1">
        <SchoolsBrowser />
      </main>
    </div>
  );
}
