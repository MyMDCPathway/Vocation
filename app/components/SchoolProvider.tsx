"use client";

import { createContext, useContext, useEffect } from "react";
import { DEFAULT_SCHOOL_ID, getSchoolById } from "@/app/lib/floridaSchools";
import {
  SCHOOL_STORAGE_KEY,
  readSchoolCookie,
  schoolCookieValue,
} from "@/app/lib/schoolStorage";

// Carries the selected school from the server render down to every client
// component that needs it.
//
// This is what removes the logo flash. The server reads the cookie, renders the
// correct logo into the HTML, and hands the same id to this provider — so the
// server markup and the first client render agree, and the browser never paints
// a wrong logo that React then has to swap out.

const SchoolContext = createContext<string>(DEFAULT_SCHOOL_ID);

export function SchoolProvider({
  schoolId,
  children,
}: {
  schoolId: string;
  children: React.ReactNode;
}) {
  // One-time migration for anyone whose choice predates the cookie. Without
  // this their selection would silently reset to MDC on first load after the
  // change. It runs at most once: writing the cookie makes the condition false
  // on the next load.
  useEffect(() => {
    if (readSchoolCookie(document.cookie)) return;

    const stored = localStorage.getItem(SCHOOL_STORAGE_KEY);
    if (!stored || !getSchoolById(stored) || stored === schoolId) return;

    document.cookie = schoolCookieValue(stored);
    window.location.reload();
  }, [schoolId]);

  return (
    <SchoolContext.Provider value={schoolId}>{children}</SchoolContext.Provider>
  );
}

/** The selected school's id, known before the first paint. */
export function useSchoolId(): string {
  return useContext(SchoolContext);
}
