"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loadIntake, saveIntake } from "@/app/lib/intakeStorage";

/**
 * The compact search bar docked in the header.
 *
 * Same real behaviour as the hero's CareerSearch — seed the stored intake,
 * route to /start — just condensed to a single input for a bar that has to
 * fit next to the wordmark and the nav. Two places doing the same job in two
 * sizes, not two different features.
 */
export function HeaderSearch() {
  const [career, setCareer] = useState("");
  const router = useRouter();

  function start() {
    const raw = career.trim();
    if (!raw) return;
    saveIntake({ ...loadIntake(), career: { raw, resolved: raw } });
    router.push("/start");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        start();
      }}
      className="relative hidden w-full max-w-sm md:block"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="text"
        value={career}
        onChange={(event) => setCareer(event.target.value)}
        placeholder="Search for your dream career…"
        aria-label="Search for a career"
        autoComplete="off"
        className="w-full rounded-full border border-outline-variant bg-surface-low py-2 pl-9 pr-4 text-sm text-on-surface placeholder:text-outline focus:border-primary focus:bg-surface-lowest focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </form>
  );
}
