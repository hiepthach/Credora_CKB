import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Doppler Design System Tokens (from DESIGN.md) — dynamically mapped for Light & Dark modes
        'midnight-plum': 'rgb(var(--color-midnight-plum) / <alpha-value>)',
        'shadow-plum': 'rgb(var(--color-shadow-plum) / <alpha-value>)',
        'bone-white': 'rgb(var(--color-bone-white) / <alpha-value>)',
        'fog-line': 'rgb(var(--color-fog-line) / <alpha-value>)',
        'ash-veil': 'rgb(var(--color-ash-veil) / <alpha-value>)',
        'mid-ash': 'rgb(var(--color-mid-ash) / <alpha-value>)',
        'iron-edge': 'rgb(var(--color-iron-edge) / <alpha-value>)',
        'lavender-spark': 'rgb(var(--color-lavender-spark) / <alpha-value>)',
        'signal-green': 'rgb(var(--color-signal-green) / <alpha-value>)',
        'neon-violet': 'rgb(var(--color-neon-violet) / <alpha-value>)',
        'ember-orange': 'rgb(var(--color-ember-orange) / <alpha-value>)',
        'plasma-pink': 'rgb(var(--color-plasma-pink) / <alpha-value>)',

        // Semantic Aliases mapped to Doppler System
        void: {
          DEFAULT: 'rgb(var(--color-midnight-plum) / <alpha-value>)',
          canvas: 'rgb(var(--color-midnight-plum) / <alpha-value>)',
        },
        midnight: {
          DEFAULT: 'rgb(var(--color-shadow-plum) / <alpha-value>)',
          surface: 'rgb(var(--color-shadow-plum) / <alpha-value>)',
        },
        deep: {
          indigo: 'rgb(var(--color-deep-indigo) / <alpha-value>)',
        },
        lilac: {
          white: 'rgb(var(--color-bone-white) / <alpha-value>)',
          DEFAULT: 'rgb(var(--color-bone-white) / <alpha-value>)',
        },
        ash: 'rgb(var(--color-ash-veil) / <alpha-value>)',
        fog: 'rgb(var(--color-mid-ash) / <alpha-value>)',
        steel: 'rgb(var(--color-iron-edge) / <alpha-value>)',
        mercury: 'rgb(var(--color-fog-line) / <alpha-value>)',
        dusk: 'rgb(var(--color-iron-edge) / <alpha-value>)',
        lavender: {
          DEFAULT: 'rgb(var(--color-lavender-spark) / <alpha-value>)',
          accent: 'rgb(var(--color-lavender-spark) / <alpha-value>)',
        },
        iris: 'rgb(var(--color-signal-green) / <alpha-value>)', // Primary 'go' CTA action maps to signal green

        // Semantic surface & text aliases
        surface: {
          void: 'rgb(var(--color-midnight-plum) / <alpha-value>)',
          card: 'rgb(var(--color-shadow-plum) / <alpha-value>)',
          elevated: 'rgb(var(--color-deep-indigo) / <alpha-value>)',
        },
        text: {
          primary: 'rgb(var(--color-bone-white) / <alpha-value>)',
          secondary: 'rgb(var(--color-ash-veil) / <alpha-value>)',
          tertiary: 'rgb(var(--color-mid-ash) / <alpha-value>)',
          muted: 'rgb(var(--color-iron-edge) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-lavender-spark) / <alpha-value>)',
          signal: 'rgb(var(--color-signal-green) / <alpha-value>)',
          iris: 'rgb(var(--color-neon-violet) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'ui-monospace', 'monospace'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        doppler: ["'Doppler Repro'", 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
        wider: '0.03em',
      },
      borderRadius: {
        btn: '12px',
        card: '20px',
        badge: '9999px',
        nav: '9999px',
        '2xl': '20px',
        xl: '12px',
        lg: '8px',
      },
      boxShadow: {
        'glow-sm': 'var(--shadow-glow-sm)',
        'glow-md': 'var(--shadow-glow-md)',
        'glow-lg': 'var(--shadow-glow-lg)',
        'glow-violet': 'var(--shadow-glow-violet)',
        'glow-green': 'var(--shadow-glow-green)',
        'screenshot-frame': 'var(--shadow-screenshot-frame)',
      },
      backgroundImage: {
        'doppler-gradient': 'linear-gradient(91deg, #855aff 14.92%, #ff5632 90.53%)',
        'cosmic-gradient': 'linear-gradient(91deg, #855aff 14.92%, #ff5632 90.53%)',
        'aurora-gradient': 'radial-gradient(ellipse at top, rgba(107, 19, 245, 0.35) 0%, rgba(255, 158, 250, 0.15) 35%, transparent 70%)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInScale: {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        auroraBreath: {
          '0%, 100%': { transform: 'scale(1) rotate(0deg)', opacity: '0.65' },
          '50%': { transform: 'scale(1.1) rotate(3deg)', opacity: '0.9' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pingSlow: {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-scale': 'fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 4s ease-in-out infinite',
        'aurora-breath': 'auroraBreath 8s ease-in-out infinite',
        'gradient-shift': 'gradientShift 6s ease infinite',
        'ping-slow': 'pingSlow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'float': 'float 5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
