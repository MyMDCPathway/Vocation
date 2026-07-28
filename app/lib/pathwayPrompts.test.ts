import { describe, it, expect } from "vitest";
import {
  buildPathwayRequest,
  hasCatalog,
  SCHOOLS_WITH_CATALOG,
} from "@/app/lib/pathwayPrompts";
import { FIU_PROGRAMS } from "@/app/lib/fiu-programs";
import { FLORIDA_SCHOOLS } from "@/app/lib/floridaSchools";
import { UCF_PROGRAMS } from "@/app/lib/programs/ucf";
import { UF_PROGRAMS } from "@/app/lib/programs/uf";
import { FGCU_PROGRAMS } from "@/app/lib/programs/fgcu";
import { UWF_PROGRAMS } from "@/app/lib/programs/uwf";
import { NCF_PROGRAMS } from "@/app/lib/programs/ncf";
import { UNF_PROGRAMS } from "@/app/lib/programs/unf";
import { FLPOLY_PROGRAMS } from "@/app/lib/programs/flpoly";
import { USF_PROGRAMS } from "@/app/lib/programs/usf";
import { FAU_PROGRAMS } from "@/app/lib/programs/fau";
import { FAMU_PROGRAMS } from "@/app/lib/programs/famu";
import { FSU_PROGRAMS } from "@/app/lib/programs/fsu";
import { UM_PROGRAMS } from "@/app/lib/programs/miami";
import { STETSON_PROGRAMS } from "@/app/lib/programs/stetson";
import { ERAU_PROGRAMS } from "@/app/lib/programs/erau";
import { TAMPA_PROGRAMS } from "@/app/lib/programs/tampa";
import { BARRY_PROGRAMS } from "@/app/lib/programs/barry";
import { LYNN_PROGRAMS } from "@/app/lib/programs/lynn";
import { ROLLINS_PROGRAMS } from "@/app/lib/programs/rollins";
import { FLAGLER_PROGRAMS } from "@/app/lib/programs/flagler";
import { PBA_PROGRAMS } from "@/app/lib/programs/pba";
import { FIT_PROGRAMS } from "@/app/lib/programs/fit";
import { SAINTLEO_PROGRAMS } from "@/app/lib/programs/saintleo";
import { STU_PROGRAMS } from "@/app/lib/programs/stu";
import { AVEMARIA_PROGRAMS } from "@/app/lib/programs/avemaria";
import { BROWARD_PROGRAMS } from "@/app/lib/programs/broward";
import { CF_PROGRAMS } from "@/app/lib/programs/cf";
import { CFK_PROGRAMS } from "@/app/lib/programs/cfk";
import { CHIPOLA_PROGRAMS } from "@/app/lib/programs/chipola";
import { DSC_PROGRAMS } from "@/app/lib/programs/dsc";
import { EFSC_PROGRAMS } from "@/app/lib/programs/efsc";
import { FGC_PROGRAMS } from "@/app/lib/programs/fgc";
import { FSCJ_PROGRAMS } from "@/app/lib/programs/fscj";
import { FSW_PROGRAMS } from "@/app/lib/programs/fsw";
import { GCSC_PROGRAMS } from "@/app/lib/programs/gcsc";
import { HCC_PROGRAMS } from "@/app/lib/programs/hcc";
import { IRSC_PROGRAMS } from "@/app/lib/programs/irsc";
import { LSSC_PROGRAMS } from "@/app/lib/programs/lssc";
import { NFC_PROGRAMS } from "@/app/lib/programs/nfc";
import { NWFSC_PROGRAMS } from "@/app/lib/programs/nwfsc";
import { PBSC_PROGRAMS } from "@/app/lib/programs/pbsc";
import { PHSC_PROGRAMS } from "@/app/lib/programs/phsc";
import { POLK_PROGRAMS } from "@/app/lib/programs/polk";
import { PSC_PROGRAMS } from "@/app/lib/programs/psc";
import { SCF_PROGRAMS } from "@/app/lib/programs/scf";
import { SF_PROGRAMS } from "@/app/lib/programs/sf";
import { SFSC_PROGRAMS } from "@/app/lib/programs/sfsc";
import { SJR_PROGRAMS } from "@/app/lib/programs/sjr";
import { SPC_PROGRAMS } from "@/app/lib/programs/spc";
import { SSC_PROGRAMS } from "@/app/lib/programs/ssc";
import { TSC_PROGRAMS } from "@/app/lib/programs/tsc";
import { VALENCIA_PROGRAMS } from "@/app/lib/programs/valencia";
import type { SchoolProgram } from "@/app/lib/programCatalog";
import { transferAgreementFor } from "@/app/lib/transferAgreements";

describe("catalog gating", () => {
  it("recognizes only the schools with real program data", () => {
    expect(hasCatalog("mdc")).toBe(true);
    expect(hasCatalog("fiu")).toBe(true);
    expect(hasCatalog("ucf")).toBe(true);
    expect(hasCatalog("uf")).toBe(true);
    expect(hasCatalog("fgcu")).toBe(true);
    expect(hasCatalog("uwf")).toBe(true);
    expect(hasCatalog("ncf")).toBe(true);
    expect(hasCatalog("unf")).toBe(true);
    expect(hasCatalog("flpoly")).toBe(true);
    expect(hasCatalog("usf")).toBe(true);
    expect(hasCatalog("fau")).toBe(true);
    expect(hasCatalog("famu")).toBe(true);
    expect(hasCatalog("fsu")).toBe(true);
    expect(hasCatalog("miami")).toBe(true);
    expect(hasCatalog("stetson")).toBe(true);
    expect(hasCatalog("erau")).toBe(true);
    expect(hasCatalog("tampa")).toBe(true);
    expect(hasCatalog("barry")).toBe(true);
    expect(hasCatalog("lynn")).toBe(true);
    expect(hasCatalog("rollins")).toBe(true);
    expect(hasCatalog("flagler")).toBe(true);
    expect(hasCatalog("pba")).toBe(true);
    expect(hasCatalog("fit")).toBe(true);
    expect(hasCatalog("saintleo")).toBe(true);
    expect(hasCatalog("stu")).toBe(true);
    expect(hasCatalog("avemaria")).toBe(true);
    expect(hasCatalog("")).toBe(false);
  });

  it("returns null rather than a pathway for a school with no catalog", () => {
    // Falling back to MDC here would show a student an MDC plan under another
    // school's name.
    const uncatalogued = FLORIDA_SCHOOLS.filter(
      (s) => !hasCatalog(s.id)
    );
    // Shrinks every batch as more private schools get wired up; the point is
    // "most private schools still have no catalog", not a specific count —
    // lower this threshold if a future batch legitimately closes the gap
    // further, rather than treating the drop as a regression.
    expect(uncatalogued.length).toBeGreaterThan(5);
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

    const undergrad = FIU_PROGRAMS.filter((p) => p.level === "bachelor");
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

describe("UCF prompt (generic university template)", () => {
  const built = buildPathwayRequest("ucf", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    // "a UCF" not "an UCF" — U is said "you", a consonant sound.
    expect(built.userQuery).toMatch(/FIRST step must be a UCF bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds UCF's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = UCF_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(100);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
  });

  it("has no transfer partner recorded, since UCF is a transfer destination", () => {
    // Universities are where state-college students transfer INTO — see §13
    // of HANDOFF.md. UCF is FGC/TSC/Valencia/etc.'s named partner elsewhere,
    // but it should never invent one of its own.
    expect(transferAgreementFor("ucf")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("UF prompt (generic university template)", () => {
  const built = buildPathwayRequest("uf", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a UF bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds UF's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = UF_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(100);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since UF is a transfer destination", () => {
    expect(transferAgreementFor("uf")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("FGCU prompt (generic university template)", () => {
  const built = buildPathwayRequest("fgcu", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an FGCU bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds FGCU's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FGCU_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(40);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's/UF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since FGCU is a transfer destination", () => {
    expect(transferAgreementFor("fgcu")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("UWF prompt (generic university template)", () => {
  const built = buildPathwayRequest("uwf", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a UWF bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds UWF's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = UWF_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(30);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since UWF is a transfer destination", () => {
    expect(transferAgreementFor("uwf")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("NCF prompt (generic university template)", () => {
  const built = buildPathwayRequest("ncf", "Data Scientist")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an NCF bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds NCF's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = NCF_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(40);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Data Scientist");
    expect(built.userQuery).toContain("Data Scientist");
  });

  it("has no transfer partner recorded, since NCF is a transfer destination", () => {
    expect(transferAgreementFor("ncf")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("UNF prompt (generic university template)", () => {
  const built = buildPathwayRequest("unf", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a UNF bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds UNF's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = UNF_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(100);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since UNF is a transfer destination", () => {
    expect(transferAgreementFor("unf")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("FlPoly prompt (generic university template)", () => {
  const built = buildPathwayRequest("flpoly", "Software Engineer")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a FlPoly bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds FlPoly's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FLPOLY_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(10);
    for (const program of undergrad) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Software Engineer");
    expect(built.userQuery).toContain("Software Engineer");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since FlPoly is a transfer destination", () => {
    expect(transferAgreementFor("flpoly")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("USF prompt (generic university template)", () => {
  const built = buildPathwayRequest("usf", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a USF bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds USF's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = USF_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(100);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since USF is a transfer destination", () => {
    expect(transferAgreementFor("usf")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("FAU prompt (generic university template)", () => {
  const built = buildPathwayRequest("fau", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an FAU bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds FAU's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FAU_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(50);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since FAU is a transfer destination", () => {
    expect(transferAgreementFor("fau")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("FAMU prompt (generic university template)", () => {
  const built = buildPathwayRequest("famu", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an FAMU bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds FAMU's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FAMU_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(30);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since FAMU is a transfer destination", () => {
    expect(transferAgreementFor("famu")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });
});

describe("FSU prompt (generic university template)", () => {
  const built = buildPathwayRequest("fsu", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an FSU bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds FSU's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FSU_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(100);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since FSU is a transfer destination", () => {
    expect(transferAgreementFor("fsu")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("points every program at the same shared majors page, not a fabricated per-program URL", () => {
    // FSU's real per-program links live in an unscrapable Power BI dashboard
    // (see HANDOFF.md §13) — every entry shares one real, verifiable link
    // instead of a guessed one.
    const urls = new Set(FSU_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBe(1);
    expect([...urls][0]).toBe("https://admissions.fsu.edu/majors");
  });
});

describe("UM prompt (generic university template)", () => {
  const built = buildPathwayRequest("miami", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a UM bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds UM's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = UM_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(100);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since UM is a transfer destination", () => {
    expect(transferAgreementFor("miami")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(UM_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(400);
    for (const p of UM_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/bulletin\.miami\.edu\//);
    }
  });
});

describe("Stetson prompt (generic university template)", () => {
  const built = buildPathwayRequest("stetson", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Stetson bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Stetson's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = STETSON_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(50);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Stetson is a transfer destination", () => {
    expect(transferAgreementFor("stetson")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(STETSON_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(50);
    for (const p of STETSON_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/catalog\.stetson\.edu\//);
    }
  });
});

describe("ERAU prompt (generic university template)", () => {
  const built = buildPathwayRequest("erau", "Aerospace Engineer")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an ERAU bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds ERAU's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = ERAU_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Aerospace Engineer");
    expect(built.userQuery).toContain("Aerospace Engineer");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since ERAU is a transfer destination", () => {
    expect(transferAgreementFor("erau")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(ERAU_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(100);
    for (const p of ERAU_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/catalog\.erau\.edu\//);
    }
  });
});

describe("UT prompt (generic university template)", () => {
  const built = buildPathwayRequest("tampa", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a UT bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds UT's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = TAMPA_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(50);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since UT is a transfer destination", () => {
    expect(transferAgreementFor("tampa")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(TAMPA_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(50);
    for (const p of TAMPA_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/ut\.smartcatalogiq\.com\//);
    }
  });
});

describe("Barry prompt (generic university template)", () => {
  const built = buildPathwayRequest("barry", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Barry bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Barry's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = BARRY_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Barry is a transfer destination", () => {
    expect(transferAgreementFor("barry")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(BARRY_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of BARRY_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/barry\.smartcatalogiq\.com\//);
    }
  });
});

describe("Lynn prompt (generic university template)", () => {
  const built = buildPathwayRequest("lynn", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Lynn bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Lynn's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = LYNN_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Lynn is a transfer destination", () => {
    expect(transferAgreementFor("lynn")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(LYNN_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of LYNN_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/www\.lynn\.edu\//);
    }
  });
});

describe("Rollins prompt (generic university template)", () => {
  const built = buildPathwayRequest("rollins", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Rollins bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Rollins' real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = ROLLINS_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Rollins is a transfer destination", () => {
    expect(transferAgreementFor("rollins")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(ROLLINS_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of ROLLINS_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/catalog\.rollins\.edu\//);
    }
  });
});

describe("Flagler prompt (generic university template)", () => {
  const built = buildPathwayRequest("flagler", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Flagler bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Flagler's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FLAGLER_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Flagler is a transfer destination", () => {
    expect(transferAgreementFor("flagler")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(FLAGLER_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of FLAGLER_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/catalog\.flagler\.edu\//);
    }
  });
});

describe("PBA prompt (generic university template)", () => {
  const built = buildPathwayRequest("pba", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a PBA bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds PBA's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = PBA_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since PBA is a transfer destination", () => {
    expect(transferAgreementFor("pba")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(PBA_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of PBA_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/catalog\.pba\.edu\//);
    }
  });
});

describe("Florida Tech prompt (generic university template)", () => {
  const built = buildPathwayRequest("fit", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Florida Tech bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Florida Tech's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = FIT_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Florida Tech is a transfer destination", () => {
    expect(transferAgreementFor("fit")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(FIT_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of FIT_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/catalog\.fit\.edu\//);
    }
  });
});

describe("Saint Leo prompt (generic university template)", () => {
  const built = buildPathwayRequest("saintleo", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Saint Leo bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Saint Leo's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = SAINTLEO_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Saint Leo is a transfer destination", () => {
    expect(transferAgreementFor("saintleo")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link, not a shared placeholder", () => {
    const urls = new Set(SAINTLEO_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of SAINTLEO_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/academiccatalog\.saintleo\.edu\//);
    }
  });
});

describe("St. Thomas University prompt (generic university template)", () => {
  const built = buildPathwayRequest("stu", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an STU bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds STU's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = STU_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since STU is a transfer destination", () => {
    expect(transferAgreementFor("stu")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("gives every program a real per-program link into the PDF catalog, not a shared placeholder", () => {
    const urls = new Set(STU_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBeGreaterThan(30);
    for (const p of STU_PROGRAMS.slice(0, 10)) {
      expect(p.url, p.name).toMatch(/^https:\/\/www\.stu\.edu\/wp-content\/uploads\/.*\.pdf#page=\d+$/);
    }
  });
});

describe("Ave Maria prompt (generic university template)", () => {
  const built = buildPathwayRequest("avemaria", "Accountant")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("instructs the pathway to start at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/STARTS with a bachelor/i);
    expect(built.userQuery).toMatch(/FIRST step must be an Ave Maria bachelor/i);
  });

  it("forbids associate and transfer steps", () => {
    expect(built.systemPrompt).toMatch(/NO associate degree step/i);
    expect(built.systemPrompt).toMatch(/never include a transfer step/i);
    expect(built.userQuery).toMatch(/do NOT include a transfer step/i);
  });

  it("embeds Ave Maria's real program catalog, not a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");

    const undergrad = AVEMARIA_PROGRAMS.filter((p) => p.level === "bachelor");
    expect(undergrad.length).toBeGreaterThan(20);
    for (const program of undergrad.slice(0, 20)) {
      expect(built.systemPrompt, program.name).toContain(program.name);
    }
  });

  it("interpolates the career into both prompts", () => {
    expect(built.systemPrompt).toContain("Accountant");
    expect(built.userQuery).toContain("Accountant");
  });

  it("does not mention Miami Dade College's catalog or FIU's/UCF's", () => {
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
    expect(built.systemPrompt).not.toContain("Florida International University");
    expect(built.systemPrompt).not.toContain("University of Central Florida");
  });

  it("has no transfer partner recorded, since Ave Maria is a transfer destination", () => {
    expect(transferAgreementFor("avemaria")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
  });

  it("points every program at the same shared catalog page, not a fabricated per-program URL", () => {
    // catalog.avemaria.edu/programs is a client-rendered SPA with no
    // per-program URLs at all (see avemaria.ts) — every entry shares one
    // real, verifiable link instead of a guessed one.
    const urls = new Set(AVEMARIA_PROGRAMS.map((p) => p.url));
    expect(urls.size).toBe(1);
    expect([...urls][0]).toBe("https://catalog.avemaria.edu/programs");
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

describe("Broward prompt (generic state-college template)", () => {
  const built = buildPathwayRequest("broward", "Registered Nurse")!;

  it("builds a request", () => {
    expect(built).not.toBeNull();
  });

  it("starts at Broward, not at a bachelor's", () => {
    expect(built.systemPrompt).toMatch(/Broward College/);
    expect(built.systemPrompt).toMatch(/START with the Broward program/i);
    expect(built.userQuery).toMatch(/FIRST step must be a Broward program/i);
  });

  it("keeps the transfer step, since college students transfer out", () => {
    expect(built.systemPrompt).toMatch(/TRANSFER step to a four-year university/i);
  });

  it("embeds Broward's real catalog rather than a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");
    const associates = BROWARD_PROGRAMS.filter((p) => p.level === "associate");
    expect(associates.length).toBeGreaterThan(50);
    for (const p of associates.slice(0, 15)) {
      expect(built.systemPrompt, p.name).toContain(p.name);
    }
  });

  it("does not leak MDC's catalog into Broward's prompt", () => {
    expect(built.systemPrompt).not.toContain("Miami Dade College");
    expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
  });

  it("interpolates the career", () => {
    expect(built.systemPrompt).toContain("Registered Nurse");
    expect(built.userQuery).toContain("Registered Nurse");
  });

  it("has no transfer partner recorded yet, and says nothing rather than guessing", () => {
    expect(transferAgreementFor("broward")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
    // The generic instruction must survive so the step is still produced.
    expect(built.systemPrompt).toMatch(/TRANSFER step to a four-year university/i);
  });
});

// --- The 25 state colleges wired up from the scraped catalogs --------------
//
// Chipola is deliberately absent from this list. It's wired up like the
// others (see below), but has no recorded transfer agreement — it holds
// parallel AA pathway sheets to five universities with no single branded
// guaranteed-admission partner — so the shared "names its real transfer
// partner" test in this block would fail on a null agreement. It gets its
// own describe block further down, mirroring Broward's no-agreement case.

const STATE_COLLEGES: {
  id: string;
  shortName: string;
  schoolName: string;
  programs: SchoolProgram[];
}[] = [
  { id: "cf", shortName: "CF", schoolName: "College of Central Florida", programs: CF_PROGRAMS },
  { id: "efsc", shortName: "EFSC", schoolName: "Eastern Florida State College", programs: EFSC_PROGRAMS },
  { id: "fgc", shortName: "FGC", schoolName: "Florida Gateway College", programs: FGC_PROGRAMS },
  { id: "fscj", shortName: "FSCJ", schoolName: "Florida State College at Jacksonville", programs: FSCJ_PROGRAMS },
  { id: "fsw", shortName: "FSW", schoolName: "Florida SouthWestern State College", programs: FSW_PROGRAMS },
  { id: "nwfsc", shortName: "NWFSC", schoolName: "Northwest Florida State College", programs: NWFSC_PROGRAMS },
  { id: "polk", shortName: "Polk State", schoolName: "Polk State College", programs: POLK_PROGRAMS },
  { id: "psc", shortName: "PSC", schoolName: "Pensacola State College", programs: PSC_PROGRAMS },
  { id: "scf", shortName: "SCF", schoolName: "State College of Florida, Manatee-Sarasota", programs: SCF_PROGRAMS },
  { id: "sf", shortName: "SF", schoolName: "Santa Fe College", programs: SF_PROGRAMS },
  { id: "sfsc", shortName: "SFSC", schoolName: "South Florida State College", programs: SFSC_PROGRAMS },
  { id: "sjr", shortName: "SJR", schoolName: "St. Johns River State College", programs: SJR_PROGRAMS },
  { id: "cfk", shortName: "CFK", schoolName: "College of the Florida Keys", programs: CFK_PROGRAMS },
  { id: "gcsc", shortName: "GCSC", schoolName: "Gulf Coast State College", programs: GCSC_PROGRAMS },
  { id: "irsc", shortName: "IRSC", schoolName: "Indian River State College", programs: IRSC_PROGRAMS },
  { id: "tsc", shortName: "TSC", schoolName: "Tallahassee State College", programs: TSC_PROGRAMS },
  { id: "valencia", shortName: "Valencia", schoolName: "Valencia College", programs: VALENCIA_PROGRAMS },
  // id is "daytona" / "seminole" (the floridaSchools.ts id), not "dsc" / "ssc"
  // (the catalog file's own short name) — see the note in programCatalogs.ts.
  { id: "daytona", shortName: "Daytona State", schoolName: "Daytona State College", programs: DSC_PROGRAMS },
  { id: "hcc", shortName: "HCC", schoolName: "Hillsborough Community College", programs: HCC_PROGRAMS },
  { id: "lssc", shortName: "LSSC", schoolName: "Lake-Sumter State College", programs: LSSC_PROGRAMS },
  { id: "nfc", shortName: "NFC", schoolName: "North Florida College", programs: NFC_PROGRAMS },
  { id: "pbsc", shortName: "PBSC", schoolName: "Palm Beach State College", programs: PBSC_PROGRAMS },
  { id: "phsc", shortName: "PHSC", schoolName: "Pasco-Hernando State College", programs: PHSC_PROGRAMS },
  { id: "spc", shortName: "SPC", schoolName: "St. Petersburg College", programs: SPC_PROGRAMS },
  { id: "seminole", shortName: "Seminole State", schoolName: "Seminole State College of Florida", programs: SSC_PROGRAMS },
];

describe.each(STATE_COLLEGES)(
  "$shortName prompt",
  ({ id, shortName, schoolName, programs }) => {
    const built = buildPathwayRequest(id, "Registered Nurse")!;

    it("builds a request", () => {
      expect(built).not.toBeNull();
      expect(built.systemPrompt).not.toContain("${");
      expect(built.userQuery).not.toContain("${");
    });

    it("names the school the student actually selected", () => {
      expect(built.systemPrompt).toContain(schoolName);
      expect(built.userQuery).toContain(schoolName);
      expect(built.systemPrompt).toMatch(
        new RegExp(`START with the ${shortName} program`, "i")
      );
    });

    it("embeds its own catalog rather than a placeholder", () => {
      const associates = programs.filter((p) => p.level === "associate");
      expect(associates.length).toBeGreaterThan(5);
      for (const p of associates.slice(0, 15)) {
        expect(built.systemPrompt, p.name).toContain(p.name);
      }
    });

    it("names its real transfer partner in both prompts", () => {
      const agreement = transferAgreementFor(id)!;
      expect(agreement, id).not.toBeNull();
      expect(built.systemPrompt).toContain("TRANSFER PARTNER");
      expect(built.systemPrompt).toContain(agreement.university);
      expect(built.systemPrompt).toContain(agreement.programName);
      expect(built.systemPrompt).toContain(agreement.summary);
      expect(built.userQuery).toContain(agreement.universityShortName);
      expect(built.userQuery).toContain(agreement.programName);
    });

    it("presents the partner as a default, not the only option", () => {
      // Florida's 2+2 guarantees admission *somewhere* in the SUS. Telling a
      // student their one named partner is the only route would be false.
      expect(built.systemPrompt).toMatch(/statewide 2\+2/i);
      expect(built.systemPrompt).toMatch(/never imply .* is the only option/i);
    });

    it("does not leak another school's catalog", () => {
      expect(built.systemPrompt).not.toContain("Miami Dade College");
      expect(built.systemPrompt).not.toContain("Associate in Arts in Engineering");
      expect(built.systemPrompt).not.toContain("Broward College");
    });
  }
);

describe("state-college prompts are distinct per school", () => {
  it("gives each school a different system prompt", () => {
    const prompts = STATE_COLLEGES.map(
      (s) => buildPathwayRequest(s.id, "Accountant")!.systemPrompt
    );
    expect(new Set(prompts).size).toBe(STATE_COLLEGES.length);
  });

  it("reads grammatically for both initialisms and words", () => {
    // "an FSW program" / "a Broward program" — F is said "eff".
    expect(buildPathwayRequest("fsw", "Accountant")!.userQuery).toContain(
      "an FSW program"
    );
    expect(buildPathwayRequest("cf", "Accountant")!.userQuery).toContain(
      "a CF program"
    );
    expect(buildPathwayRequest("broward", "Accountant")!.userQuery).toContain(
      "a Broward program"
    );
    // I is a genuine vowel, not just vowel-sounding when spelled out.
    expect(buildPathwayRequest("irsc", "Accountant")!.userQuery).toContain(
      "an IRSC program"
    );
    // A real word, not an initialism — grammar follows how it's said, not
    // its letters, so this must NOT read "an Chipola program".
    expect(buildPathwayRequest("chipola", "Accountant")!.userQuery).toContain(
      "a Chipola program"
    );
  });
});

// --- Chipola: wired up like the others, but with no forced flagship --------

describe("Chipola prompt (no recorded transfer agreement)", () => {
  const built = buildPathwayRequest("chipola", "Registered Nurse")!;

  it("builds a request and starts at Chipola", () => {
    expect(built).not.toBeNull();
    expect(built.systemPrompt).toContain("Chipola College");
    expect(built.systemPrompt).toMatch(/START with the Chipola program/i);
  });

  it("embeds Chipola's real catalog rather than a placeholder", () => {
    expect(built.systemPrompt).not.toContain("${");
    const associates = CHIPOLA_PROGRAMS.filter((p) => p.level === "associate");
    expect(associates.length).toBeGreaterThan(3);
    for (const p of associates) {
      expect(built.systemPrompt, p.name).toContain(p.name);
    }
  });

  it("has no transfer partner recorded, and falls back to the generic instruction", () => {
    // Chipola genuinely has no single branded flagship — five parallel AA
    // pathway sheets to FSU, UF, FAMU, UWF, and UCF, none guaranteed over the
    // others. Naming one would be a fabrication the other five schools this
    // batch actually earned by having a real named program.
    expect(transferAgreementFor("chipola")).toBeNull();
    expect(built.systemPrompt).not.toContain("TRANSFER PARTNER");
    expect(built.systemPrompt).toMatch(/TRANSFER step to a four-year university/i);
  });

  it("does not leak another school's catalog", () => {
    expect(built.systemPrompt).not.toContain("Miami Dade College");
    expect(built.systemPrompt).not.toContain("Broward College");
  });
});
