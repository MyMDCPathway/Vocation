// Password strength — length and a common-password check, not composition
// rules.
//
// NIST SP 800-63B (the current federal digital-identity guideline) is
// explicit that a service should NOT require a mix of uppercase, lowercase,
// digits, and symbols — that pattern trains people toward predictable
// substitutions ("Password1!") without meaningfully raising real entropy,
// and locks out passphrases that are actually stronger ("correct horse
// battery staple"). What NIST DOES recommend: a reasonable minimum length,
// and rejecting passwords already known to be common or breached. This file
// does the second half of that; MIN_LENGTH in the signup route does the
// first.
//
// THE BLOCKLIST BELOW IS GENERAL KNOWLEDGE, NOT APP DATA. Unlike a school's
// tuition or a job's wage — facts this app must never invent — "password"
// and "123456" appearing at the top of every published breach-analysis
// password-frequency list is public, well-documented information. It's a
// deliberately small, illustrative set (~150 entries drawn from
// widely-published top-passwords lists, e.g. NCSC/Have I Been Pwned's own
// public writeups) rather than a claim of exhaustive breach-corpus coverage
// — enough to block the passwords someone would actually try first, not a
// substitute for a real breach-database check (k-anonymity APIs exist for
// that; adding one is a real dependency decision, not made here).

const COMMON_PASSWORDS = new Set([
  "123456", "123456789", "12345678", "12345", "1234567", "1234567890",
  "qwerty", "qwerty123", "qwertyuiop", "password", "password1", "password123",
  "111111", "123123", "1234", "1q2w3e4r", "iloveyou", "000000", "abc123",
  "654321", "admin", "welcome", "monkey", "login", "princess", "letmein",
  "solo", "starwars", "dragon", "master", "hello", "freedom", "whatever",
  "trustno1", "batman", "zaq1zaq1", "shadow", "michael", "jennifer", "hunter",
  "1234561", "12345678910", "121212", "sunshine", "football", "baseball",
  "superman", "hockey", "ranger", "daniel", "george", "computer", "michelle",
  "jessica", "pepper", "1qaz2wsx", "abcd1234", "flower", "buster", "soccer",
  "harley", "ginger", "summer", "amanda", "loveyou", "asdfgh", "purple",
  "andrea", "cookie", "phoenix", "chelsea", "diamond", "tigger", "yankees",
  "matthew", "peanut", "orange", "banana", "thomas", "robert", "charlie",
  "jordan", "cheese", "iceman", "nicole", "samsung", "gateway", "friends",
  "welcome1", "yankee1", "asdf1234", "changeme", "letmein1", "password!",
  "p@ssword", "p@ssw0rd", "passw0rd", "qazwsx", "qazwsxedc", "zxcvbnm",
  "zxcvbn", "1qazxsw2", "aaaaaa", "666666", "888888", "159753", "987654321",
  "7777777", "1111111", "121212121", "target123", "iloveu", "letmein123",
  "trustno1!", "google", "internet", "monkey1", "spongebob", "pokemon",
  "mustang", "access", "shadow1", "tinkerbell", "nintendo", "playstation",
  "startrek", "startrek1", "newyork", "chicago", "cowboys", "steelers",
  "packers", "eagles", "warriors", "lakers",
]);

export interface PasswordStrength {
  /** 0 (unusable) through 4 (strong). */
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
  /** True when this password must be rejected outright, not just discouraged. */
  blocked: boolean;
  /** One-line reason, shown next to the meter. */
  feedback: string;
}

/** Case/punctuation-insensitive so "Password1!" still matches "password1". */
function normalize(password: string): string {
  return password.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Normalized once at load time, not per lookup — and so that a blocklist
// entry stored WITH punctuation ("p@ssword") still matches an input that
// normalizes to the same bare form ("password" or "p@ssword" alike).
const NORMALIZED_COMMON_PASSWORDS = new Set(
  [...COMMON_PASSWORDS].map((entry) => normalize(entry))
);

export function isCommonPassword(password: string): boolean {
  return NORMALIZED_COMMON_PASSWORDS.has(normalize(password));
}

/**
 * Length-and-diversity heuristic, not a composition requirement — nothing
 * here rejects a password for lacking a symbol or a digit. Diversity only
 * raises the score; only length and the common-password check can lower it
 * below "usable".
 */
export function passwordStrength(password: string): PasswordStrength {
  if (isCommonPassword(password)) {
    return {
      score: 0,
      label: "Very weak",
      blocked: true,
      feedback: "That password is one of the most common in use — pick something less guessable.",
    };
  }

  if (password.length < 8) {
    return {
      score: 0,
      label: "Very weak",
      blocked: true,
      feedback: "Must be at least 8 characters long.",
    };
  }

  let score: PasswordStrength["score"] = 1;
  if (password.length >= 12) score = 2;
  if (password.length >= 16) score = 3;

  const varieties = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password),
  ].filter(Boolean).length;
  if (varieties >= 3 && score < 4) score = (score + 1) as PasswordStrength["score"];

  const labels: Record<PasswordStrength["score"], PasswordStrength["label"]> = {
    0: "Very weak",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };

  const feedback =
    password.length < 12
      ? "A longer passphrase is stronger than a short password with symbols."
      : "Looks good.";

  return { score, label: labels[score], blocked: false, feedback };
}
