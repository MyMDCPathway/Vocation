// Where the selected school is persisted.
//
// A COOKIE, not localStorage, is the source of truth — because the server has
// to know the school before it renders. localStorage is invisible to the
// server, so the HTML always went out with Miami Dade College's logo in it and
// the browser painted that before React could correct it. No client-side effect
// can beat that: the wrong logo is already on screen by the time JavaScript
// runs. A cookie rides along with the request, so the server renders the right
// school from the start.
//
// localStorage is still written alongside it so an existing selection survives
// the switch to cookies (see the migration in SchoolProvider), but nothing
// reads it as authoritative any more.
export const SCHOOL_STORAGE_KEY = "vocation.school";

export const SCHOOL_COOKIE_NAME = "vocation_school";

// A year: the choice is a durable preference, not a session detail.
const SCHOOL_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** document.cookie string that persists the selected school. */
export function schoolCookieValue(schoolId: string): string {
  return (
    `${SCHOOL_COOKIE_NAME}=${encodeURIComponent(schoolId)};` +
    ` path=/; max-age=${SCHOOL_COOKIE_MAX_AGE}; samesite=lax`
  );
}

/** Reads the school id out of a raw document.cookie string. */
export function readSchoolCookie(cookieString: string): string | null {
  for (const part of cookieString.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === SCHOOL_COOKIE_NAME) {
      return decodeURIComponent(rest.join("=")) || null;
    }
  }
  return null;
}
