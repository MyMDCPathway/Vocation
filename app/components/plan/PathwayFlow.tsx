"use client";

import { useState } from "react";
import { icons } from "@/app/lib/icons";
import { ProgramLink } from "@/app/components/ProgramLink";
import { ExamStepComponent } from "@/app/components/ExamStep";
import type { CertificationInfo } from "@/app/lib/certifications";
import type { PathwayOption, PathwayStep } from "@/app/lib/types";
import { estimatePlanCost, formatCostRange } from "@/app/lib/planCost";

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
  schoolId,
  showStepCosts,
}: {
  pathway: PathwayOption;
  schoolId: string;
  showStepCosts: boolean;
}) {
  const [requirements, setRequirements] = useState<{
    name: string;
    info: CertificationInfo;
  } | null>(null);

  const costs = estimatePlanCost(pathway.steps, schoolId);

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
                  <h3 className="text-lg font-semibold text-gray-900">{step.name}</h3>
                  <p className="mt-2 text-gray-600">{step.description}</p>

                  {showStepCosts && (
                    <div className="mt-4 rounded-lg bg-gray-50 px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {isFree ? "No tuition cost" : formatCostRange(stepCost.range)}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">{stepCost.label}</p>
                    </div>
                  )}

                  <ProgramLink step={step} schoolId={schoolId} />

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
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-gray-200 p-5">
              <h2 className="text-lg font-bold text-gray-800">
                {requirements.name} — Requirements
              </h2>
              <button
                onClick={() => setRequirements(null)}
                className="text-gray-400 transition hover:text-gray-600"
                aria-label="Close"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </header>
            <main className="overflow-y-auto p-6">
              <ul className="space-y-2 pl-5 text-sm text-gray-700">
                {requirements.info.requirements.map((req, i) => (
                  <li key={i} className="list-outside list-disc leading-relaxed">
                    {req}
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-gray-200 pt-6">
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
