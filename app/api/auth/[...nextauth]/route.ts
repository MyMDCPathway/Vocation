import { handlers } from "@/app/lib/auth";

// Auth.js's catch-all route — handles /api/auth/signin, /callback/:provider,
// /session, /csrf, and everything else the library needs. All the actual
// configuration lives in app/lib/auth.ts; this file only wires it in.
export const { GET, POST } = handlers;
