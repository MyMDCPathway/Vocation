import type { Metadata } from "next";
import Link from "next/link";
import SchoolSelector from "@/app/components/SchoolSelector";

export const metadata: Metadata = {
  title: "Classic search | Vocation",
  description:
    "Pick your school, then search a career against its own program catalog.",
};

// The classic flow's front door — and the fix for a dangling reference.
//
// Classic (1.0) is school-first: you choose an institution, and the pathway is
// generated from THAT school's scraped catalog. Choosing lived on the old home
// page, which 2.0 replaced when the flow inverted to career-first (see commit
// "Vocation 2.0: invert the flow to career-first"). The selector component
// survived; the page rendering it did not.
//
// So /pathway's header has been telling students to "change school on the home
// page" while the home page hasn't had a school picker for months, and
// SchoolSelector has been imported by nothing at all. This is the page that
// reference points at again.
//
// Deliberately NOT a restoration of the old 1076-line home page. That file was
// the search box, the results, the flowchart and the school picker in one; all
// of it except the picker now lives in /pathway, and bringing the whole thing
// back would mean two copies of the same search drifting apart. This is only
// the part that went missing.
export default function ClassicHomePage() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-2xl px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-outline">
          Classic search
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-[-0.02em] text-primary md:text-4xl">
          Which school are you planning around?
        </h1>
        <p className="mt-4 text-on-surface-variant">
          Classic search builds your pathway from one school&apos;s own program
          catalog. Pick it here, then search the career you&apos;re aiming for.
        </p>

        <div className="mt-8 rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-card">
          <label className="text-sm font-medium text-on-surface-variant">
            Your school
          </label>
          <div className="mt-3">
            <SchoolSelector />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-outline">
            Your choice is remembered on this device and used for every classic
            search until you change it here.
          </p>
        </div>

        <Link
          href="/pathway"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium tracking-[0.05em] text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Go back to Current Search →
        </Link>

        <div className="mt-10 border-t border-outline-variant pt-6">
          <Link
            href="/"
            className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            ← Back to the guided version
          </Link>
        </div>
      </div>
    </main>
  );
}
