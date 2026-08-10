import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchArticle, fetchCareerMedia, fetchPhotos } from "@/app/lib/careerPhotos";

// The failure modes here are quiet ones. A wrong program URL 404s and gets
// caught; a wrong IMAGE resolves fine and just shows the student a picture of
// something else. So these tests are mostly about what gets FILTERED OUT.

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

const json = (body: unknown, ok = true): Response =>
  ({ ok, status: ok ? 200 : 404, json: async () => body }) as unknown as Response;

/** Routes a fake fetch by which Wikimedia endpoint was asked for. */
function wikimedia(handlers: {
  summary?: unknown;
  mediaList?: unknown;
  imageInfo?: unknown;
  summaryOk?: boolean;
}) {
  return vi.fn(async (url: unknown) => {
    const href = String(url);
    if (href.includes("/page/summary/")) {
      return json(handlers.summary ?? {}, handlers.summaryOk ?? true);
    }
    if (href.includes("/page/media-list/")) return json(handlers.mediaList ?? { items: [] });
    if (href.includes("commons.wikimedia.org")) return json(handlers.imageInfo ?? {});
    return json({}, false);
  });
}

const imagePage = (title: string, over: Record<string, unknown> = {}) => ({
  title,
  imageinfo: [
    {
      thumburl: `https://upload.wikimedia.org/thumb/${title}`,
      url: `https://upload.wikimedia.org/${title}`,
      descriptionurl: `https://commons.wikimedia.org/wiki/${title}`,
      thumbwidth: 800,
      thumbheight: 600,
      extmetadata: {
        LicenseShortName: { value: "CC BY-SA 4.0" },
        Artist: { value: '<a href="/wiki/User:Someone">Someone</a>' },
      },
      ...over,
    },
  ],
});

describe("fetchArticle", () => {
  it("returns the extract and canonical URL", async () => {
    global.fetch = wikimedia({
      summary: {
        title: "Marine biology",
        extract: "Marine biology is the scientific study of marine life.",
        content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Marine_biology" } },
      },
    }) as any;

    const article = await fetchArticle("Marine biologist");
    expect(article?.title).toBe("Marine biology");
    expect(article?.url).toContain("Marine_biology");
  });

  it("rejects a disambiguation page", async () => {
    // Its extract is a list of unrelated meanings and its images are icons —
    // exactly the shape that would produce a confidently wrong profile.
    global.fetch = wikimedia({
      summary: { title: "Engineer", extract: "Engineer may refer to:", type: "disambiguation" },
    }) as any;

    expect(await fetchArticle("Engineer")).toBeNull();
  });

  it("returns null rather than throwing when Wikipedia is down", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("ECONNRESET");
    }) as any;

    expect(await fetchArticle("Anything")).toBeNull();
  });

  it("converts spaces to underscores in the request", async () => {
    const fetchSpy = wikimedia({
      summary: { title: "Marine biology", extract: "x", content_urls: { desktop: { page: "u" } } },
    });
    global.fetch = fetchSpy as any;

    await fetchArticle("Marine biology");
    expect(String(fetchSpy.mock.calls[0][0])).toContain("Marine_biology");
  });
});

describe("fetchPhotos — what gets filtered out", () => {
  const mediaList = (titles: string[]) => ({
    items: titles.map((title) => ({ title, type: "image" })),
  });

  it("drops logos, icons, flags, and maps", async () => {
    // Wikipedia articles carry these constantly and none of them show anyone
    // doing a job.
    global.fetch = wikimedia({
      mediaList: mediaList([
        "File:Commons-logo.png",
        "File:Nurse at work.jpg",
        "File:Flag of Florida.png",
        "File:World map.jpg",
        "File:Edit-icon.png",
      ]),
      imageInfo: { query: { pages: [imagePage("File:Nurse at work.jpg")] } },
    }) as any;

    const photos = await fetchPhotos("Registered nurse");
    expect(photos).toHaveLength(1);
    expect(photos[0].title).toBe("Nurse at work");
  });

  it("drops vector, audio, and document files", async () => {
    global.fetch = wikimedia({
      mediaList: mediaList([
        "File:Diagram.svg",
        "File:Pronunciation.ogg",
        "File:Paper.pdf",
        "File:Real photo.jpg",
      ]),
      imageInfo: { query: { pages: [imagePage("File:Real photo.jpg")] } },
    }) as any;

    const photos = await fetchPhotos("Welder");
    expect(photos.map((p) => p.title)).toEqual(["Real photo"]);
  });

  it("caps how many it returns", async () => {
    const many = Array.from({ length: 12 }, (_, i) => `File:Photo ${i}.jpg`);
    global.fetch = wikimedia({
      mediaList: mediaList(many),
      imageInfo: { query: { pages: many.map((t) => imagePage(t)) } },
    }) as any;

    expect((await fetchPhotos("Anything")).length).toBeLessThanOrEqual(3);
  });

  it("preserves the article's own ordering", async () => {
    // The lead image comes first in the article and is almost always the most
    // representative, but the Commons batch response comes back unordered.
    const titles = ["File:First.jpg", "File:Second.jpg", "File:Third.jpg"];
    global.fetch = wikimedia({
      mediaList: mediaList(titles),
      imageInfo: {
        query: {
          pages: [imagePage("File:Third.jpg"), imagePage("File:First.jpg"), imagePage("File:Second.jpg")],
        },
      },
    }) as any;

    expect((await fetchPhotos("X")).map((p) => p.title)).toEqual([
      "First",
      "Second",
      "Third",
    ]);
  });

  it("matches files across the two APIs' different title spellings", async () => {
    // Regression, and the reason every career rendered with no photos while
    // both requests returned 200: the REST media list spells a file
    // "File:A_nurse_at_work.jpg" and the Commons query spells the same file
    // "File:A nurse at work.jpg". A literal comparison never matches.
    global.fetch = wikimedia({
      mediaList: {
        items: [
          { title: "File:Florence_Nightingale_(H_Hering_NPG_x82368).jpg", type: "image" },
          { title: "File:Registered_nurse_philadelphia_1952.jpg", type: "image" },
        ],
      },
      imageInfo: {
        query: {
          pages: [
            imagePage("File:Florence Nightingale (H Hering NPG x82368).jpg"),
            imagePage("File:Registered nurse philadelphia 1952.jpg"),
          ],
        },
      },
    }) as any;

    const photos = await fetchPhotos("Registered nurse");
    expect(photos).toHaveLength(2);
    expect(photos[0].title).toBe("Florence Nightingale (H Hering NPG x82368)");
  });

  it("returns nothing rather than throwing when there are no images", async () => {
    global.fetch = wikimedia({ mediaList: { items: [] } }) as any;
    expect(await fetchPhotos("X")).toEqual([]);
  });

  it("skips a file Commons returned no imageinfo for", async () => {
    global.fetch = wikimedia({
      mediaList: mediaList(["File:Ghost.jpg"]),
      imageInfo: { query: { pages: [{ title: "File:Ghost.jpg", missing: true }] } },
    }) as any;
    expect(await fetchPhotos("X")).toEqual([]);
  });
});

describe("fetchPhotos — attribution", () => {
  // Most of these images are CC BY-SA, which legally requires crediting the
  // author and naming the licence. Getting this wrong is not a cosmetic bug.

  it("carries the licence and a plain-text author", async () => {
    global.fetch = wikimedia({
      mediaList: { items: [{ title: "File:A nurse.jpg", type: "image" }] },
      imageInfo: { query: { pages: [imagePage("File:A nurse.jpg")] } },
    }) as any;

    const [photo] = await fetchPhotos("X");
    expect(photo.license).toBe("CC BY-SA 4.0");
    // Commons stores Artist as HTML; it renders as text, so tags must be gone.
    expect(photo.artist).toBe("Someone");
    expect(photo.artist).not.toContain("<");
    expect(photo.descriptionUrl).toContain("commons.wikimedia.org");
  });

  it("decodes HTML entities in the author", async () => {
    global.fetch = wikimedia({
      mediaList: { items: [{ title: "File:X.jpg", type: "image" }] },
      imageInfo: {
        query: {
          pages: [
            imagePage("File:X.jpg", {
              extmetadata: {
                LicenseShortName: { value: "CC BY 2.0" },
                Artist: { value: "Smith &amp; Jones" },
              },
            }),
          ],
        },
      },
    }) as any;

    expect((await fetchPhotos("X"))[0].artist).toBe("Smith & Jones");
  });

  it("always has some licence string to show", async () => {
    global.fetch = wikimedia({
      mediaList: { items: [{ title: "File:X.jpg", type: "image" }] },
      imageInfo: {
        query: { pages: [imagePage("File:X.jpg", { extmetadata: {} })] },
      },
    }) as any;

    expect((await fetchPhotos("X"))[0].license.length).toBeGreaterThan(0);
  });

  it("prefers the scaled thumbnail over the original", async () => {
    // Commons originals routinely run to tens of megabytes.
    global.fetch = wikimedia({
      mediaList: { items: [{ title: "File:X.jpg", type: "image" }] },
      imageInfo: { query: { pages: [imagePage("File:X.jpg")] } },
    }) as any;

    expect((await fetchPhotos("X"))[0].src).toContain("/thumb/");
  });
});

describe("fetchCareerMedia", () => {
  it("falls through to the next candidate title", async () => {
    let call = 0;
    global.fetch = vi.fn(async (url: unknown) => {
      const href = String(url);
      if (href.includes("/page/summary/")) {
        call++;
        // First candidate is a disambiguation page, second is real.
        return call === 1
          ? json({ title: "Vet", extract: "Vet may refer to:", type: "disambiguation" })
          : json({
              title: "Veterinarian",
              extract: "A veterinarian treats animals.",
              content_urls: { desktop: { page: "https://en.wikipedia.org/wiki/Veterinarian" } },
            });
      }
      if (href.includes("/page/media-list/")) return json({ items: [] });
      return json({});
    }) as any;

    const media = await fetchCareerMedia(["Vet", "Veterinarian"]);
    expect(media.article?.title).toBe("Veterinarian");
  });

  it("looks up media under the RESOLVED title, not the candidate", async () => {
    // Wikipedia redirects "Marine biologist" to "Marine biology", and the
    // media list only exists under the real title.
    const calls: string[] = [];
    global.fetch = vi.fn(async (url: unknown) => {
      const href = String(url);
      calls.push(href);
      if (href.includes("/page/summary/")) {
        return json({
          title: "Marine biology",
          extract: "x",
          content_urls: { desktop: { page: "u" } },
        });
      }
      if (href.includes("/page/media-list/")) return json({ items: [] });
      return json({});
    }) as any;

    await fetchCareerMedia(["Marine biologist"]);
    const mediaCall = calls.find((c) => c.includes("/page/media-list/"))!;
    expect(mediaCall).toContain("Marine_biology");
    expect(mediaCall).not.toContain("Marine_biologist");
  });

  it("degrades to no media rather than failing the profile", async () => {
    global.fetch = vi.fn(async () => {
      throw new Error("network down");
    }) as any;

    expect(await fetchCareerMedia(["Anything"])).toEqual({ article: null, photos: [] });
  });

  it("handles being given no candidates at all", async () => {
    global.fetch = vi.fn() as any;
    expect(await fetchCareerMedia([])).toEqual({ article: null, photos: [] });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
