// Where the selected school is persisted.
//
// Split into its own module because both a server component (SchoolThemeScript,
// which inlines the key into a pre-paint script) and a client component
// (SchoolSelector) need it, and importing a "use client" module from a server
// component to get one string would pull the whole component along with it.
export const SCHOOL_STORAGE_KEY = "vocation.school";
