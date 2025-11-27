import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Vocation | Career Planning for Miami Dade College',
  description: 'Plan your complete educational journey from Miami Dade College to your dream career. AI-powered pathway generation with programs, transfers, and certifications.',
  keywords: 'Vocation, Miami Dade College, MDC, career planning, educational pathway',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}

