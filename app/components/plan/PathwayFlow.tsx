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

/**
 * One pathway rendered as the horizontal step flow.
 *
 * Same `.flowchart-*` classes the 1.0 pathway page uses, so a step looks
 * identical wherever it appears — the difference here is that each card also
 * carries its own share of the cost, which is what makes the three tracks
 * comparable step by step rather than only at the total.
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

  return (
    <>
      <div className="flowchart-container">
        {pathway.steps.map((step: PathwayStep, index: number) => {
          const stepCost = costs.steps[index];
          const isFree = stepCost.range.high === 0;

          return (
            <div key={index}>
              {index > 0 && <div className="flowchart-connector" />}
              <div className={`flowchart-step flowchart-step-${step.type}`}>
                <div className="flowchart-step-header">
                  <div className="flowchart-step-header-icon">{icons[step.type]}</div>
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {step.level || step.type}
                  </span>
                </div>
                <div className="flowchart-step-content">
                  <h3 className="text-lg font-semibold text-primary">{step.name}</h3>
                  <p className="mt-2 text-on-surface-variant">{step.description}</p>

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
            </div>
          );
        })}
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
