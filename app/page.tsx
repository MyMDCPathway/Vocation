import Link from "next/link";
import { CareerSearch } from "@/app/components/landing/CareerSearch";
import { AuthControls } from "@/app/components/AuthControls";
import { RevealSection } from "@/app/components/shared/RevealSection";
import { listCuratedInterests } from "@/app/lib/interests";
import { auth } from "@/app/lib/auth";
import { db } from "@/app/lib/db";
import { FeedbackLink } from "@/app/components/FeedbackLink";

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

function HealthcareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <path
        d="M12 20.5s-7.5-4.6-9.5-9.3C1.2 8 2.8 4.8 5.9 4.2c1.9-.4 3.8.4 5 1.9l1.1 1.4 1.1-1.4c1.2-1.5 3.1-2.3 5-1.9 3.1.6 4.7 3.8 3.4 7-2 4.7-9.5 9.3-9.5 9.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M6 12.5h2.6l1.4-2.8 2 5.6 1.4-2.8H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TechnologyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <rect x="7" y="7" width="10" height="10" rx="1.3" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M9.5 7V3.5M14.5 7V3.5M9.5 20.5V17M14.5 20.5V17M7 9.5H3.5M7 14.5H3.5M20.5 9.5H17M20.5 14.5H17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TradeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <path
        d="M14.5 9.5 19 5c.9.4 1.7 1.1 2 2l-4.5 4.5M9.5 14.5 5 19c-.9-.4-1.7-1.1-2-2l4.5-4.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.5 6.5 6.5 12.5a2.8 2.8 0 0 0 4 4l6-6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BusinessIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <rect x="3.5" y="8" width="17" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M8.5 8V6a1.7 1.7 0 0 1 1.7-1.7h3.6A1.7 1.7 0 0 1 15.5 6v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M3.5 13h17" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function CreativeArtsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <path
        d="M12 3.5c-4.7 0-8.5 3.5-8.5 7.8 0 3.4 2.7 4.2 4.3 3.6 1.3-.5 2.4.4 2.4 1.7 0 1 .8 2.4 2.5 2.4 4.7 0 8.3-3.9 7.7-8.9-.5-4.1-4.2-6.6-8.4-6.6Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="8.5" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

function EducationIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6 text-secondary">
      <path
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.747 0-3.332.477-4.5 1.253"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const INTEREST_ICONS: Record<string, () => JSX.Element> = {
  stem: TechnologyIcon,
  healthcare: HealthcareIcon,
  "skilled-trades": TradeIcon,
  business: BusinessIcon,
  "creative-arts": CreativeArtsIcon,
  education: EducationIcon,
};

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

/** "STEM", "STEM and Healthcare", "STEM, Healthcare, and Business" — never a
 *  dangling Oxford comma on a two-item list. */
function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

export default async function Home() {
  const year = new Date().getFullYear();
  // Server Component — safe to read the committed BLS occupation table
  // directly rather than through /api/interests, since this never ships to
  // the browser bundle (see interests.ts's own header on that discipline).
  const interests = listCuratedInterests();

  // Same discipline, extended to auth: a Server Component can read the
  // session and the DB directly without a round trip through an API route,
  // and neither ships to the client bundle either. onboarding's interests
  // picker (app/onboarding/page.tsx) is the only writer of this column.
  const session = await auth();
  const savedInterests = session?.user?.id
    ? ((await db.user.findUnique({
        where: { id: session.user.id },
        select: { interests: true },
      }))?.interests ?? [])
    : [];

  // Array.prototype.sort is stable, so ties (two matched, or two unmatched
  // tiles) keep their original relative order rather than shuffling.
  const orderedInterests = savedInterests.length
    ? [...interests].sort((a, b) => {
        const aMatched = savedInterests.includes(a.slug) ? 0 : 1;
        const bMatched = savedInterests.includes(b.slug) ? 0 : 1;
        return aMatched - bMatched;
      })
    : interests;
  const matchedLabels = interests
    .filter((interest) => savedInterests.includes(interest.slug))
    .map((interest) => interest.label);

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
        {/* Hero — single centred column. No eyebrow above the heading: the
            heading carries its own weight. */}
        <section className="px-5 pb-20 pt-16 text-center md:px-16 md:pb-28 md:pt-24">
          <div className="mx-auto max-w-3xl">
            <h1 className="hero-enter-1 text-2xl font-bold leading-[1.15] tracking-[-0.02em] text-primary sm:text-5xl">
              Your Path to the Career You Want,
              <br />
              <span className="text-secondary">Simplified.</span>
            </h1>

            <p className="hero-enter-2 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-on-surface-variant">
              Discover tailored roadmaps, required certifications, and the real
              programs that get you there — from where you are to where you
              want to be. Grounded clarity, step by step.
            </p>

            <div className="hero-enter-3 mx-auto mt-8 max-w-2xl text-left">
              <CareerSearch examples={EXAMPLE_CAREERS} />
            </div>

            {/* Sits between the search card and the OR divider on purpose:
                it's the last thing read before committing to the guided flow,
                which is the only moment someone might still choose the other
                one. Asking plainly because 1.0 gets almost no traffic, and a
                flow nobody uses can't be compared against a flow everybody
                does — see app/lib/feedback.ts. */}
            <p className="hero-enter-4 mx-auto mt-4 max-w-2xl text-sm text-on-surface-variant">
              Please try out the{" "}
              <Link
                href="/pathway"
                className="font-semibold text-blue-600 underline underline-offset-2 transition-colors hover:text-blue-700"
              >
                classic search
              </Link>{" "}
              too — we&apos;re comparing it against this one and your take
              genuinely decides which stays.
            </p>

            <div className="hero-enter-4 mx-auto mt-6 flex max-w-2xl items-center gap-4">
              <span className="h-px flex-1 bg-outline-variant" />
              <span className="text-xs font-semibold uppercase tracking-wider text-outline">
                or
              </span>
              <span className="h-px flex-1 bg-outline-variant" />
            </div>

            <Link
              href="/career-discovery"
              className="hero-enter-5 mx-auto mt-6 flex max-w-2xl items-center justify-center gap-2 rounded-full border border-outline-variant bg-surface-low px-6 py-3 text-sm font-medium tracking-[0.05em] text-primary transition-colors hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

            {/* Shares hero-enter-5 with the quiz link above rather than taking
                a sixth delay step. The stagger's last element already settles
                at 1.2s, which is the ceiling globals.motion.test.ts holds so
                arrival never reads as a loading screen — a sixth step would
                push past it for a link that isn't part of the main journey. */}
            <FeedbackLink
              flow="home"
              label="Please give feedback by clicking here"
              className="hero-enter-5 mx-auto mt-4 flex max-w-2xl items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-medium tracking-[0.05em] text-white transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            />
          </div>
        </section>

        {/* Browse by Interest — six real doors into the actual BLS
            occupation taxonomy (see interests.ts). Picking a tile opens that
            interest's real job pool, not a single fixed example — the tile
            itself makes no claim beyond "these are real jobs in this area",
            which is exactly what jobCount (computed from the same table,
            never hardcoded) backs up. */}
        <section id="browse-by-interest" className="px-5 py-20 md:px-16">
          <RevealSection className="mx-auto w-full max-w-[1200px]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.01em] text-primary">
                  Browse by Interest
                </h2>
                <p className="mt-2 max-w-2xl text-on-surface-variant">
                  {matchedLabels.length > 0
                    ? `Because you're interested in ${formatList(matchedLabels)} — pick up where you left off, or explore something new.`
                    : "Not sure what to search? Pick an area and see the real jobs in it."}
                </p>
              </div>
              <Link
                href="/interests"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-secondary/80"
              >
                Browse all industries
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

            <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
              {orderedInterests.map((interest) => {
                const Icon = INTEREST_ICONS[interest.slug];
                return (
                  <Link
                    key={interest.slug}
                    href={`/interests/${interest.slug}`}
                    className="group flex flex-col rounded-lg border border-outline-variant bg-gradient-to-bl from-secondary-container/10 to-surface-lowest p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                  >
                    <Icon />
                    <p className="mt-5 text-lg font-semibold text-on-surface">
                      {interest.label}
                    </p>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                      {interest.description}
                    </p>
                    <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary">
                      {interest.jobCount} real jobs
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
          </RevealSection>
        </section>

        {/* How Vocation Works — an accurate description of the real flow:
            search, generate, follow. Nothing here is aspirational. Step 1
            gets the teal accent as the "you are here" step; 2 and 3 stay
            neutral until reached. */}
        <section className="bg-surface-container px-5 py-20 md:px-16 md:py-24">
          <RevealSection className="mx-auto w-full max-w-[1200px] text-center">
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
          </RevealSection>
        </section>

        {/* Example routes — real programs, real credentials, no invented wages. */}
        <section className="px-5 py-20 md:px-16 md:py-24">
          <RevealSection className="mx-auto w-full max-w-[1200px]">
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
                      href={`/roadmaps/${encodeURIComponent(route.goal)}`}
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
          </RevealSection>
        </section>
      </main>

      <footer className="border-t border-outline-variant bg-surface-lowest px-5 py-12 md:px-16">
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <Wordmark />
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-on-surface-variant">
                An independent project, not affiliated with or endorsed by any
                school. Plans against 53 Florida institutions in depth, and
                any school in the world with verification.
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-8 gap-y-3">
              {FOOTER_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              {/* Last in the row, and outside FOOTER_LINKS, because it leaves
                  the site — every other entry here is an internal route. */}
              <FeedbackLink flow="home" />
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
