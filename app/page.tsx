import Link from "next/link";
import { CareerSearch } from "@/app/components/landing/CareerSearch";
import { AuthControls } from "@/app/components/AuthControls";

// The landing page, in the Empowered Clarity world (see DESIGN.md).
//
// Everything factual on this page is checked. Three rules governed what could
// go on it, all from PRODUCT.md:
//
//   - No invented outcome figures. There is no usage data, no ROI benchmark,
//     and no evidence any student has acted on a plan, so none is implied. The
//     example routes below name real MDC programs and their real credentials;
//     wage figures appear on the plan itself, where they come from a live BLS
//     series and are labelled as estimates.
//   - No control for a capability that doesn't exist. No sign-in, no
//     notifications, no settings, no "saved pathways" — there is no auth and
//     no persistence beyond the tab. The header has a real search box, not a
//     bell/gear/avatar cluster implying an account system.
//   - The AI disclaimer appears on every view that leads to a pathway. This is
//     one of them.

/** Careers that already resolve to a canonical pathway, so the chips can't dead-end. */
const EXAMPLE_CAREERS = ["Registered Nurse", "Electrician", "Welder", "Software Engineer"];

/**
 * Three real MDC Associate in Science programs, each with a genuinely
 * different way into the job — a state licence, an industry certification,
 * and a federal certificate. That contrast is the product's actual thesis
 * (not every career runs through a degree ladder), which is why these three
 * rather than three lookalike degrees.
 *
 * Program names and URLs come from app/lib/mdc-programs.ts, which was scraped
 * and hand-verified against MDC's own catalog. Nothing here is generated.
 */
const EXAMPLE_ROUTES = [
  {
    field: "Healthcare",
    program: "Nursing — R.N.",
    href: "https://www.mdc.edu/nursingrn/",
    credential: "NCLEX-RN",
    credentialKind: "State licence",
    goal: "Registered Nurse",
  },
  {
    field: "Technology",
    program: "Applied Artificial Intelligence",
    href: "https://www.mdc.edu/appliedai/",
    credential: "Industry certification",
    credentialKind: "No licence required",
    goal: "Machine Learning Technician",
  },
  {
    field: "Skilled trade",
    program: "Aviation Maintenance Management",
    href: "https://www.mdc.edu/aviationmaintenance/",
    credential: "FAA Airframe & Powerplant",
    credentialKind: "Federal certificate",
    goal: "Aircraft Maintenance Technician",
  },
];

/**
 * "Where are you starting from?" — three real entry points into the same
 * intake, framed for where a visitor actually is rather than what degree they
 * already hold. All three lead to the identical, honest /start flow: there is
 * no separate per-audience logic to fake, just a different door in.
 */
const STARTING_POINTS = [
  {
    id: "student",
    title: "I am a Student",
    detail: "Plan your academic path to line up with the career you actually want.",
    cta: "Explore paths",
  },
  {
    id: "career-changer",
    title: "I am a Career Changer",
    detail: "Find the transferable ground you already have and the bridge to the new field.",
    cta: "Start the pivot",
  },
  {
    id: "graduate",
    title: "I am a Recent Graduate",
    detail: "Work out the licences, certifications, or first role that gets you employed.",
    cta: "Launch your career",
  },
] as const;

/** How the product actually works, in the order a visitor experiences it. */
const HOW_IT_WORKS = [
  {
    step: "Step 1",
    title: "Search",
    detail: "Enter the career or role you want — a title is enough to start.",
  },
  {
    step: "Step 2",
    title: "Generate your route",
    detail: "Get a real, step-by-step path: programs, transfers, licences, and cost.",
  },
  {
    step: "Step 3",
    title: "Follow the path",
    detail: "Compare schools, see what it costs where you live, and act on it.",
  },
] as const;

const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/team", label: "Meet the team" },
  { href: "/pathway", label: "Classic search" },
];

function Wordmark() {
  return (
    <span className="text-lg font-bold tracking-tight text-primary">
      Vocation
    </span>
  );
}

function GraduationCapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <path
        d="M12 5 2 9.5 12 14l10-4.5L12 5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 11.5V16c0 1.4 2.46 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M21 9.5V15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PivotIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <path
        d="M4 8h13.5M17.5 8 14 4.5M20 16H6.5M6.5 16 10 19.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <rect x="3" y="8" width="18" height="11" rx="1.7" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.5 8V6.2c0-.7.6-1.2 1.3-1.2h4.4c.7 0 1.3.5 1.3 1.2V8"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3 13h18" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

const STARTING_POINT_ICONS = {
  student: GraduationCapIcon,
  "career-changer": PivotIcon,
  graduate: BriefcaseIcon,
} as const;

function SearchStepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 text-secondary">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** The same connector-and-nodes motif used on the route cards below — three
 *  points on a line, because generating a route IS the roadmap motif. */
function RoadmapStepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 text-secondary">
      <path d="M5 18 10 7l4 7 5-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="5" cy="18" r="1.4" fill="currentColor" />
      <circle cx="19" cy="5" r="1.4" fill="currentColor" />
    </svg>
  );
}

function FlagStepIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-5 w-5 text-secondary">
      <path d="M6 3v18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M6 4.5h9.5c1 0 1.5.9.9 1.6l-2 2.4 2 2.4c.6.7.1 1.6-.9 1.6H6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const HOW_IT_WORKS_ICONS = [SearchStepIcon, RoadmapStepIcon, FlagStepIcon];

export default function Home() {
  const year = new Date().getFullYear();

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      {/* Sticky, bordered, no shadow. Tint and shadow separate elsewhere, but a
          top bar reads better with an explicit edge.

          The bell / gear / avatar on the right are DECORATIVE ONLY — plain
          spans, not links or buttons, and the avatar is a bare glyph rather
          than a photo. This product has no accounts, no notifications, and no
          settings page; a clickable control here would promise a capability
          that doesn't exist. If auth ever ships, these are where it plugs in. */}
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-16">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="shrink-0 rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            >
              <Wordmark />
            </Link>

            <nav className="hidden items-center gap-5 sm:flex">
              <Link
                href="/start"
                className="text-sm font-medium text-primary transition-colors hover:text-primary-container"
              >
                Pathways
              </Link>
              <Link
                href="/pathway"
                className="text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
              >
                Schools
              </Link>
              <Link
                href="/career-discovery"
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
        {/* Hero — single centred column. No eyebrow above the heading: the
            heading carries its own weight. */}
        <section className="px-5 pb-20 pt-16 text-center md:px-16 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-primary sm:text-5xl">
              Your Path to the Career You Want,
              <br />
              <span className="text-secondary">Simplified.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Discover tailored roadmaps, required certifications, and the real
              programs that get you there — from where you are to where you
              want to be. Grounded clarity, step by step.
            </p>

            <div className="mx-auto mt-8 max-w-2xl text-left">
              <CareerSearch examples={EXAMPLE_CAREERS} />
            </div>

            <div className="mx-auto mt-6 flex max-w-2xl items-center gap-4">
              <span className="h-px flex-1 bg-outline-variant" />
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">
                or
              </span>
              <span className="h-px flex-1 bg-outline-variant" />
            </div>

            <Link
              href="/career-discovery"
              className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-low px-6 py-3 text-sm font-medium tracking-[0.05em] text-primary transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="9.5" />
                <path d="M9.5 9a2.5 2.5 0 1 1 3.2 2.4c-.7.2-1.2.9-1.2 1.6v.5" />
                <path d="M11.5 17h.01" />
              </svg>
              Not sure yet? Take the career quiz
            </Link>
          </div>
        </section>

        {/* Where are you starting from — three real doors into the same,
            honest intake. No per-audience content is invented; each just
            frames the same /start flow for where the visitor actually is. */}
        <section id="starting-from" className="px-5 py-20 md:px-16">
          <div className="mx-auto w-full max-w-[1200px]">
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-primary">
              Where are you starting from?
            </h2>

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {STARTING_POINTS.map((point) => {
                const Icon = STARTING_POINT_ICONS[point.id];
                return (
                  <Link
                    key={point.id}
                    href="/start"
                    className="group flex flex-col rounded-lg border border-outline-variant bg-gradient-to-bl from-secondary-container/10 to-surface-lowest p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <Icon />
                    <p className="mt-5 text-lg font-semibold text-on-surface">
                      {point.title}
                    </p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                      {point.detail}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
                      {point.cta}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      >
                        <path d="M5 12h13" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* How Vocation Works — an accurate description of the real flow:
            search, generate, follow. Nothing here is aspirational. Step 1
            gets the teal accent as the "you are here" step; 2 and 3 stay
            neutral until reached. */}
        <section className="bg-surface-container px-5 py-20 md:px-16 md:py-24">
          <div className="mx-auto w-full max-w-[1200px] text-center">
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-primary">
              How Vocation Works
            </h2>

            <div className="mt-12 grid grid-cols-1 gap-6 text-left md:grid-cols-3">
              {HOW_IT_WORKS.map((item, index) => {
                const Icon = HOW_IT_WORKS_ICONS[index];
                const active = index === 0;
                return (
                  <div
                    key={item.step}
                    className="rounded-lg border border-outline-variant bg-surface-lowest p-6"
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-md border ${
                        active
                          ? "border-secondary text-secondary"
                          : "border-outline-variant text-outline"
                      }`}
                    >
                      <Icon />
                    </span>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-outline">
                      {item.step}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-on-surface">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {item.detail}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Example routes — real programs, real credentials, no invented wages. */}
        <section className="px-5 py-20 md:px-16 md:py-24">
          <div className="mx-auto w-full max-w-[1200px]">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.01em] text-primary sm:text-[32px]">
                Three careers, three different ways in
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-on-surface-variant">
                Same college, same starting point — but a licence, a
                certification, and a federal certificate are not the same
                journey. Vocation works out which one applies before it shows
                you a single school.
              </p>
            </div>

            <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
              {EXAMPLE_ROUTES.map((route) => (
                <article
                  key={route.program}
                  className="flex flex-col overflow-hidden rounded-xl bg-surface-lowest shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  {/* Top accent bar — the same "marks a real thing" teal this
                      system uses on completed roadmap nodes, not decoration. */}
                  <span aria-hidden="true" className="block h-1 bg-secondary" />

                  <div className="flex flex-1 flex-col p-6">
                    <span className="inline-flex w-fit items-center rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-on-primary">
                      {route.field}
                    </span>

                    <p className="mt-4 text-xl font-semibold text-on-surface">
                      {route.goal}
                    </p>

                    <div className="mt-5 flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3">
                            <path d="m4 12 5 5L20 6" />
                          </svg>
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-outline">
                            Program
                          </p>
                          <a
                            href={route.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-secondary underline decoration-secondary/30 underline-offset-2 transition-colors hover:text-secondary/80"
                          >
                            {route.program}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-outline-variant"
                        />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-outline">
                            Credential
                          </p>
                          <p className="text-sm font-medium text-secondary">
                            {route.credential}
                          </p>
                          <p className="mt-0.5 text-xs text-on-surface-variant">
                            {route.credentialKind}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Link
                      href="/start"
                      className="mt-6 inline-flex items-center gap-2 border-t border-outline-variant pt-5 text-sm font-medium text-secondary transition-colors hover:text-secondary/80"
                    >
                      View Full Roadmap
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className="h-4 w-4"
                      >
                        <path d="M5 12h13" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-on-surface-variant">
              Programs and links above come from Miami Dade College&apos;s own
              catalog. Costs and wages appear on your plan, where they&apos;re
              priced per school and per metro.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-lowest px-5 py-12 md:px-16">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <Wordmark />
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-on-surface-variant">
                Built at Miami Dade College. Plans against 53 Florida
                institutions in depth, and any school in the world with
                verification.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-3">
              <a
                href="#starting-from"
                className="text-sm font-medium tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
              >
                Students
              </a>
              <a
                href="#starting-from"
                className="text-sm font-medium tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
              >
                Career Changers
              </a>
              <a
                href="#starting-from"
                className="text-sm font-medium tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
              >
                Graduates
              </a>
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-outline-variant pt-6 md:flex-row md:items-start md:justify-between">
            {/* Standing rule: every view that leads to a pathway says the
                pathways are AI-generated. This is the first one. */}
            <p className="text-xs leading-relaxed text-on-surface-variant md:max-w-2xl">
              <strong className="font-semibold text-on-surface">Heads up:</strong>{" "}
              pathways and costs are AI-generated estimates built from real
              program catalogs. They&apos;re a starting point — confirm the
              details with an academic advisor before you act on them.
            </p>
            <p className="whitespace-nowrap text-xs text-outline">
              © {year} Vocation. Grounded clarity for every career stage.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
