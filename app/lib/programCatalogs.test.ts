import { describe, it, expect } from "vitest";
import { catalogFor, scrapedCatalogIds } from "@/app/lib/programCatalogs";
import { SCHOOLS_WITH_CATALOG } from "@/app/lib/schoolCatalogs";

// The registry is what turns a degree step in a generated pathway into a real
// link on the school's own site. A school listed as plannable but missing here
// renders pathways whose steps link nowhere.

describe("catalog registry", () => {
  it("has a catalog for every plannable school except MDC", () => {
    // MDC predates this registry and resolves URLs from mdc-programs.ts.
    const expected = SCHOOLS_WITH_CATALOG.filter((id) => id !== "mdc").sort();
    expect(scrapedCatalogIds()).toEqual([...expected]);
  });

  it("returns null for a school we hold no data for", () => {
    expect(catalogFor("cookman")).toBeNull();
    expect(catalogFor("")).toBeNull();
  });

  it("resolves every program in each catalog back to itself", () => {
    for (const id of scrapedCatalogIds()) {
      const catalog = catalogFor(id)!;
      // CFK is a genuinely tiny college (11 programs); the point of this
      // bound is "not an empty or truncated catalog", not a specific size.
      expect(catalog.programs.length, id).toBeGreaterThan(5);

      for (const program of catalog.programs) {
        const found = catalog.find(program.name, program.credential);
        expect(found, `${id}: ${program.name}`).toBeDefined();
        // Same name at two levels is common (an A.S. and a B.S. in Nursing);
        // the credential hint has to land on the right one.
        expect(found!.level, `${id}: ${program.name}`).toBe(program.level);
      }
    }
  });

  it("prefers the associate for an unqualified name at a state college", () => {
    // A state-college pathway starts at an associate, so a bare "Nursing" in a
    // generated step should link to the A.S., not the RN-to-BSN. Every scraped
    // catalog except the bachelor's-first universities (FIU, UCF, UF, FGCU,
    // UWF, NCF, UNF, FlPoly, USF, FAU, FAMU, FSU, UM, Stetson, ERAU, UT,
    // Barry, Lynn) is a state college, so
    // derive the list instead of hand-maintaining it — a new state college
    // wired up here is covered automatically.
    const UNIVERSITY_IDS = new Set(["fiu", "ucf", "uf", "fgcu", "uwf", "ncf", "unf", "flpoly", "usf", "fau", "famu", "fsu", "miami", "stetson", "erau", "tampa", "barry", "lynn"]);
    for (const id of scrapedCatalogIds().filter((sid) => !UNIVERSITY_IDS.has(sid))) {
      const catalog = catalogFor(id)!;
      const ambiguous = catalog.programs.filter(
        (p) =>
          p.level === "associate" &&
          catalog.programs.some(
            (q) => q.level === "bachelor" && q.name === p.name
          )
      );
      for (const program of ambiguous) {
        expect(catalog.find(program.name)!.level, `${id}: ${program.name}`).toBe(
          "associate"
        );
      }
    }
  });

  it("gives every program a usable link", () => {
    for (const id of scrapedCatalogIds()) {
      for (const program of catalogFor(id)!.programs) {
        expect(program.url, `${id}: ${program.name}`).toMatch(/^https?:\/\//);
      }
    }
  });
});
