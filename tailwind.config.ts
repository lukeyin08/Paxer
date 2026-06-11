import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1200px',
      },
    },
    extend: {
      colors: {
        // Paxer brand tokens (Section 5)
        ink: 'hsl(var(--ink))',
        paper: 'hsl(var(--paper))',
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        accent2: 'hsl(var(--accent2))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        rule: 'hsl(var(--rule))',
        soft: 'hsl(var(--soft))',
        success: 'hsl(var(--success))',
        danger: 'hsl(var(--danger))',
        warning: 'hsl(var(--warning))',
        // shadcn semantic aliases mapped to brand
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      fontFamily: {
        // Single sans family for display + body (matches the logo). `serif` is
        // kept as an alias of sans so any stray `font-serif` stays on-brand.
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // Accent glow used by the primary button and floating surfaces.
        'glow-sm': '0 4px 24px -8px hsl(var(--glow) / 0.45)',
        glow: '0 0 0 1px hsl(var(--accent) / 0.18), 0 12px 48px -12px hsl(var(--glow) / 0.55)',
      },
      transitionTimingFunction: {
        // Soft "ease-out-expo"-ish curve used by reveals/entrances.
        reveal: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        aurora: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '33%': { transform: 'translate3d(3%, -4%, 0) scale(1.08)' },
          '66%': { transform: 'translate3d(-3%, 2%, 0) scale(0.94)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 5s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
