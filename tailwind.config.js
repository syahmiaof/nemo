/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--bg-canvas)',
        elevated: 'var(--bg-elevated)',
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          solid: 'var(--surface-solid)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          emphasis: 'var(--border-emphasis)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          mint: 'var(--accent-mint)',
          amber: 'var(--accent-amber)',
          ember: 'var(--accent-ember)',
          ring: 'var(--focus-ring)',
        }
      },
      fontFamily: {
        sans: [
          'Urbanist',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'Geist Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      boxShadow: {
        glass: 'var(--shadow)',
        'glass-pop': 'var(--shadow-pop)',
      }
    },
  },
  plugins: [],
}
