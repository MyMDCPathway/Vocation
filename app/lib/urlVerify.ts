// Does the page the model just cited actually exist?
//
// This module is the reason open-world planning is defensible at all.
//
// HANDOFF §2 records why every school got scraped: asked for pathways
// unconstrained, Gemini confidently returned MDC degrees that do not exist,
// and instructing it to be careful did not help. Planning against schools we
// have no catalog for reintroduces exactly that failure — unless the claim is
// checked. A program page that 404s is a program that probably isn't real, and
// that is a signal we can get without scraping anything.
//
// So: the model proposes a program URL, and this fetches it. Three outcomes,
// mirroring the project's rule 7 (prefer no link over a wrong link):
//
//   verified    the exact program page resolved — link it, say it was checked
//   fallback    it didn't, but the school's general programs page did — link
//               that instead and say the specific page couldn't be confirmed
//   unverified  neither resolved — no link at all
//
// SECURITY: these URLs are produced by an LLM whose input includes free text a
// student typed. That makes this a server-side fetch of a semi-attacker-
// influenced URL, i.e. a textbook SSRF sink. `isPubliclyRoutable` is not
// decoration — without it, "http://169.254.169.254/latest/meta-data/" is a
// perfectly ordinary-looking string for a model to emit.

export type VerificationStatus = "verified" | "fallback" | "unverified";

export interface VerifiedLink {
  /** The URL to actually link, or null when nothing resolved. */
  url: string | null;
  status: VerificationStatus;
  /** Human-readable explanation, shown in a tooltip. */
  reason: string;
}

// Long enough for a slow university CMS, short enough that a pathway with a
// dozen steps doesn't stall the request behind them.
const TIMEOUT_MS = 6000;

// Universities block obvious bots. A plain fetch with no UA gets a 403 from a
// meaningful share of .edu hosts, which would read as "page doesn't exist".
const USER_AGENT =
  "Mozilla/5.0 (compatible; VocationBot/1.0; +https://vocation.app/about-our-crawler)";

// How much of the body to read. Soft-404 markers live in the <title> and the
// first screenful; pulling a whole 2 MB page to find them is waste.
const MAX_BODY_BYTES = 24_000;

// --- SSRF guard -------------------------------------------------------------

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
  // Cloud instance metadata. Reachable from inside most hosting environments
  // and hands out credentials to anything that asks.
  "169.254.169.254",
  "metadata.google.internal",
]);

const PRIVATE_IPV4 =
  /^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|0\.)/;

/**
 * Whether a URL is safe to fetch from our own server.
 *
 * Deliberately strict: anything not clearly a public http(s) host is rejected.
 * A false negative costs one unverified link; a false positive lets a model-
 * authored string reach the internal network.
 */
export function isPubliclyRoutable(raw: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;

  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (PRIVATE_IPV4.test(host)) return false;

  // Bare IPv6 literals and internal-only TLDs. There is no legitimate reason
  // for a university program page to live at either.
  if (host.startsWith("[") || host.includes(":")) return false;
  if (/\.(local|internal|localdomain|home|lan)$/.test(host)) return false;

  // A hostname with no dot is a single-label internal name ("intranet").
  if (!host.includes(".")) return false;

  return true;
}

// --- Soft-404 detection -----------------------------------------------------

// Universities serve "page not found" with HTTP 200 constantly — CMS error
// pages, catalog placeholders, SPA shells. Trusting the status code alone
// would mark most dead program links as verified.
const NOT_FOUND_TITLE =
  /\b(404|page not found|not found|error|no longer available|page unavailable)\b/i;

const NOT_FOUND_BODY = [
  /page (you (are looking for|requested)|cannot be found|not found)/i,
  /\bthe requested (page|url|resource) (was )?(could not be|cannot be|not) found\b/i,
  /\bwe can'?t find (that|the) page\b/i,
  /\bthis page (no longer exists|has been (removed|retired))\b/i,
  /\bsorry,? (that|this) page\b/i,
  /\berror 404\b/i,
];

function extractTitle(html: string): string {
  return html.match(/<title[^>]*>([\s\S]{0,300}?)<\/title>/i)?.[1]?.trim() ?? "";
}

/**
 * Whether a 200 response is actually an error page.
 *
 * Title first, because it's the highest-signal place and least likely to
 * contain the words incidentally. Body patterns are phrases, not bare "404" —
 * a real course page can mention room 404 or a 404-level class.
 */
export function looksLikeSoftNotFound(html: string): boolean {
  const title = extractTitle(html);
  if (title && NOT_FOUND_TITLE.test(title)) return true;
  return NOT_FOUND_BODY.some((pattern) => pattern.test(html));
}

/**
 * Whether a redirect landed somewhere that means "we didn't have that".
 *
 * The other common soft-404: request a dead program path and get bounced to
 * the site root or a generic search page. Landing on the homepage is not
 * evidence the program exists.
 */
export function redirectedToRoot(requested: string, final: string): boolean {
  try {
    const from = new URL(requested);
    const to = new URL(final);
    if (from.href === to.href) return false;

    const meaningfulPath = from.pathname.replace(/\/+$/, "").length > 1;
    const landedAtRoot = to.pathname.replace(/\/+$/, "").length <= 1;
    return meaningfulPath && landedAtRoot;
  } catch {
    return false;
  }
}

// --- Fetching ---------------------------------------------------------------

export interface ProbeResult {
  ok: boolean;
  /** Why it failed, for logging and for the tooltip. */
  reason: string;
  finalUrl?: string;
}

/**
 * Fetch a URL and decide whether it's a real page.
 *
 * A 403 or a network error is reported as `ok: false` but with a reason that
 * distinguishes "blocked us" from "doesn't exist" — the caller treats both as
 * unverified, but they mean different things and the difference belongs in the
 * logs when link coverage looks wrong.
 */
export async function probeUrl(
  url: string,
  fetchImpl: typeof fetch = fetch
): Promise<ProbeResult> {
  if (!isPubliclyRoutable(url)) {
    return { ok: false, reason: "blocked: not a public http(s) address" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // GET rather than HEAD: HEAD is unreliable on university CMSes (405s, or
    // 200 for everything), and the body is needed for soft-404 detection
    // anyway.
    const response = await fetchImpl(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
    });

    const finalUrl = response.url || url;

    if (response.status === 404 || response.status === 410) {
      return { ok: false, reason: `page returns ${response.status}`, finalUrl };
    }
    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: "site blocked our request", finalUrl };
    }
    if (!response.ok) {
      return { ok: false, reason: `page returns ${response.status}`, finalUrl };
    }

    if (redirectedToRoot(url, finalUrl)) {
      return { ok: false, reason: "redirected to the site homepage", finalUrl };
    }

    const html = (await response.text()).slice(0, MAX_BODY_BYTES);
    if (looksLikeSoftNotFound(html)) {
      return { ok: false, reason: "page exists but is an error page", finalUrl };
    }

    return { ok: true, reason: "page loaded", finalUrl };
  } catch (error: any) {
    const aborted = error?.name === "AbortError";
    return {
      ok: false,
      reason: aborted ? "page timed out" : "page could not be reached",
    };
  } finally {
    clearTimeout(timer);
  }
}

// Extensions a CMS bolts onto a path that is otherwise correct.
const PAGE_EXTENSION = /\.(html?|aspx|php|jsp)$/i;

/**
 * Mechanical rewrites of the SAME path, to try when the exact URL fails.
 *
 * This is not URL guessing and the distinction matters. Every variant is the
 * path the model already gave, with a suffix or a trailing slash normalized —
 * so it cannot reach a program the model didn't name, and every candidate is
 * still fetched and checked before it's linked.
 *
 * It exists because of a real miss: asked for Heriot-Watt's marine biology
 * degree, the model returned
 *   https://www.hw.ac.uk/study/undergraduate/marine-biology.htm
 * and the real page is that exact path without the `.htm`. The school moved
 * off extension-suffixed URLs at some point and the model learned the old
 * shape. Every degree step on that plan fell back to the program index over a
 * four-character difference.
 *
 * Ordered cheapest-signal-first and deliberately short: each entry is another
 * request to someone else's server.
 */
export function urlVariants(url: string): string[] {
  const variants: string[] = [];
  const add = (candidate: string) => {
    if (candidate !== url && !variants.includes(candidate)) variants.push(candidate);
  };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return variants;
  }

  const path = parsed.pathname;

  if (PAGE_EXTENSION.test(path)) {
    parsed.pathname = path.replace(PAGE_EXTENSION, "");
    add(parsed.toString());
    parsed.pathname = path.replace(PAGE_EXTENSION, "") + "/";
    add(parsed.toString());
  } else if (path.endsWith("/")) {
    parsed.pathname = path.replace(/\/+$/, "");
    add(parsed.toString());
  } else {
    parsed.pathname = `${path}/`;
    add(parsed.toString());
  }

  return variants;
}

/**
 * Try the exact program page, then trivial rewrites of it, then fall back to
 * the school's general programs page.
 *
 * This is the behavior the redesign asked for, made real: if the specific major
 * page doesn't resolve, link the majors index instead — but say so, because a
 * student following a link to a program list has not been shown the program.
 */
export async function verifyProgramLink(
  exactUrl: string | undefined,
  programsUrl: string | undefined,
  fetchImpl: typeof fetch = fetch
): Promise<VerifiedLink> {
  if (exactUrl) {
    for (const candidate of [exactUrl, ...urlVariants(exactUrl)]) {
      const probe = await probeUrl(candidate, fetchImpl);
      if (probe.ok) {
        return {
          url: probe.finalUrl ?? candidate,
          status: "verified",
          reason: "We loaded this program page to confirm it exists.",
        };
      }
    }
  }

  if (programsUrl) {
    const probe = await probeUrl(programsUrl, fetchImpl);
    if (probe.ok) {
      return {
        url: probe.finalUrl ?? programsUrl,
        status: "fallback",
        reason:
          "We couldn't confirm a page for this specific program, so this links to the school's full program list. Check the program is offered before relying on it.",
      };
    }
  }

  return {
    url: null,
    status: "unverified",
    reason:
      "We couldn't reach a page for this program or for the school's program list, so there's no link to give you.",
  };
}

/**
 * Verify many links at once without opening a socket per step.
 *
 * A pathway can carry eight or more degree steps. Firing them all at once is
 * rude to the school and gets us rate-limited; doing them serially puts the
 * student behind eight sequential six-second timeouts in the worst case.
 */
export async function verifyAll<T>(
  items: T[],
  toUrls: (item: T) => { exactUrl?: string; programsUrl?: string },
  concurrency = 4,
  fetchImpl: typeof fetch = fetch
): Promise<VerifiedLink[]> {
  const results: VerifiedLink[] = new Array(items.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const { exactUrl, programsUrl } = toUrls(items[index]);
      results[index] = await verifyProgramLink(exactUrl, programsUrl, fetchImpl);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker)
  );

  return results;
}
