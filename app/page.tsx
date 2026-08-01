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
// NO NAV BAR, deliberately. There is exactly one thing to do on this page, and
// a header full of links is an invitation to do something else. The wordmark
// sits centred above the question instead, which is branding without being a
// distraction — see StepShell, which renders it for every step.
//
// This is a server component; the wizard below it is the client boundary.

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-sand">
      <main className="flex-1">
        <IntakeWizard />
      </main>

      {/* The footer picks up the deeper sand and the arc, so the page ends on
          the same curved hand-off the rest of the design uses. */}
      <footer className="arc-top mt-16 bg-sand-deep">
        <div className="mx-auto max-w-5xl px-6 pb-10 pt-12">
          <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm font-medium text-ink-faint">
            <Link href="/privacy" className="transition-colors hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-ink">
              Terms
            </Link>
            <Link href="/team" className="transition-colors hover:text-ink">
              Meet the team
            </Link>
            <Link href="/pathway" className="transition-colors hover:text-ink">
              Classic search
            </Link>
          </div>
          {/* Standing rule: every view that leads to a pathway says the
              pathways are AI-generated. This is the first one. */}
          <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-ink-faint">
            <strong className="text-ink-soft">Heads up:</strong> pathways and
            costs are AI-generated estimates built from real program catalogs.
            They&apos;re a starting point — confirm the details with an academic
            advisor before you act on them.
          </p>
        </div>
      </footer>
    </div>
  );
}
