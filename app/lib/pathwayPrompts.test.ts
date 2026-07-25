import { describe, it, expect } from "vitest";
import {
  buildPathwayRequest,
  hasCatalog,
  SCHOOLS_WITH_CATALOG,
} from "@/app/lib/pathwayPrompts";
import { FIU_PROGRAMS } from "@/app/lib/fiu-programs";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";

describe("catalog gating", () => {
  it("recognizes only the schools with real program data", () => {
    expect(hasCatalog("mdc")).toBe(true);
    expect(hasCatalog("fiu")).toBe(true);
    expect(hasCatalog("ucf")).toBe(false);
    expect(hasCatalog("")).toBe(false);
  });

  it("returns null rather than a pathway for a school with no catalog", () => {
    // Falling back to MDC here would show a student an MDC plan under another
    // school's name.
    const uncatalogued = FLORIDA_SCHOOLS.filter(
      (s) => !hasCatalog(s.id)
    );
    expect(uncatalogued.length).toBeGreaterThan(50);
    for (const school of uncatalogued.slice(0, 5)) {
      expect(buildPathwayRequest(school.id, "Accountant"), school.id).toBeNull();
    }
  });

  it("every catalogued school is a real school in the selector", () => {
    for (const id of SCHOOLS_WITH_CATALOG) {
      expect(FLORIDA_SCHOOLS.some((s) => s.id === id), id).toBe(true);
    }
  });
});

describe("MDC prompt", () => {
  const built = buildPathwayRequest("mdc", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
    expect(built.systemPrompt.length).toBeGreaterThan(5000);
  });

  it("still grounds the model in MDC's real program lists", () => {
    expect(built.systemPrompt).toContain("Miami Dade College");
    expect(built.systemPrompt).toContain("Associate in Science");
    expect(built.systemPrompt).toContain("Nursing");
  });

  it("interpolates the career rather than leaking the placeholder", () => {
    expect(built.userQuery).toContain("Accountant");
    expect(built.userQuery).not.toContain("${");
    expect(built.systemPrompt).not.toContain("${");
  });

  it("keeps the transfer step, since MDC students transfer out", () => {
    expect(built.systemPrompt).toMatch(/transfer/i);
  });
});

describe("FIU prompt", () => {
  const built = buildPathwayRequest("fiu", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an FIU bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds FIU's real program catalog, not a placeholder", () => {
    // The whole point is constraining the model to programs that exist.
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FIU_PROGRAMS.filter((p) => p.level === "undergraduate");
    expect(undergrad.length).toBeGreaterThan(100);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
  });
});

describe("response schema", () => {
  it("is shared by both schools and names the career", () => {
    for (const id of SCHOOLS_WITH_CATALOG) {
      const schema = buildPathwayRequest(id, "Architect")!.responseSchema as any;
      expect(schema.type, id).toBe("OBJECT");
      expect(schema.required, id).toContain("pathways");
      expect(JSON.stringify(schema), id).toContain("Architect");
    }
  });
});
