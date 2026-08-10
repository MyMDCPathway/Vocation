import type { Metadata } from "next";
import Link from "next/link";
import { AuthControls } from "@/app/components/AuthControls";
import { IndustryBrowser } from "@/app/components/interests/IndustryBrowser";

// The "browse more" destination from the homepage's Browse by Interest
// section — every SOC major group, not just the six curated tiles.

export const metadata: Metadata = {
  title: "Browse every industry | Vocation",
  description:
    "The full US Bureau of Labor Statistics occupational classification — every industry, pick one to see its real jobs.",
};

function Wordmark() {
  return <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>;
}

export default function InterestsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-5 py-4 md:px-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 rounded">
              <Wordmark />
            </Link>
            <nav className="hidden items-center gap-5 sm:flex">
              <Link href="/pathways" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Pathways
              </Link>
              <Link href="/schools" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Schools
              </Link>
              <Link href="/insights" className="text-sm font-medium text-primary transition-colors hover:text-primary-container">
                Insights
              </Link>
            </nav>
          </div>
          <AuthControls />
        </div>
      </header>

      <main className="flex-1">
        <IndustryBrowser />
      </main>
    </div>
  );
}
