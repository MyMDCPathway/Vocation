import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AuthControls } from "@/app/components/AuthControls";
import { SchoolProgramBrowser } from "@/app/components/schools/SchoolProgramBrowser";
import { getDirectorySchoolById } from "@/app/lib/schoolDirectory";

// The school-first door: pick a school on /schools, land here to say what
// you want to study there — instead of "Plan a pathway here" dropping you
// on /start's career question, throwing away the school you just picked.
//
// Resolves both curated Florida schools and synthesized (Scorecard-only,
// no catalog) national schools by the same id — see getDirectorySchoolById.

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const school = getDirectorySchoolById(params.id);
  return {
    title: school ? `Study at ${school.name} | Vocation` : "Vocation",
  };
}

function Wordmark() {
  return <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>;
}

export default function SchoolProgramsPage({ params }: { params: { id: string } }) {
  if (!getDirectorySchoolById(params.id)) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 rounded">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-5 sm:flex">
              <Link href="/pathways" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Pathways
              </Link>
              <Link href="/schools" className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80">
                Schools
              </Link>
              <Link href="/insights" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Insights
              </Link>
            </nav>
          </div>
          <AuthControls />
        </div>
      </header>

      <main className="flex-1">
        <SchoolProgramBrowser schoolId={params.id} />
      </main>
    </div>
  );
}
