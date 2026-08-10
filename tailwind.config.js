/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Soft and precise, not extreme — disciplined geometry that reads as
      // professional. Overriding these keys (rather than adding new ones)
      // means every existing `rounded`/`rounded-lg`/`rounded-xl` in the app
      // moves onto the new scale as its screen is migrated. Full circles are
      // reserved for roadmap nodes and chips. See DESIGN.md "The Node-Is-Round
      // Rule".
      borderRadius: {
        sm: '0.125rem',
        DEFAULT: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        raised: 'var(--shadow-raised)',
        lift: 'var(--shadow-card-hover)',
        overlay: 'var(--shadow-overlay)',
      },
      colors: {
        // Retinted at runtime from the selected school's brand color. The
        // variables are defined in globals.css (defaulting to MDC blue) and
        // overwritten on <html> by applySchoolTheme. Steps mirror Tailwind's
        // own scale so `bg-school-600` drops in wherever `bg-blue-600` was.
        // Vocation's own palette — constant, unlike school-* which retints at
        // runtime. Every school-agnostic surface is built from these.
        // See DESIGN.md, "The Accredited Pathway".
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary-container)',
          fixed: 'var(--primary-fixed)',
          'fixed-dim': 'var(--primary-fixed-dim)',
        },
        'on-primary': 'var(--on-primary)',
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
          fixed: 'var(--secondary-fixed)',
        },
        'on-secondary': 'var(--on-secondary)',
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
          fixed: 'var(--tertiary-fixed)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          lowest: 'var(--surface-container-lowest)',
          low: 'var(--surface-container-low)',
          container: 'var(--surface-container)',
          high: 'var(--surface-container-high)',
          highest: 'var(--surface-container-highest)',
          dim: 'var(--surface-dim)',
        },
        'on-surface': {
          DEFAULT: 'var(--on-surface)',
          variant: 'var(--on-surface-variant)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        danger: {
          DEFAULT: 'var(--error)',
          container: 'var(--error-container)',
          on: 'var(--on-error-container)',
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
      // Inter is the body/label default (set on <body> in globals.css);
      // `font-display` opts a component into Hanken Grotesk for a heading
      // that isn't a real <h1-4> tag. See DESIGN.md "The Two-Voice Rule".
      sans: ['Inter', 'sans-serif'],
      display: ['Hanken Grotesk', 'sans-serif'],
    },
  },
  plugins: [],
}

