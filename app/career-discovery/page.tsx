"use client";

import Link from "next/link";

export default function CareerDiscoveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar - Centered Logo */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/">
            <img
              src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
              alt="Miami Dade College Logo"
              className="h-10 w-auto cursor-pointer"
            />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <section className="px-6 md:px-8 pt-24 md:pt-32 pb-24 md:pb-32">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Career Discovery
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Explore different career paths and find the one that's right for you.
          </p>
          
          {/* Placeholder content */}
          <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
            <p className="text-gray-600">
              Career discovery tools and resources will be available here soon.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

