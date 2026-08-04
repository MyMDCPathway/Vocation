// Real photographs of a job, with the attribution their licences require.
//
// WHY NOT ASK THE MODEL FOR IMAGE URLS. Two reasons, either sufficient:
//
//   1. It's the hallucination problem in its worst form. A wrong program URL
//      is caught by fetching it (urlVerify.ts). A wrong IMAGE url either 404s
//      or — far worse — resolves to a real photo of something else entirely,
//      and nothing short of looking at it can tell the difference.
//   2. Licensing. Hotlinking whatever image a model names means publishing
//      someone's copyrighted photo on a page we ship to students.
//
// So the photos come from Wikipedia's own article media instead. That gives
// three things a search API wouldn't:
//
//   - Free licences (CC / public domain), with the metadata to attribute them.
//   - Editorial curation. Images in the "Marine biology" article were chosen
//      by editors to illustrate marine biology. Raw Commons image search for
//      an occupation returns whatever matched the words, which for a
//      student-facing product is a risk not worth taking.
//   - No API key, no dependency, no account. The project has three runtime
//      dependencies and this doesn't add a fourth.
//
// Everything degrades to "no photos". A profile page without pictures is fine;
// a profile page with a wrong or unattributed picture is not.

const REST_BASE = "https://en.wikipedia.org/api/rest_v1";
const COMMONS_API = "https://commons.wikimedia.org/w/api.php";

// Wikimedia asks for a descriptive User-Agent identifying the tool and a
// contact. Anonymous or browser-spoofed agents get throttled or blocked, and
// they're within their rights to do it.
const USER_AGENT =
  "Vocation/2.0 (career pathway planner; +https://github.com/vocation) fetch";

const TIMEOUT_MS = 5000;
const MAX_PHOTOS = 3;
const THUMB_WIDTH = 800;

export interface CareerPhoto {
  /** Scaled image, not the original — originals run to tens of megabytes. */
  src: string;
  width?: number;
  height?: number;
  /** The file's page on Commons. Attribution links here. */
  descriptionUrl: string;
  /** e.g. "CC BY-SA 4.0", "Public domain". */
  license: string;
  licenseUrl?: string;
  /** Plain-text author. Commons stores this as HTML; it's stripped here. */
  artist?: string;
  title: string;
}

export interface CareerArticle {
  title: string;
  extract: string;
  url: string;
}

async function getJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    // Wikimedia being slow or down must not fail a career profile. The page
    // renders without photos.
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Commons stores the author as an HTML fragment — often a link, sometimes a
 * whole nested markup blob. It gets rendered as text, so the tags come out.
 */
function stripHtml(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const text = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length ? text.slice(0, 120) : undefined;
}

// Files that illustrate the page furniture rather than the subject. Wikipedia
// articles carry these constantly and none of them show anyone doing a job.
const NON_PHOTO = /(logo|icon|symbol|seal|coat.of.arms|flag|map|chart|graph|diagram|banner|stub|ambox|commons|wiki|edit|arrow|button|placeholder)/i;

// Data graphics whose filenames name neither "map" nor "chart".
//
// The one that got through was "Top computer science colleges in North
// America" — a shaded map of the United States, sitting in the hero slot of a
// page about what a software engineer does all day. Nothing in its title says
// map. What it does say is that it RANKS something across a PLACE, and that
// is the shape of every infographic Wikipedia carries and of none of its
// photographs.
//
// A heuristic, and it will miss some. It fails the right way: a career page
// with one fewer picture is fine, a career page led by a statistics exhibit
// is not.
const NON_PHOTO_SUBJECT =
  /(colleges?|universit|ranking|top[ _]\d|largest|distribution|density|per[ _]capita|percentage|share[ _]of|statistics|timeline|screenshot|infographic|poster|table|schematic|drawing|painting|portrait|statue|monument|stamp|coin|census)/i;

// The other half: pictures of a CONCEPT rather than of the job.
//
// Second one through was "Evolutionary prototyping model" — a boxes-and-arrows
// flowchart, hero-sized, on a page whose job is to show a student what the
// work looks like. Occupational articles are full of these, because the
// article is about the discipline and the page is about the person.
const CONCEPT_GRAPHIC =
  /(model|lifecycle|life[ _]cycle|workflow|process|method|paradigm|framework|uml|flow[ _]?chart|pyramid|venn|hierarchy|taxonomy|structure of|overview of)/i;

// Vector and audio entries in a media list aren't photographs.
const NON_PHOTO_EXTENSION = /\.(svg|ogg|oga|ogv|wav|mid|webm|pdf|djvu)$/i;

/** Lower sorts first. See the sort in fetchPhotos for why the extension. */
function photoRank(fileTitle: string): number {
  if (/\.jpe?g$/i.test(fileTitle)) return 0;
  if (/\.tiff?$/i.test(fileTitle)) return 1;
  if (/\.webp$/i.test(fileTitle)) return 2;
  return 3; // png, and whatever else got this far
}

function looksLikeAPhoto(fileTitle: string): boolean {
  if (NON_PHOTO_EXTENSION.test(fileTitle)) return false;
  if (NON_PHOTO.test(fileTitle)) return false;
  if (NON_PHOTO_SUBJECT.test(fileTitle)) return false;
  if (CONCEPT_GRAPHIC.test(fileTitle)) return false;
  return /\.(jpe?g|png|webp|tiff?)$/i.test(fileTitle);
}

/** The article's summary text and canonical URL. */
export async function fetchArticle(title: string): Promise<CareerArticle | null> {
  const data = await getJson<any>(
    `${REST_BASE}/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`
  );

  // Disambiguation pages have no useful extract and their images are icons.
  if (!data?.extract || data.type === "disambiguation") return null;

  return {
    title: data.title ?? title,
    extract: String(data.extract),
    url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

/**
 * Up to three photographs from a Wikipedia article, with licence metadata.
 *
 * Two requests: the article's media list, then one batched Commons query for
 * the licence, author, and a scaled thumbnail of everything that survived
 * filtering.
 */
export async function fetchPhotos(title: string): Promise<CareerPhoto[]> {
  const list = await getJson<any>(
    `${REST_BASE}/page/media-list/${encodeURIComponent(title.replace(/ /g, "_"))}`
  );

  const fileTitles: string[] = (list?.items ?? [])
    .filter((item: any) => item?.type === "image" && typeof item.title === "string")
    .map((item: any) => item.title as string)
    .filter(looksLikeAPhoto)
    // Photographs first, and the file extension says which is which better
    // than any list of banned words does. Cameras write JPEG; the things that
    // kept reaching the hero slot — a shaded map, a flowchart, a spreadsheet
    // screenshot, an IDE window — are what screenshot tools and drawing
    // programs write, which is PNG. Two rounds of blacklisting title keywords
    // caught one graphic each and missed the next; this one rule sorts the
    // whole class. It ORDERS rather than excludes, so an article whose only
    // picture is a PNG still gets it.
    .sort((a: string, b: string) => photoRank(a) - photoRank(b))
    .slice(0, MAX_PHOTOS);

  if (!fileTitles.length) return [];

  // One query for all of them. Commons accepts pipe-separated titles, so this
  // is a single round trip regardless of how many files survived.
  const params = new URLSearchParams({
    action: "query",
    titles: fileTitles.join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(THUMB_WIDTH),
    format: "json",
    formatversion: "2",
    origin: "*",
  });

  const info = await getJson<any>(`${COMMONS_API}?${params}`);
  const pages: any[] = info?.query?.pages ?? [];

  const photos: CareerPhoto[] = [];

  // The two APIs spell the same file differently: the REST media list returns
  // "File:Florence_Nightingale_(H_Hering).jpg" and the Commons query returns
  // "File:Florence Nightingale (H Hering).jpg". Matching them literally never
  // succeeds, which silently produced zero photos for every career while both
  // requests looked perfectly healthy.
  const normalizeTitle = (value: string) => value.replace(/_/g, " ").trim();
  const byTitle = new Map<string, any>(
    pages.filter((p) => p?.title).map((p) => [normalizeTitle(p.title), p])
  );

  // Preserve the article's own ordering — the lead image comes first there,
  // and it's almost always the most representative one.
  for (const fileTitle of fileTitles) {
    const page = byTitle.get(normalizeTitle(fileTitle));
    const image = page?.imageinfo?.[0];
    if (!image) continue;

    const src = image.thumburl || image.url;
    if (!src) continue;

    const meta = image.extmetadata ?? {};
    const license =
      stripHtml(meta.LicenseShortName?.value) ??
      stripHtml(meta.UsageTerms?.value) ??
      "See file page";

    photos.push({
      src,
      width: image.thumbwidth,
      height: image.thumbheight,
      descriptionUrl: image.descriptionurl ?? `https://commons.wikimedia.org/wiki/${encodeURIComponent(fileTitle)}`,
      license,
      licenseUrl: meta.LicenseUrl?.value,
      artist: stripHtml(meta.Artist?.value),
      title: fileTitle.replace(/^File:/, "").replace(/\.[^.]+$/, "").replace(/_/g, " "),
    });
  }

  return photos;
}

/**
 * Article text and photos for a career.
 *
 * Candidates come from the model, which is good at "what is the Wikipedia
 * article for this job" and bad at "what is the URL of a photo of this job".
 * Playing to that split is the whole design.
 *
 * THE TEXT AND THE PICTURES CAN COME FROM DIFFERENT ARTICLES, and they have to
 * be allowed to. "Software engineering" is the right article to describe the
 * work and carries exactly two images: an icon and a map of American colleges.
 * Stopping at the first article that resolved left that page with no
 * photograph at all, while "Programmer" — the model's second candidate — has
 * pictures of people doing the job. So the first article that resolves wins
 * the description, and the search for photographs carries on without it.
 */
export async function fetchCareerMedia(candidateTitles: string[]): Promise<{
  article: CareerArticle | null;
  photos: CareerPhoto[];
}> {
  let article: CareerArticle | null = null;
  let photos: CareerPhoto[] = [];

  for (const title of candidateTitles.filter(Boolean).slice(0, 3)) {
    const resolved = await fetchArticle(title);
    if (!resolved) continue;
    if (!article) article = resolved;

    // Use the resolved title, not the candidate — Wikipedia redirects
    // "Marine biologist" to "Marine biology", and the media list is only
    // available under the real title.
    photos = await fetchPhotos(resolved.title);
    if (photos.length) break;
  }

  // Attribution follows the pictures, not the prose: PhotoCredit renders each
  // photo's own Commons page and licence, so a photo borrowed from the second
  // article is still credited to its own source.
  return { article, photos };
}
