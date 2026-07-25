"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_SCHOOL_ID,
  getSchoolById,
  type School,
} from "@/app/lib/floridaSchools";
import { SCHOOL_STORAGE_KEY } from "@/app/lib/schoolStorage";

// Reads the selected school, shared by the header, the selector, and the
// pathway page.
//
// The stored id is read in an effect rather than during render because
// localStorage doesn't exist on the server: reading it inline would make the
// server and first client render disagree and trip a hydration mismatch. The
// brief flash of the default is invisible in practice, and the palette is
// already applied before paint by SchoolThemeScript.

export function useSelectedSchoolId(): [string, (id: string) => void] {
  const [schoolId, setSchoolId] = useState<string>(DEFAULT_SCHOOL_ID);

  useEffect(() => {
    const stored = localStorage.getItem(SCHOOL_STORAGE_KEY);
    if (stored && getSchoolById(stored)) setSchoolId(stored);
  }, []);

  const select = (id: string) => {
    setSchoolId(id);
    localStorage.setItem(SCHOOL_STORAGE_KEY, id);
  };

  return [schoolId, select];
}

/** The selected school, falling back to the default if the id is unknown. */
export function useSelectedSchool(): School {
  const [schoolId] = useSelectedSchoolId();
  return getSchoolById(schoolId) ?? getSchoolById(DEFAULT_SCHOOL_ID)!;
}
