import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './content/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ground: 'var(--ground)', card: 'var(--card)', ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
        accent: 'var(--accent)', 'accent-deep': 'var(--accent-deep)', 'accent-tint': 'var(--accent-tint)',
      },
      fontFamily: { ui: ['var(--font-inter)', 'system-ui', 'sans-serif'], read: ['var(--font-literata)', 'Georgia', 'serif'], mono: ['var(--font-mono)', 'ui-monospace', 'monospace'] },
    },
  },
  plugins: [],
};
export default config;
