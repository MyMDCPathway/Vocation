// Simple rate limiting configuration
// You can adjust these values based on your needs

export const RATE_LIMIT_CONFIG = {
  // Maximum requests per IP address
  maxRequestsPerIP: 10,

  // Time window in milliseconds (15 minutes)
  windowMs: 15 * 60 * 1000,

  // Message shown when limit exceeded
  message: "Too many requests from this IP, please try again later.",
};
