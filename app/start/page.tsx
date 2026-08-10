import type { Metadata } from "next";
import IntakeWizard from "@/app/components/IntakeWizard";

// The intake lives here now.
//
// Through 2.0 the wizard rendered at "/", because the landing page WAS the
// first question. The Accredited Pathway world puts a real landing page in
// front of it (see DESIGN.md), so the flow needed its own route. The wizard
// itself is unchanged: CareerSearch on the landing page seeds the stored
// intake before routing here, and IntakeWizard reads that store on mount. When
// it finds a career there it skips its own career question and opens straight
// on the job summary — the landing page already asked, so asking again was a
// screen that only ever cost a click. Arriving from a bare "Plan your route"
// link still gets the question, because then nobody has asked yet.

export const metadata: Metadata = {
  title: "Plan your route | Vocation",
  description:
    "Answer a few questions and get a costed, step-by-step route into the career you want.",
};

export default function Start() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <main className="flex-1">
        <IntakeWizard />
      </main>
    </div>
  );
}
