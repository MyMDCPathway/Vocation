// The feedback form link, and which flow the respondent came from.
//
// WHY THE FLOW IS ATTACHED TO THE URL rather than asked as a question.
//
// The thing worth learning from this survey is whether the classic /pathway
// search (1.0) serves students better than the guided intake (2.0). That can't
// be asked directly of most respondents: the home page's search box routes to
// /start, so nearly everyone only ever sees 2.0, and the people who do use
// classic got there by deliberately clicking "Classic search" — a group that
// selected itself for preferring it. Asking "which did you like better" of
// either group produces an answer neither is qualified to give.
//
// So the comparison is between-subjects instead: everyone answers the SAME
// questions, each response carries the flow it came from, and the two groups'
// scores are compared afterwards. Google Forms prefills a field from a query
// parameter, which is enough to do that without a database, a session, or a
// single line of server code.
//
// Self-report is deliberately avoided here. A student who used the guided
// wizard three screens deep does not necessarily know it was called "2.0", and
// a dropdown asking them costs a question and buys a worse answer than the URL
// already knows.

/**
 * Which surface the respondent is coming from.
 *
 * `classic` and `guided` are the two being compared. `home` is neither — it's
 * someone giving feedback from the landing page who may not have generated
 * anything at all, and lumping them into either flow would quietly pollute
 * the comparison this whole file exists to make.
 */
export type FeedbackFlow = "classic" | "guided" | "home";

/**
 * The form's own URL, e.g. https://docs.google.com/forms/d/e/<id>/viewform
 *
 * NEXT_PUBLIC_ because the link is rendered in the browser. Nothing secret
 * lives here — it's the same URL every respondent sees in their address bar.
 */
const FORM_URL = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL;

/**
 * The `entry.<n>` field id of the hidden "which flow" question.
 *
 * Google generates this per-question; it's read off the form's own prefill
 * link (Forms → ⋮ → "Get pre-filled link"). Optional on purpose: without it
 * the link still works and still collects answers, it just can't attribute
 * them to a flow. A survey that runs without attribution is worth more than
 * no survey at all, so this degrades rather than disables.
 */
const FLOW_ENTRY_ID = process.env.NEXT_PUBLIC_FEEDBACK_FLOW_ENTRY_ID;

/**
 * The feedback URL for a given flow, or `null` when no form is configured.
 *
 * Null is the important half. Every caller renders nothing when this returns
 * null, which is the same discipline durableCache.ts and the email transport
 * follow: a missing integration disables a feature, it never ships a broken
 * one. A "Provide feedback" button that opens a 404 is worse than no button,
 * because it costs the student a click to learn we're not listening.
 */
export function feedbackUrl(flow: FeedbackFlow): string | null {
  if (!FORM_URL) return null;

  if (!FLOW_ENTRY_ID) return FORM_URL;

  const url = new URL(FORM_URL);
  // Google's own prefill links carry this; without it the entry parameters
  // are ignored and the field arrives blank.
  url.searchParams.set("usp", "pp_url");
  url.searchParams.set(`entry.${FLOW_ENTRY_ID}`, flow);
  return url.toString();
}
