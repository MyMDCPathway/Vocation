import { feedbackUrl, type FeedbackFlow } from "@/app/lib/feedback";

/**
 * "Tell us what you think" — one component, three call sites.
 *
 * Renders NOTHING when no form is configured (see feedbackUrl). That's the
 * whole reason this isn't three inline `<a>` tags: the null check has to
 * happen identically everywhere, and a link that 404s is worse than no link.
 *
 * Opens in a new tab on purpose. The form is the end of the road on Google's
 * side, and a student who came here mid-plan should still have their plan
 * sitting behind it when they're done.
 */
export function FeedbackLink({
  flow,
  className,
  label = "Tell us what you think",
}: {
  /** Which surface this is rendered on — see FeedbackFlow for why it matters. */
  flow: FeedbackFlow;
  className?: string;
  label?: string;
}) {
  const href = feedbackUrl(flow);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "text-sm font-medium tracking-[0.05em] text-on-surface-variant transition-colors hover:text-primary"
      }
    >
      {label}
    </a>
  );
}
