import { FLORIDA_SCHOOLS, DEFAULT_SCHOOL_ID } from "@/app/lib/floridaSchools";
import { scaleToCssVars } from "@/app/lib/schoolTheme";
import { SCHOOL_STORAGE_KEY } from "@/app/lib/schoolStorage";

// Applies the saved school's palette before the browser paints.
//
// A React effect would run after first paint, so every page load would flash
// MDC blue and then snap to the school's color. Instead the whole palette is
// precomputed here at build time and shipped as a lookup table that a blocking
// inline script reads — the same trick dark-mode toggles use. The scales are
// small (ten hex strings per school) and this runs before any markup renders.
export default function SchoolThemeScript() {
  const palettes = Object.fromEntries(
    FLORIDA_SCHOOLS.map((school) => [school.id, scaleToCssVars(school.color)])
  );

  const script = `
(function () {
  try {
    var id = localStorage.getItem(${JSON.stringify(SCHOOL_STORAGE_KEY)});
    if (!id || id === ${JSON.stringify(DEFAULT_SCHOOL_ID)}) return;
    var vars = (${JSON.stringify(palettes)})[id];
    if (!vars) return;
    for (var name in vars) document.documentElement.style.setProperty(name, vars[name]);
  } catch (e) {
    // Private browsing can throw on localStorage; the CSS defaults still apply.
  }
})();`.trim();

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
