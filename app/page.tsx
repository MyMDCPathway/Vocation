import Link from "next/link";
import IntakeWizard from "@/app/components/IntakeWizard";

// The landing page IS the first question.
//
// 1.0 opened with a hero, a school picker, and a Start button — three
// interactions before the student told us anything we could act on, and the
// first of them ("which school?") was a question most people can't answer
// until they know what they're studying. 2.0 opens on the one question every
// visitor already knows the answer to, and derives the school from everything
// they say afterwards.
//
// This is a server component; the wizard below it is the client boundary.

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-school-600">
            Vocation
          </Link>
          <span className="text-sm text-gray-500">Florida career planning</span>
        </div>
      </header>

      <main className="flex-1">
        <IntakeWizard />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-school-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-school-600 transition-colors">
              Terms
            </Link>
            <Link href="/team" className="hover:text-school-600 transition-colors">
              Meet the team
            </Link>
            <Link href="/pathway" className="hover:text-school-600 transition-colors">
              Classic search
            </Link>
          </div>
          {/* Standing rule: every view that leads to a pathway says the
              pathways are AI-generated. This is the first one. */}
          <p className="mt-4 text-xs leading-relaxed text-gray-500">
            <strong>Heads up:</strong> pathways and costs are AI-generated
            estimates built from real program catalogs. They&apos;re a starting
            point — confirm the details with an academic advisor before you act
            on them.
          </p>
        </div>
      </footer>
    </div>
  );
}
