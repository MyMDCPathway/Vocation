import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SchoolProvider } from '@/app/components/SchoolProvider'
import { Providers } from '@/app/components/Providers'
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
        {/* Site entry fade (`.site-enter` in globals.css). One wrapper here
            rather than a per-page animation, for two reasons:

            - The App Router never unmounts the root layout on a client-side
              navigation, so this element is created once per real page load.
              The fade plays on arrival and then never again while the visitor
              moves around the site. Put the same class on a page and every
              internal link would re-fade the whole screen, which reads as a
              full reload rather than as polish.
            - It wraps the content, not <body>. body owns the page background
              (--surface); fading the body would fade the canvas itself and
              flash white underneath before settling.

            The wrapper is layout-neutral: a plain block box in normal flow.
            Pages that size themselves with min-h-screen are unaffected —
            100vh is viewport-relative, not parent-relative.

            It does hold a transform for the first 500ms, which makes it the
            containing block for `position: fixed` descendants for that long.
            Every fixed overlay in the app (the pathway modals and the
            generation spinner) only mounts after a user action, so none of
            them can be on screen inside that window. */}
        <div className="site-enter">
          <Providers>
            <SchoolProvider schoolId={schoolId}>{children}</SchoolProvider>
          </Providers>
        </div>
        <Analytics />
      </body>
    </html>
  )
}
