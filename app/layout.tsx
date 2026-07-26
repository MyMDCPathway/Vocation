import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SchoolProvider } from '@/app/components/SchoolProvider'
import { DEFAULT_SCHOOL_ID, getSchoolById } from '@/app/lib/floridaSchools'
import { SCHOOL_COOKIE_NAME } from '@/app/lib/schoolStorage'
import { scaleToCssVars } from '@/app/lib/schoolTheme'

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
  // Reading the cookie is what lets the server render the selected school's
  // logo and colors directly, instead of shipping MDC's and correcting it after
  // the browser has already painted. It opts these pages into dynamic
  // rendering, which is correct for a personalized page.
  const stored = cookies().get(SCHOOL_COOKIE_NAME)?.value
  const schoolId = stored && getSchoolById(stored) ? stored : DEFAULT_SCHOOL_ID
  const school = getSchoolById(schoolId)!

  // The palette used to be applied by a blocking inline script, because only
  // the browser knew the school. The server knows it now, so it can just be a
  // stylesheet — no script, and no window where the wrong colors are live.
  const paletteCss = Object.entries(scaleToCssVars(school.color))
    .map(([name, value]) => `${name}:${value}`)
    .join(';')

  return (
    <html lang="en" data-school={schoolId}>
      <head>
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: `:root{${paletteCss}}` }} />
      </head>
      <body className="min-h-screen">
        <SchoolProvider schoolId={schoolId}>{children}</SchoolProvider>
        <Analytics />
      </body>
    </html>
  )
}
