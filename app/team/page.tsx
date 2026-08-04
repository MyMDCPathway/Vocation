import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Meet the Team | Vocation',
  description: 'Meet the team behind Vocation.',
}

const TEAM = [
  {
    name: 'Sean Valencia',
    image: '/team/sean.jpg',
    linkedin: 'https://www.linkedin.com/in/seanvalencia046/',
    github: 'https://github.com/SVDevHub?tab=overview&from=2026-07-01&to=2026-07-27',
  },
  {
    name: 'Christian Orozco',
    image: '/team/chris.jpg',
    linkedin: 'https://www.linkedin.com/in/christiandeangeloorozco/',
    github: 'https://github.com/chrisorozco305',
  },
  {
    name: 'Gerald Gelats',
    image: '/team/gerald.jpg',
    linkedin: 'https://www.linkedin.com/in/geraldgelats/',
    github: 'https://github.com/ggela123',
  },
]

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-5 h-5 fill-current"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.446-2.136 2.94v5.666H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.556V9h3.558v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="w-5 h-5 fill-current"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.303 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.011-1.04-.017-2.04-3.338.726-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.238 1.84 1.238 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.467-1.333-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.5 11.5 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.652.243 2.873.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.014 2.898-.014 3.293 0 .319.192.694.801.576C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  )
}

export default function MeetTheTeam() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-on-surface mb-8">Meet the Team</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {TEAM.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-40 h-40 rounded-full object-cover shadow-md mb-4"
              />
              <p className="font-semibold text-on-surface">{member.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on LinkedIn`}
                  className="text-outline hover:text-primary transition-colors"
                >
                  <LinkedInIcon />
                </a>
                <a
                  href={member.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${member.name} on GitHub`}
                  className="text-outline hover:text-primary transition-colors"
                >
                  <GitHubIcon />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="prose prose-slate max-w-none text-on-surface-variant">
          <p>
            Chris, Sean and Gerald came together to create Vocation for the 2025
            SharkByte Hackathon. Together they built an app that helps students
            turn a career goal into a concrete educational pathway — matching
            them to the right degree program, school, and licensing exams
            needed to get there. They continue working on the project
            afterwards. They are Computer Science graduates from FIU in Miami,
            Florida.
          </p>
        </div>

        <div className="mt-12">
          <a
            href="/"
            className="text-primary hover:text-primary-container font-medium"
          >
            ← Back to Vocation
          </a>
        </div>
      </div>
    </div>
  )
}
