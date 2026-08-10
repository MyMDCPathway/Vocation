// What we refuse to plan a route to, and how much text we'll accept while
// deciding.
//
// resolveCareer() takes whatever a student types and hands it to Gemini, which
// meant the app would cheerfully produce a step-by-step education plan for
// "hitman". This module is the single place that says no, and it runs before
// anything is spent — before the rate limiter, before the model call — so a
// refused search costs nothing and doesn't eat the visitor's allowance.
//
// TWO DECISIONS DO ALL THE WORK HERE, and both are easy to undo by accident:
//
// 1. THE ALLOWLIST RUNS FIRST, unconditionally, before any block check. A
//    filter that checks blocks first and allowances second is not a filter with
//    an escape hatch, it is a filter with a bug: the block wins the instant the
//    two overlap. That overlap is not hypothetical. "Anti money laundering
//    analyst" contains "money laundering" and "human trafficking investigator"
//    contains "human trafficking" — both are real jobs, and both are exactly
//    the sort of work a student who searched those words might be after.
//
// 2. PHRASES MATCH AS RUNS OF WHOLE WORDS, NEVER AS BARE SUBSTRINGS. A
//    substring rule for "harm" blocks pharmacist; "gun" blocks gunsmith; "meth"
//    blocks method actor; "con" blocks construction manager, consultant and
//    economist. That is also why nearly every entry below is multi-word: "drug
//    dealer" is a decision, "drug" is a mistake that takes drug counselor, drug
//    and alcohol counselor and substance abuse counselor down with it — three
//    careers this app's audience genuinely enters. Single words appear only
//    where the word has no innocent career meaning at all.
//
// The list is deliberately short. It is not a content moderation system; it
// catches the obvious cases for free. The phrasings it misses are caught a
// moment later by the `legitimate` flag on /api/refine-career, which asks the
// model the same question at no extra cost, and by Gemini's own safety filters
// behind that.

/** Which family of things a refused search fell into. */
export type BlockReason = "violence" | "drugs" | "sexual" | "fraud";

/**
 * Longest free-text string any AI-backed route will accept for a career, an
 * exam name, or a school search.
 *
 * Real job titles are short — the longest thing in our alias table is under
 * fifty characters. The cap exists because nothing else bounded the size of a
 * billed prompt: without it, one request can be made arbitrarily expensive
 * simply by padding the field.
 */
export const MAX_CAREER_INPUT = 200;

/** Ceiling on the career-assessment quiz's answer array. */
export const MAX_ASSESSMENT_ANSWERS = 30;

/** Ceiling on each question and answer string inside that array. */
export const MAX_ASSESSMENT_FIELD = 300;

/**
 * What a refused visitor is told.
 *
 * Deliberately flat and short. A student who typed something we won't plan for
 * needs to know it isn't happening and to be pointed back at the search box —
 * a lecture reads as an accusation, and most of the people who hit this are
 * teenagers testing what the box does.
 */
export const BLOCKED_CAREER_MESSAGE =
  "We can't build a plan for that. Try a different career.";

/** What a visitor is told when they've pasted far more text than a job title. */
export const TOO_LONG_MESSAGE =
  "That's too long to be a career. Try a job title instead.";

/**
 * Checked BEFORE the block list, and a hit here ends the check outright.
 *
 * Two groups. The first genuinely overlaps a blocked phrase today and would be
 * refused without this: anti-money-laundering and anti-human-trafficking work
 * both name the crime they exist to fight. The second group overlaps nothing
 * yet — it is here so that the next person who decides a single word would be
 * simpler than a phrase finds these already written down and discovers the
 * cost before shipping it.
 *
 * A hit clears the WHOLE string rather than the matched span, so "ethical
 * hacker and drug dealer" passes. That's the intended trade: a false negative
 * here reaches the model's second pass, whereas a false positive tells a
 * student their real career doesn't exist.
 */
const ALLOWED_PHRASES: readonly string[] = [
  // Really collide with an entry below.
  "anti money laundering",
  "money laundering investigator",
  "money laundering analyst",
  "money laundering compliance",
  "anti human trafficking",
  "human trafficking investigator",
  "human trafficking advocate",
  "human trafficking survivor advocate",

  // Don't collide today. Kept as a standing guard — see above.
  "ethical hacker",
  "certified ethical hacker",
  "white hat hacker",
  "penetration tester",
  "pen tester",
  "bug bounty hunter",
  "drug counselor",
  "drug and alcohol counselor",
  "substance abuse counselor",
  "fraud investigator",
  "fraud analyst",
  "fraud examiner",
];

/**
 * The refused phrases, by family.
 *
 * "violence" covers serious physical crime generally, not only killing. Plural
 * forms are spelled out where a student would plausibly type them; there is no
 * stemming, because guessing at word endings is how "analysis" becomes
 * "analysi" and a rule starts matching things nobody wrote.
 */
const BLOCKED_PHRASES: Record<BlockReason, readonly string[]> = {
  violence: [
    "hitman",
    "hitmen",
    "hit man",
    "assassin",
    "assassins",
    "contract killer",
    "hired killer",
    "professional killer",
    "killer for hire",
    "serial killer",
    "hired gun",
    "gun for hire",
    "arms dealer",
    "arms trafficker",
    "weapons dealer",
    "gun runner",
    "gunrunner",
    "human trafficker",
    "human trafficking",
    "sex trafficker",
    "sex trafficking",
    "terrorist",
    "suicide bomber",
    "bomb maker",
    "bombmaker",
    "kidnapper",
    "torturer",
    "war criminal",
    "bank robber",
    "armed robber",
    "gang leader",
    "gangster",
    "mob boss",
    "mafia boss",
    "cartel boss",
    "cartel member",
  ],
  drugs: [
    "drug dealer",
    "drug dealing",
    "drug trafficker",
    "drug trafficking",
    "drug smuggler",
    "drug smuggling",
    "drug lord",
    "drug kingpin",
    "drug mule",
    "meth cook",
    "meth dealer",
    "meth lab",
    "cook meth",
    "make meth",
    "cocaine dealer",
    "heroin dealer",
    "weed dealer",
    "pill pusher",
  ],
  sexual: [
    "porn actor",
    "porn actress",
    "porn star",
    "pornstar",
    "porn performer",
    "pornographic actor",
    "adult film actor",
    "adult film actress",
    "adult film star",
    "adult entertainer",
    "prostitute",
    "prostitution",
    "escort service",
    "call girl",
    "sex worker",
    "pimp",
    "stripper",
    "strippers",
    "exotic dancer",
    "cam girl",
    "camgirl",
    "cam model",
    "webcam model",
    "onlyfans",
    "onlyfans model",
    "sugar baby",
  ],
  fraud: [
    "scammer",
    "scam artist",
    "con artist",
    "con man",
    "conman",
    "grifter",
    "fraudster",
    "identity thief",
    "money launderer",
    "money laundering",
    "ponzi scheme",
    "pyramid scheme",
    "counterfeiter",
    "counterfeit money",
    "document forger",
    "check forger",
    "black hat hacker",
    "hacker for hire",
    "credit card fraud",
    "loan shark",
  ],
};

/**
 * True when `phrase` appears in `padded` as a complete run of words.
 *
 * Both sides are space-padded, so " gun " can only match the standalone word
 * and never the tail of "shotgun" or the head of "gunsmith". This is the
 * cheapest correct way to get word boundaries without escaping every entry
 * into a regular expression.
 */
function containsPhrase(padded: string, phrase: string): boolean {
  return padded.includes(` ${phrase} `);
}

/**
 * Decide whether we'll plan a route to this.
 *
 * Takes the ALREADY-NORMALIZED string from normalizeCareer(): lowercased,
 * punctuation collapsed to single spaces, and any leading "i want to be a"
 * removed. Passing raw user input works for simple cases but will miss
 * anything punctuated, so route it through normalizeCareer first.
 *
 * Returns the family it fell into, or null to proceed. It never throws and
 * never logs — it is a pure function, and the caller decides what a refusal
 * looks like, exactly as `matched` on ResolvedCareer already works.
 */
export function blockedCareer(normalized: string): BlockReason | null {
  const padded = ` ${normalized.toLowerCase().trim()} `;
  if (padded.trim() === "") return null;

  // First, and unconditionally. See ALLOWED_PHRASES.
  for (const phrase of ALLOWED_PHRASES) {
    if (containsPhrase(padded, phrase)) return null;
  }

  for (const reason of Object.keys(BLOCKED_PHRASES) as BlockReason[]) {
    for (const phrase of BLOCKED_PHRASES[reason]) {
      if (containsPhrase(padded, phrase)) return reason;
    }
  }

  return null;
}
