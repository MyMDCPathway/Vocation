// The scattered geometric shapes behind the hero.
//
// Purely decorative, and built to stay that way:
//
//   - aria-hidden, so a screen reader never announces a lilac hexagon
//   - pointer-events: none on the field AND every shape, so a blob sitting
//     over the career input can't swallow the click
//   - z-index 0 with the content above it, for the same reason
//
// CSS shapes rather than images. They're a handful of polygons, they need to
// pick up the palette variables, and a dozen <img> requests for decoration is
// a waste of the page's load budget.

interface Blob {
  /** Tailwind positioning — deliberately per-shape rather than random, so the
   *  layout is stable between renders and reviewable in a diff. */
  className: string;
  color: string;
  shape: "squircle" | "triangle" | "hexagon" | "fan" | "pill";
  size: number;
  rotate: number;
  /** Staggered so they don't all bob in unison, which reads as a glitch. */
  delay: number;
}

// Kept away from the centre column: everything here sits in the outer margins
// so it frames the question rather than crowding it. The `hidden` classes drop
// the outermost ones on small screens, where there is no margin to sit in.
const HERO_BLOBS: Blob[] = [
  { className: "left-[3%] top-[18%]", color: "var(--pop-orange)", shape: "squircle", size: 104, rotate: -8, delay: 0 },
  { className: "left-[-2%] top-[62%] hidden md:block", color: "var(--pop-orange)", shape: "fan", size: 92, rotate: 22, delay: 1.6 },
  { className: "left-[16%] top-[52%] hidden lg:block", color: "var(--pop-blue)", shape: "hexagon", size: 88, rotate: 12, delay: 2.4 },
  { className: "right-[14%] top-[8%] hidden md:block", color: "var(--pop-orange)", shape: "triangle", size: 112, rotate: 14, delay: 0.8 },
  { className: "right-[6%] top-[30%]", color: "var(--pop-blue)", shape: "squircle", size: 96, rotate: 0, delay: 2 },
  { className: "right-[3%] top-[56%] hidden md:block", color: "var(--pop-purple)", shape: "fan", size: 90, rotate: -18, delay: 1.2 },
  { className: "right-[19%] top-[74%] hidden lg:block", color: "var(--pop-purple)", shape: "hexagon", size: 64, rotate: 8, delay: 3 },
  { className: "left-[9%] top-[84%] hidden lg:block", color: "var(--pop-mint)", shape: "pill", size: 58, rotate: 0, delay: 2.8 },
];

export function Confetti({ blobs = HERO_BLOBS }: { blobs?: Blob[] }) {
  return (
    <div className="shape-field" aria-hidden="true">
      {blobs.map((blob, index) => (
        <span
          key={index}
          className={`shape shape-${blob.shape} shape-drift ${blob.className}`}
          style={{
            width: blob.size,
            height: blob.size,
            background: blob.color,
            // Read by the drift keyframes so each shape rotates from its own
            // resting angle instead of snapping to zero when the animation
            // starts.
            ["--shape-rot" as string]: `${blob.rotate}deg`,
            transform: `rotate(${blob.rotate}deg)`,
            animationDelay: `${blob.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

/** A quieter set for the inner question screens, which need less noise. */
export const QUIET_BLOBS: Blob[] = [
  { className: "left-[2%] top-[12%] hidden lg:block", color: "var(--pop-blue)", shape: "squircle", size: 72, rotate: -6, delay: 0 },
  { className: "right-[3%] top-[24%] hidden lg:block", color: "var(--pop-orange)", shape: "fan", size: 66, rotate: 18, delay: 1.4 },
  { className: "right-[6%] bottom-[10%] hidden lg:block", color: "var(--pop-purple)", shape: "hexagon", size: 56, rotate: 10, delay: 2.6 },
];
