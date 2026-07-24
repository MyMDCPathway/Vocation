// Rate limiting configuration.
// You can adjust these values based on your needs.

export const RATE_LIMIT_CONFIG = {
  // Maximum requests per IP address
  maxRequestsPerIP: 10,

  // Time window in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,

  // Message shown when limit exceeded
  message: "Too many requests from this IP, please try again later.",

  // Hard ceiling on Gemini-backed generations per day across all visitors.
  // This is the budget kill switch: cache hits and seeded careers don't count
  // toward it, so only genuinely new careers consume the allowance. When it's
  // exhausted the app degrades to a message instead of spending more.
  maxGenerationsPerDay: 300,

  // Message shown when the daily ceiling is reached
  dailyLimitMessage:
    "This demo has hit its daily generation limit. Try one of the common careers, or run it yourself with your own API key — the repo is linked below.",
};
