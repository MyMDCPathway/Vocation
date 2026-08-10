import type { Metadata } from "next";
import Link from "next/link";
import { AuthControls } from "@/app/components/AuthControls";
import { JobPoolBrowser } from "@/app/components/interests/JobPoolBrowser";
import { getInterestDetail } from "@/app/lib/interests";

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const detail = getInterestDetail(params.slug);
  return {
    title: detail ? `${detail.label} careers | Vocation` : "Browse by interest | Vocation",
    description: detail
      ? `${detail.jobs.length} real occupations in ${detail.label}, from the US Bureau of Labor Statistics.`
      : undefined,
  };
}

function Wordmark() {
  return <span className="text-lg font-bold tracking-tight text-primary">Vocation</span>;
}

export default function InterestDetailPage({ params }: { params: { slug: string } }) {
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
        <JobPoolBrowser slug={params.slug} />
      </main>
    </div>
  );
}
