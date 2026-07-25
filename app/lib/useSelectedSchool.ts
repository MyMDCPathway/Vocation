"use client";

import {
  DEFAULT_SCHOOL_ID,
  getSchoolById,
  type School,
} from "@/app/lib/floridaSchools";
import { useSchoolId } from "@/app/components/SchoolProvider";
import { schoolCookieValue, SCHOOL_STORAGE_KEY } from "@/app/lib/schoolStorage";

// Reads the selected school, shared by the header, the selector, the footer,
// and the pathway page.
//
// The value comes from SchoolProvider, which the server seeds from a cookie —
// NOT from a localStorage read in an effect. That difference is the whole fix
// for the logo flash: an effect (even a layout effect) runs after the browser
// has already painted the server's HTML, so the wrong logo was on screen before
// any correction could happen. Now the server renders the right one and this
// just reads what it decided.

export function useSelectedSchoolId(): [string, (id: string) => void] {
  const schoolId = useSchoolId();

  // Persisting is a full-page concern: the cookie has to reach the server, and
  // every consumer re-reads on the next render, so callers reload after this.
  const select = (id: string) => {
    document.cookie = schoolCookieValue(id);
    localStorage.setItem(SCHOOL_STORAGE_KEY, id);
  };

  return [schoolId, select];
}

/** The selected school, falling back to the default if the id is unknown. */
export function useSelectedSchool(): School {
  const schoolId = useSchoolId();
  return getSchoolById(schoolId) ?? getSchoolById(DEFAULT_SCHOOL_ID)!;
}
