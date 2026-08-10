import type { Metadata } from "next";
import Link from "next/link";

// A real Help Center, replacing the disabled "Help Center — Soon" menu item.
//
// Every answer here is a fact this codebase already states somewhere else —
// the AI-generated disclaimer on /plan and app/page.tsx, the catalog-vs-AI
// distinction /schools and /pathways both show, and what accounts actually
// do per HANDOFF §15. Nothing invented, no promised feature that isn't real.

export const metadata: Metadata = {
  title: "Help | Vocation",
  description: "Answers to common questions about how Vocation works.",
};

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Are the pathways real?",
    answer:
      "The programs are real wherever we hold a school's own scraped catalog — those steps come from that school's actual program list, never invented. Where we don't have a catalog, the AI proposes programs and we fetch each program's page before showing it to you, so a dead link gets flagged rather than shown as real. Either way, pathways and costs are AI-generated estimates — confirm details with an academic advisor and the school's own site before acting on them.",
  },
  {
    question: "What's the difference between \"Full catalog\" and \"AI-sourced\"?",
    answer:
      "\"Full catalog\" means we scraped that school's entire program list directly, so a generated pathway can only pick a program that genuinely exists. \"AI-sourced\" means the model proposed the programs itself and our server verified each claimed URL by actually fetching it — a real check, but a weaker guarantee than a scraped catalog.",
  },
  {
    question: "Do I need an account?",
    answer:
      "No. You can search a career, generate a plan, and see costs with no account at all. An account adds one thing on top: saving a plan so you can come back to it, edit its steps, or add notes. Signing out doesn't lose your ability to plan — it loses the ability to save.",
  },
  {
    question: "How do I edit a saved pathway?",
    answer:
      "Open it from Your Pathways. You can reorder or remove steps and add your own notes — you can't add a brand-new step, since a step you type in yourself isn't a program we've verified exists. \"Reset to original\" undoes every edit and restores the plan exactly as it was generated.",
  },
  {
    question: "Why does a school show \"Not available yet\" for earnings or completion rate?",
    answer:
      "Those figures come from a real federal dataset (the US Dept. of Education's College Scorecard) that has to be fetched and committed before we can show it — we never estimate a number to fill the gap. If it says \"Not available yet\", it means that dataset hasn't been loaded for this deployment, not that the school has no data anywhere.",
  },
  {
    question: "Can I reset my password?",
    answer:
      "Not yet — there's no password-reset flow in this version. If you're locked out, sign up again with the same email once support is available, or reach out directly.",
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto w-full max-w-2xl px-6 py-12">
        <h1 className="text-3xl font-bold text-primary">Help</h1>
        <p className="mt-2 text-on-surface-variant">
          Answers to the questions that come up most.
        </p>

        <div className="mt-8 space-y-6">
          {FAQS.map((faq) => (
            <div key={faq.question} className="rounded-xl bg-surface-lowest p-5 shadow-card">
              <h2 className="font-semibold text-on-surface">{faq.question}</h2>
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{faq.answer}</p>
            </div>
          ))}
        </div>

        <div className="mt-10">
          <Link href="/" className="text-sm font-medium text-primary hover:text-primary-container">
            ← Back to Vocation
          </Link>
        </div>
      </div>
    </main>
  );
}
