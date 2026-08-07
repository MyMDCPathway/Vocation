"use client";

// Where a "save this plan" click waits when nobody's signed in yet.
//
// sessionStorage, same reasoning as intakeStorage.ts: this is tab-scoped
// data with no reason to outlive the tab, and nothing about it needs the
// server to know before paint (so no cookie). Unlike the intake, this store
// holds exactly one pending save at a time — clicking "save" a second time
// before signing up replaces it rather than queuing both, since the student
// almost certainly meant "actually, save this one instead."

import type { SavedPathwayData } from "@/app/lib/types";

const STORAGE_KEY = "vocation_pending_save";

export interface PendingSave {
  career: string;
  schoolId: string;
  schoolName: string;
  data: SavedPathwayData;
}

export function savePending(pending: PendingSave): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Private browsing and full quotas both throw here. The student still
    // sees the sign-up prompt; they just retype "save" after signing in.
  }
}

export function loadPending(): PendingSave | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PendingSave) : null;
  } catch {
    return null;
  }
}

export function clearPending(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* see savePending */
  }
}
