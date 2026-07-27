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
  },
  {
    name: 'Christian Orozco',
    image: '/team/chris.jpg',
    linkedin: 'https://www.linkedin.com/in/christiandeangeloorozco/',
  },
  {
    name: 'Gerald Gelats',
    image: '/team/gerald.jpg',
    linkedin: 'https://www.linkedin.com/in/geraldgelats/',
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

export default function MeetTheTeam() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Meet the Team</h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
          {TEAM.map((member) => (
            <div key={member.name} className="flex flex-col items-center text-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-40 h-40 rounded-full object-cover shadow-md mb-4"
              />
              <p className="font-semibold text-gray-900">{member.name}</p>
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${member.name} on LinkedIn`}
                className="mt-2 text-gray-500 hover:text-school-600 transition-colors"
              >
                <LinkedInIcon />
              </a>
            </div>
          ))}
        </div>

        <div className="prose prose-gray max-w-none text-gray-700">
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
            className="text-school-600 hover:text-school-700 font-medium"
          >
            ← Back to Vocation
          </a>
        </div>
      </div>
    </div>
  )
}
