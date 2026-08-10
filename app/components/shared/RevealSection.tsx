"use client";

import type { ReactNode } from "react";
import { useReveal } from "@/app/lib/useReveal";

// The one client boundary a server-rendered page needs to use useReveal.
// app/page.tsx stays a server component — everything on it is static and
// there's no reason to ship it as client JS just to animate three sections
// in. This wraps only what needs the IntersectionObserver.
export function RevealSection({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const [ref, visible] = useReveal<HTMLDivElement>();

  return (
    <div ref={ref} className={`reveal ${visible ? "reveal-visible" : ""} ${className ?? ""}`}>
      {children}
    </div>
  );
}
