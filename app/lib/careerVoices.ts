// Where to go and read what people in the job actually say.
//
// THE HONEST VERSION OF "PULL FROM A REVIEW SITE". The obvious build here is to
// scrape Glassdoor or Indeed reviews and print them. We don't, for reasons that
// aren't going to change:
//
//   Indeed     retired its public jobs API; its terms prohibit scraping.
//   Glassdoor  API closed to new partners; reviews are licensed content.
//   LinkedIn   has litigated scraping repeatedly (hiQ v. LinkedIn).
//   Reddit     returns 403 to unauthenticated reads — verified, not assumed.
//
// Beyond the terms, republishing a stranger's review of their employer means
// republishing their defamation risk and their bad day, and three cherry-picked
// comments is not evidence about a profession either way.
//
// So the page does two things instead. It shows a SYNTHESIS — the themes that
// recur when people in this job talk about it — clearly labelled as a summary
// rather than as quotes. And it sends the student to the real venues to read
// first-hand, which is the part that actually helps them.
//
// These are search URLs, not deep links. A search endpoint resolves whether or
// not it has results, so none of them can rot into a 404 the way a guessed
// article URL would. They're also deliberately not fetched to be verified —
// all three sites block server-side requests, so a probe would fail for bot
// detection rather than for being dead, and we'd drop working links.

export interface DiscussionVenue {
  label: string;
  url: string;
  detail: string;
}

function slug(career: string): string {
  return career
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * The places worth reading before committing to a career, for this career.
 *
 * Reddit first on purpose: it's the one of the three where people talk about
 * the work rather than about their employer, and where someone will answer a
 * question from a student thinking about the field.
 */
export function discussionVenues(career: string): DiscussionVenue[] {
  const query = encodeURIComponent(career);

  return [
    {
      label: "Reddit",
      url: `https://www.reddit.com/search/?q=${query}&sort=relevance&t=year`,
      detail:
        "Where people in the job talk to each other rather than to an employer. Search for the daily-life threads.",
    },
    {
      label: "Glassdoor",
      url: `https://www.glassdoor.com/Search/results.htm?keyword=${query}`,
      detail:
        "Employer-by-employer reviews and reported salaries. Read the two-star ones — that's where the tradeoffs are.",
    },
    {
      label: "Indeed",
      url: `https://www.indeed.com/career/${slug(career)}`,
      detail:
        "Reported pay, common next steps, and reviews from people who list the role.",
    },
  ];
}
