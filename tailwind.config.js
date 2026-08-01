/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Retinted at runtime from the selected school's brand color. The
        // variables are defined in globals.css (defaulting to MDC blue) and
        // overwritten on <html> by applySchoolTheme. Steps mirror Tailwind's
        // own scale so `bg-school-600` drops in wherever `bg-blue-600` was.
        // Vocation's own palette — constant, unlike school-* which retints at
        // runtime. The intake is school-agnostic and is built from these.
        sand: {
          DEFAULT: 'var(--sand)',
          deep: 'var(--sand-deep)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
        },
        pop: {
          orange: 'var(--pop-orange)',
          blue: 'var(--pop-blue)',
          purple: 'var(--pop-purple)',
          mint: 'var(--pop-mint)',
        },
        school: {
          50: 'var(--school-50)',
          100: 'var(--school-100)',
          200: 'var(--school-200)',
          300: 'var(--school-300)',
          400: 'var(--school-400)',
          500: 'var(--school-500)',
          600: 'var(--school-600)',
          700: 'var(--school-700)',
          800: 'var(--school-800)',
          900: 'var(--school-900)',
        },
      },
    },
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
  },
  plugins: [],
}

