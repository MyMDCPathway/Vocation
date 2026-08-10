import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AuthControls } from "@/app/components/AuthControls";
import { PathwayFlow } from "@/app/components/plan/PathwayFlow";
import exampleData from "@/data/example-pathways.json";
import type { SchoolRef } from "@/app/lib/schoolRef";

// A fixed, read-only example route — what the landing page's "View Full
// Roadmap" cards actually show now, instead of sending every click into
// /start to generate the same thing over and over. Optimal, not personal:
// this is the same MDC generation every student gets for this career, with
// no location or income involved (see scripts/seed-examples.mjs).

const EXAMPLES = exampleData as Record<
  string,
  { title: string; steps: import("@/app/lib/types").PathwayStep[]; confidence?: "catalog" | "ai" }
>;

const MDC_SCHOOL_REF: SchoolRef = {
  id: "mdc",
  name: "Miami Dade College",
  city: "Miami",
  subdivision: "Florida",
  countryCode: "US",
  kind: "state-college",
  source: "catalog",
};

function Wordmark() {
  return <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>;
}

export function generateStaticParams() {
  return Object.keys(EXAMPLES).map((career) => ({ career }));
}

export function generateMetadata({ params }: { params: { career: string } }): Metadata {
  const career = EXAMPLES[params.career] ? params.career : decodeURIComponent(params.career);
  return {
    title: `${career} roadmap | Vocation`,
    description: `A real, catalog-grounded route to becoming ${career.toLowerCase()}.`,
  };
}

export default function RoadmapPage({ params }: { params: { career: string } }) {
  // Next.js decodes dynamic segments before this runs, so params.career is
  // usually already the plain "Registered Nurse" key — the decode fallback
  // only covers a client that encoded it again itself.
  const career = EXAMPLES[params.career] ? params.career : decodeURIComponent(params.career);
  const example = EXAMPLES[career];
  if (!example) notFound();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1000px] items-center justify-between px-5 py-4 md:px-16">
          <Link href="/" className="shrink-0 rounded">
            <Wordmark />
          </Link>
          <AuthControls />
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-10 md:px-16">
        <p className="text-xs font-semibold uppercase tracking-wider text-outline">
          Example roadmap
        </p>
        <h1 className="mt-1 text-2xl font-bold text-primary sm:text-4xl">Becoming {career}</h1>
        <p className="mt-2 text-on-surface-variant">
          {example.title} at Miami Dade College — the same route every
          student sees for this career, not personalized to you.
        </p>

        <div className="mt-8">
          <PathwayFlow
            pathway={{ title: example.title, isPrimary: true, steps: example.steps }}
            school={MDC_SCHOOL_REF}
            showStepCosts
          />
        </div>

        <div className="mt-10 rounded-xl border border-outline-variant bg-surface-lowest p-6">
          <p className="font-semibold text-on-surface">Want this planned for you?</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Your own route can differ by where you live, which schools you'd
            consider, and how you're paying for it.
          </p>
          <Link
            href="/start"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
          >
            Plan your own route
          </Link>
        </div>

        <p className="mt-8 text-xs leading-relaxed text-outline">
          <strong>Heads up:</strong> pathways and costs are AI-generated
          estimates built from Miami Dade College&apos;s real program
          catalog. Confirm details with an academic advisor before acting on
          them.
        </p>
      </main>
    </div>
  );
}
