import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cosmos: {
          950: '#030608',
          900: '#050810',
          850: '#080d18',
          800: '#0D1117',
          750: '#111827',
          700: '#1A2035',
          600: '#1e2a45',
          500: '#243050',
        },
        glow: {
          indigo: '#6366F1',
          violet: '#818CF8',
          emerald: '#10B981',
          cyan: '#06B6D4',
          amber: '#F59E0B',
          rose: '#F43F5E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        glass: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
        'glass-lg': '0 8px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-indigo': '0 0 20px rgba(99,102,241,0.4), 0 0 60px rgba(99,102,241,0.15)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.4), 0 0 60px rgba(16,185,129,0.15)',
        'glow-violet': '0 0 20px rgba(129,140,248,0.3)',
        'node': '0 2px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'node-hover': '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.12)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'particle': 'particle 20s linear infinite',
        'dash': 'dash 3s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-8px) rotate(0.5deg)' },
          '66%': { transform: 'translateY(-4px) rotate(-0.5deg)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        particle: {
          '0%': { transform: 'translateY(100vh) translateX(0px)', opacity: '0' },
          '10%': { opacity: '1' },
          '90%': { opacity: '1' },
          '100%': { transform: 'translateY(-100px) translateX(100px)', opacity: '0' },
        },
        dash: {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-20' },
        },
      },
      backgroundImage: {
        'cosmos-gradient': 'radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(129,140,248,0.06) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(16,185,129,0.04) 0%, transparent 50%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        'node-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
      },
    },
  },
  plugins: [],
}

export default config
