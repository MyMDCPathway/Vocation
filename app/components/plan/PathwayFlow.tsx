"use client";

import { useState } from "react";
import { icons } from "@/app/lib/icons";
import { ProgramLink } from "@/app/components/ProgramLink";
import { ExamStepComponent } from "@/app/components/ExamStep";
import type { CertificationInfo } from "@/app/lib/certifications";
import type { PathwayOption, PathwayStep } from "@/app/lib/types";
import { estimatePlanCost, formatCostRange } from "@/app/lib/planCost";
import type { SchoolRef } from "@/app/lib/schoolRef";
import { StepVerificationBadge } from "@/app/components/plan/ConfidenceBanner";
import { getSchoolInfo, hasSchoolInfo } from "@/app/lib/schoolInfo";

/**
 * One pathway rendered as a vertical timeline: a rail in the school's own
 * color connecting neutral numbered step markers, each with a card beside
 * it. Replaces the old horizontal .flowchart-* card row (still used by
 * classic /pathway 1.0, deliberately left alone — see globals.css's
 * .pathway-timeline-* header).
 *
 * Nodes are plain numbers, not check/current/future states: nothing in this
 * app tracks which step a student has actually completed, and a progress
 * indicator that isn't real would be worse than none. Step TYPE (degree,
 * transfer, internship, exam) is conveyed by each card's own badge chip.
 */
export function PathwayFlow({
  pathway,
  school,
  showStepCosts,
}: {
  pathway: PathwayOption;
  school: SchoolRef;
  showStepCosts: boolean;
}) {
  const [requirements, setRequirements] = useState<{
    name: string;
    info: CertificationInfo;
  } | null>(null);

  const schoolId = school.id;
  const costs = estimatePlanCost(pathway.steps, schoolId, school.tuition);
  const info = hasSchoolInfo(schoolId) ? getSchoolInfo(schoolId) : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          {pathway.steps.map((step: PathwayStep, index: number) => {
            const stepCost = costs.steps[index];
            const isFree = stepCost.range.high === 0;
            const isLast = index === pathway.steps.length - 1;

            return (
              <div key={index} className="flex gap-4">
                {/* Rail: numbered node + connecting line down to the next step. */}
                <div className="flex flex-col items-center">
                  <div className="pathway-timeline-node flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold">
                    {index + 1}
                  </div>
                  {!isLast && <div className="pathway-timeline-rail w-0.5 flex-1" />}
                </div>

                <div className={`min-w-0 flex-1 rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-card ${isLast ? "mb-0" : "mb-6"}`}>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                      {icons[step.type]}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                      {step.level || step.type}
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-primary">{step.name}</h3>
                  <p className="mt-1 text-on-surface-variant">{step.description}</p>

                  {showStepCosts && (
                    <div className="mt-4 rounded-lg bg-surface px-3 py-2">
                      <p className="text-sm font-semibold text-primary">
                        {isFree ? "No tuition cost" : formatCostRange(stepCost.range)}
                      </p>
                      <p className="mt-0.5 text-xs text-outline">{stepCost.label}</p>
                    </div>
                  )}

                  {/* A catalog school resolves its own links from the scraped
                      name→URL table. An open school has no table, so the link
                      is whatever the server managed to verify — and the badge
                      says which of the three outcomes this step got. */}
                  {school.source === "catalog" ? (
                    <ProgramLink step={step} schoolId={schoolId} />
                  ) : (
                    step.link && (
                      <div>
                        {step.link.url && (
                          <a
                            href={step.link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={step.link.reason}
                            className={`mt-4 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium transition duration-150 ${
                              step.link.status === "verified"
                                ? "border-transparent bg-ink text-white shadow-sm hover:opacity-90"
                                : "border-primary bg-surface-lowest text-on-surface hover:bg-surface-container"
                            }`}
                          >
                            <i className="fas fa-external-link-alt mr-2" />
                            {step.link.status === "verified"
                              ? "View Program Page"
                              : "View School's Program List"}
                          </a>
                        )}
                        <div>
                          <StepVerificationBadge
                            status={step.link.status}
                            reason={step.link.reason}
                          />
                        </div>
                      </div>
                    )
                  )}

                  {step.type === "exam" && (
                    <ExamStepComponent
                      examName={step.name}
                      examDescription={step.description}
                      onShowRequirements={(name, info) => setRequirements({ name, info })}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Real advising links only — never a fabricated advisor or a
            "Continue Learning" action nothing here can back up. When we hold
            no curated info for this school (an AI-discovered "open" school),
            this drops to a generic advisor note rather than showing
            another school's contacts under this one's name. */}
        <aside className="h-fit rounded-xl border border-outline-variant bg-surface-lowest p-5 lg:sticky lg:top-20">
          <p className="text-sm font-semibold text-on-surface">Need advising?</p>
          {info ? (
            <div className="mt-3 space-y-3">
              {info.contacts.map((contact) => (
                <a
                  key={contact.email}
                  href={`mailto:${contact.email}`}
                  className="block text-sm text-secondary hover:text-secondary/80"
                >
                  {contact.label}: {contact.email}
                </a>
              ))}
              {info.resources.map((resource) => (
                <a
                  key={resource.url}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-secondary hover:text-secondary/80"
                >
                  {resource.label} ↗
                </a>
              ))}
              {info.transferAgreementsUrl && (
                <a
                  href={info.transferAgreementsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-sm text-secondary hover:text-secondary/80"
                >
                  Transfer agreements ↗
                </a>
              )}
            </div>
          ) : (
            <p className="mt-2 text-sm text-on-surface-variant">
              Confirm this route with an academic advisor at {school.name} before acting on it.
            </p>
          )}
        </aside>
      </div>

      {requirements && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4"
          onClick={() => setRequirements(null)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-surface-lowest shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-outline-variant p-5">
              <h2 className="text-lg font-bold text-primary">
                {requirements.name} — Requirements
              </h2>
              <button
                onClick={() => setRequirements(null)}
                className="text-outline transition hover:text-primary"
                aria-label="Close"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </header>
            <main className="overflow-y-auto p-6">
              <ul className="space-y-2 pl-5 text-sm text-on-surface-variant">
                {requirements.info.requirements.map((req, i) => (
                  <li key={i} className="list-outside list-disc leading-relaxed">
                    {req}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-outline-variant pt-6">
                <a
                  href={requirements.info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-purple-700"
                >
                  <i className="fas fa-external-link-alt mr-2" /> Visit official website
                </a>
              </div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
