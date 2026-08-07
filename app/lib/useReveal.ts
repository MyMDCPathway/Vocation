"use client";

import { useEffect, useRef, useState } from "react";

// Scroll-triggered reveal, the CSS-only motion system's client half.
//
// Attach the returned ref to a section, add `reveal` to its className always
// and `reveal-visible` conditionally on the returned boolean — see
// app/globals.css for what those two classes actually do and why they're
// one keyframe system, not two.
//
// Fires once. A section that already played its entrance doesn't need to
// replay it every time a student scrolls past it again — that reads as the
// page nervously repeating itself, not as motion.
export function useReveal<T extends HTMLElement>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No IntersectionObserver (very old browsers, some test environments):
    // show the content immediately rather than leaving it invisible forever.
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}
