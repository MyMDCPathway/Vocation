import { describe, it, expect, vi } from "vitest";
import {
  isPubliclyRoutable,
  looksLikeSoftNotFound,
  probeUrl,
  redirectedToRoot,
  urlVariants,
  verifyAll,
  verifyProgramLink,
} from "@/app/lib/urlVerify";

// These tests carry more weight than most in this repo.
//
// Planning against schools we hold no catalog for is only defensible because
// the model's program URLs get fetched and checked. If this module says
// "verified" for a page that doesn't exist, a student is shown an invented
// degree with a confident green badge on it — which is worse than the 1.0
// failure it replaced, not better.

const html = (body: string, title = "A Real Program") =>
  `<!doctype html><html><head><title>${title}</title></head><body>${body}</body></html>`;

const respond = (init: {
  status?: number;
  body?: string;
  url?: string;
}): Response =>
  ({
    ok: (init.status ?? 200) >= 200 && (init.status ?? 200) < 300,
    status: init.status ?? 200,
    url: init.url ?? "https://example.edu/programs/nursing",
    text: async () => init.body ?? html("<h1>BSc Nursing</h1>"),
  }) as unknown as Response;

describe("isPubliclyRoutable — the SSRF guard", () => {
  // These URLs come from an LLM whose input includes free text a student
  // typed, and we fetch them from our own server. That is an SSRF sink, and
  // "the model probably won't emit that" is not a control.

  it("allows an ordinary university URL", () => {
    expect(isPubliclyRoutable("https://www.harvard.edu/academics")).toBe(true);
    expect(isPubliclyRoutable("http://uni.ac.uk/courses")).toBe(true);
  });

  it("blocks loopback in every spelling", () => {
    expect(isPubliclyRoutable("http://localhost/admin")).toBe(false);
    expect(isPubliclyRoutable("http://127.0.0.1:3000/")).toBe(false);
    expect(isPubliclyRoutable("http://[::1]/")).toBe(false);
    expect(isPubliclyRoutable("http://0.0.0.0/")).toBe(false);
  });

  it("blocks cloud instance metadata", () => {
    // The single highest-value SSRF target: it hands out credentials to
    // anything that can reach it.
    expect(isPubliclyRoutable("http://169.254.169.254/latest/meta-data/")).toBe(false);
    expect(isPubliclyRoutable("http://metadata.google.internal/")).toBe(false);
  });

  it("blocks private network ranges", () => {
    expect(isPubliclyRoutable("http://10.0.0.5/")).toBe(false);
    expect(isPubliclyRoutable("http://192.168.1.1/")).toBe(false);
    expect(isPubliclyRoutable("http://172.16.0.1/")).toBe(false);
    expect(isPubliclyRoutable("http://172.31.255.255/")).toBe(false);
  });

  it("allows public addresses that merely look similar", () => {
    // 172.32 is outside the private block, and 11.x is not 10.x. Over-blocking
    // costs real links.
    expect(isPubliclyRoutable("http://172.32.0.1/")).toBe(true);
    expect(isPubliclyRoutable("http://11.0.0.1/")).toBe(true);
  });

  it("blocks internal-only hostnames", () => {
    expect(isPubliclyRoutable("http://printer.local/")).toBe(false);
    expect(isPubliclyRoutable("http://intranet/")).toBe(false);
    expect(isPubliclyRoutable("http://db.internal/")).toBe(false);
  });

  it("blocks non-http schemes", () => {
    expect(isPubliclyRoutable("file:///etc/passwd")).toBe(false);
    expect(isPubliclyRoutable("gopher://example.edu/")).toBe(false);
    expect(isPubliclyRoutable("javascript:alert(1)")).toBe(false);
  });

  it("blocks anything unparseable", () => {
    expect(isPubliclyRoutable("not a url")).toBe(false);
    expect(isPubliclyRoutable("")).toBe(false);
  });
});

describe("looksLikeSoftNotFound", () => {
  // Universities serve "page not found" with HTTP 200 constantly. Status alone
  // would mark most dead program links as verified.

  it("catches a 404 in the title", () => {
    expect(looksLikeSoftNotFound(html("<p>oops</p>", "404 Page Not Found"))).toBe(true);
    expect(looksLikeSoftNotFound(html("<p>oops</p>", "Error - University"))).toBe(true);
  });

  it("catches not-found phrasing in the body", () => {
    expect(
      looksLikeSoftNotFound(html("<p>The page you requested could not be found.</p>"))
    ).toBe(true);
    expect(looksLikeSoftNotFound(html("<p>We can't find that page.</p>"))).toBe(true);
    expect(looksLikeSoftNotFound(html("<p>This page no longer exists.</p>"))).toBe(true);
  });

  it("does not fire on a real page that happens to mention 404", () => {
    // A course page listing "Room 404" or "BIOL 404" is not an error page,
    // which is why the body patterns are phrases rather than a bare number.
    expect(
      looksLikeSoftNotFound(
        html("<p>Lectures are held in Room 404 of the Science Building.</p>", "BSc Biology")
      )
    ).toBe(false);
    expect(
      looksLikeSoftNotFound(html("<p>Prerequisite: NURS 404</p>", "Nursing BSN"))
    ).toBe(false);
  });

  it("passes an ordinary program page", () => {
    expect(looksLikeSoftNotFound(html("<h1>BSc Nursing</h1><p>Apply now.</p>"))).toBe(
      false
    );
  });
});

describe("redirectedToRoot", () => {
  it("catches a dead path bounced to the homepage", () => {
    expect(
      redirectedToRoot("https://uni.edu/programs/underwater-basket-weaving", "https://uni.edu/")
    ).toBe(true);
  });

  it("allows an ordinary redirect between real pages", () => {
    expect(
      redirectedToRoot("https://uni.edu/programs/nursing", "https://uni.edu/academics/nursing")
    ).toBe(false);
  });

  it("allows a request that was already for the homepage", () => {
    expect(redirectedToRoot("https://uni.edu/", "https://uni.edu/")).toBe(false);
  });
});

describe("probeUrl", () => {
  it("accepts a real page", async () => {
    const result = await probeUrl("https://example.edu/programs/nursing", async () =>
      respond({})
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a hard 404", async () => {
    const result = await probeUrl("https://example.edu/nope", async () =>
      respond({ status: 404 })
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("404");
  });

  it("rejects a soft 404 served as 200", async () => {
    const result = await probeUrl("https://example.edu/nope", async () =>
      respond({ body: html("<p>The page you requested could not be found.</p>", "404") })
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("error page");
  });

  it("rejects a redirect to the homepage", async () => {
    const result = await probeUrl("https://example.edu/programs/ghost", async () =>
      respond({ url: "https://example.edu/" })
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("homepage");
  });

  it("distinguishes being blocked from not existing", async () => {
    // Both are unverified, but they mean different things and the difference
    // belongs in the logs when link coverage looks wrong.
    const result = await probeUrl("https://example.edu/programs/x", async () =>
      respond({ status: 403 })
    );
    expect(result.ok).toBe(false);
    expect(result.reason).toContain("blocked");
  });

  it("refuses to fetch a blocked address at all", async () => {
    const fetchSpy = vi.fn();
    const result = await probeUrl("http://169.254.169.254/", fetchSpy as any);
    expect(result.ok).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("survives a network failure", async () => {
    const result = await probeUrl("https://example.edu/x", async () => {
      throw new Error("ECONNREFUSED");
    });
    expect(result.ok).toBe(false);
  });
});

describe("urlVariants", () => {
  // Motivated by a real miss: the model returned Heriot-Watt's marine biology
  // path with a trailing `.htm` that the school dropped years ago. The path
  // was otherwise exactly right, and every degree step on that plan lost its
  // link over four characters.

  it("strips a page extension the school no longer uses", () => {
    const variants = urlVariants("https://www.hw.ac.uk/study/undergraduate/marine-biology.htm");
    expect(variants).toContain("https://www.hw.ac.uk/study/undergraduate/marine-biology");
  });

  it("handles every common CMS extension", () => {
    for (const ext of ["html", "htm", "aspx", "php", "jsp"]) {
      const variants = urlVariants(`https://uni.edu/programs/nursing.${ext}`);
      expect(variants, ext).toContain("https://uni.edu/programs/nursing");
    }
  });

  it("toggles a trailing slash both ways", () => {
    expect(urlVariants("https://uni.edu/programs/nursing")).toContain(
      "https://uni.edu/programs/nursing/"
    );
    expect(urlVariants("https://uni.edu/programs/nursing/")).toContain(
      "https://uni.edu/programs/nursing"
    );
  });

  it("never proposes a path to a different program", () => {
    // The whole justification for trying variants is that they're rewrites of
    // the path the model already committed to. If a variant could reach some
    // other program, this would be URL guessing wearing a disguise.
    const original = "https://uni.edu/programs/marine-biology.htm";
    for (const variant of urlVariants(original)) {
      expect(new URL(variant).pathname.replace(/\/$/, "")).toBe(
        "/programs/marine-biology"
      );
    }
  });

  it("stays short — each variant is another request to someone's server", () => {
    expect(urlVariants("https://uni.edu/a/b.htm").length).toBeLessThanOrEqual(3);
  });

  it("never includes the original", () => {
    const url = "https://uni.edu/programs/nursing";
    expect(urlVariants(url)).not.toContain(url);
  });

  it("returns nothing for an unparseable URL", () => {
    expect(urlVariants("not a url")).toEqual([]);
  });
});

describe("verifyProgramLink — the three outcomes", () => {
  it("recovers a page whose only problem was a stale extension", async () => {
    // The Heriot-Watt case end to end: .htm 404s, the bare path is real, and
    // the student gets the actual program page rather than a program index.
    const link = await verifyProgramLink(
      "https://www.hw.ac.uk/study/undergraduate/marine-biology.htm",
      "https://www.hw.ac.uk/study/undergraduate",
      async (url) =>
        String(url).endsWith(".htm")
          ? respond({ status: 404 })
          : respond({ url: String(url) })
    );
    expect(link.status).toBe("verified");
    expect(link.url).toBe("https://www.hw.ac.uk/study/undergraduate/marine-biology");
  });

  it("still falls back when no variant resolves either", async () => {
    const link = await verifyProgramLink(
      "https://uni.edu/programs/invented.htm",
      "https://uni.edu/programs",
      async (url) =>
        String(url).includes("invented")
          ? respond({ status: 404 })
          : respond({ url: "https://uni.edu/programs" })
    );
    expect(link.status).toBe("fallback");
  });

  it("verifies the exact program page when it resolves", async () => {
    const link = await verifyProgramLink(
      "https://example.edu/programs/nursing",
      "https://example.edu/programs",
      async () => respond({})
    );
    expect(link.status).toBe("verified");
    expect(link.url).toContain("nursing");
  });

  it("falls back to the program index when the exact page 404s", async () => {
    const link = await verifyProgramLink(
      "https://example.edu/programs/invented",
      "https://example.edu/programs",
      async (url) =>
        String(url).includes("invented")
          ? respond({ status: 404 })
          : respond({ url: "https://example.edu/programs" })
    );
    expect(link.status).toBe("fallback");
    expect(link.url).toBe("https://example.edu/programs");
    expect(link.reason).toContain("couldn't confirm");
  });

  it("gives no link at all when nothing resolves", async () => {
    // Rule 7: prefer no link over a wrong link.
    const link = await verifyProgramLink(
      "https://example.edu/programs/invented",
      "https://example.edu/programs",
      async () => respond({ status: 404 })
    );
    expect(link.status).toBe("unverified");
    expect(link.url).toBeNull();
  });

  it("handles a step that proposed no URL at all", async () => {
    const link = await verifyProgramLink(undefined, undefined, async () => respond({}));
    expect(link.status).toBe("unverified");
    expect(link.url).toBeNull();
  });
});

describe("verifyAll", () => {
  it("returns results in the order it was given, not the order they finished", async () => {
    const urls = ["https://a.edu/1", "https://b.edu/2", "https://c.edu/3"];
    const links = await verifyAll(
      urls,
      (url) => ({ exactUrl: url }),
      2,
      async (url) => {
        // Make the first one slowest, so a naive implementation that pushes
        // results as they land would reorder them.
        const delay = String(url).includes("/1") ? 20 : 1;
        await new Promise((r) => setTimeout(r, delay));
        return respond({ url: String(url) });
      }
    );

    expect(links).toHaveLength(3);
    expect(links[0].url).toBe("https://a.edu/1");
    expect(links[2].url).toBe("https://c.edu/3");
  });

  it("never opens more than the concurrency limit at once", async () => {
    let live = 0;
    let peak = 0;

    await verifyAll(
      Array.from({ length: 12 }, (_, i) => `https://uni.edu/${i}`),
      (url) => ({ exactUrl: url }),
      3,
      async (url) => {
        live++;
        peak = Math.max(peak, live);
        await new Promise((r) => setTimeout(r, 2));
        live--;
        return respond({ url: String(url) });
      }
    );

    expect(peak).toBeLessThanOrEqual(3);
  });

  it("handles an empty list without hanging", async () => {
    expect(await verifyAll([], () => ({}), 4, async () => respond({}))).toEqual([]);
  });
});
