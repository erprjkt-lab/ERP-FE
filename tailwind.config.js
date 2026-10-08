/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Logo primary cyan/sky blue palette (#00A0E3)
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#00a0e3',
          600: '#008ecb',
          700: '#0275a8',
          800: '#07618a',
          900: '#0c5072',
          950: '#08334c',
        },
        // Logo deep teal palette (#017678 -> #02809E)
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#02809e',
          600: '#017678',
          700: '#0a5e60',
          800: '#0d4b4d',
          900: '#104041',
          950: '#042728',
        },
        // Map violet to teal palette so ambient effects harmonize with the logo
        violet: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#02809e',
          600: '#017678',
          700: '#0a5e60',
          800: '#0d4b4d',
          900: '#104041',
          950: '#042728',
        },
        ink: {
          50: '#f4f6f9',
          100: '#e6eaf1',
          200: '#c7d0e0',
          300: '#9aabc7',
          400: '#6a7fa3',
          500: '#4c5f85',
          600: '#3a4a6b',
          700: '#2c3856',
          800: '#1c2540',
          900: '#0f1730',
          950: '#080d1d',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #00a0e3 0%, #017678 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #f0f9ff 0%, #f0fdfa 100%)',
        'radial-fade': 'radial-gradient(60% 60% at 50% 40%, rgba(0, 160, 227, 0.16) 0%, rgba(1, 118, 120, 0) 70%)',
      },
      boxShadow: {
        glow: '0 0 60px -15px rgba(0, 160, 227, 0.45)',
        card: '0 10px 40px -12px rgba(15, 23, 48, 0.18)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-delay': 'float 6s ease-in-out 2s infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'gradient-x': 'gradient-x 8s ease infinite',
        marquee: 'marquee 28s linear infinite',
        'grid-pan': 'grid-pan 22s linear infinite',
        'spin-slow': 'spin 26s linear infinite',
        'pulse-slow': 'pulse-slow 5s ease-in-out infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'drift-a': 'drift-a 16s ease-in-out infinite',
        'drift-b': 'drift-b 20s ease-in-out infinite',
        'drift-c': 'drift-c 13s ease-in-out infinite',
        'ring-pulse': 'ring-pulse 2.4s ease-out infinite',
        shimmer: 'shimmer 2.6s ease-in-out infinite',
        'blob-morph': 'blob-morph 14s ease-in-out infinite',
        'beam-x': 'beam-x 3.5s linear infinite',
        'tilt-slow': 'tilt-slow 10s ease-in-out infinite',
        'bob-hint': 'bob-hint 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'grid-pan': {
          '0%': { backgroundPosition: '0px 0px' },
          '100%': { backgroundPosition: '40px 40px' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: 0.35, transform: 'scale(1)' },
          '50%': { opacity: 0.55, transform: 'scale(1.08)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 0.15, transform: 'scale(0.85)' },
          '50%': { opacity: 0.6, transform: 'scale(1.1)' },
        },
        'drift-a': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '25%': { transform: 'translate(24px, -18px) scale(1.05)' },
          '50%': { transform: 'translate(-12px, 14px) scale(0.97)' },
          '75%': { transform: 'translate(16px, 22px) scale(1.03)' },
        },
        'drift-b': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '30%': { transform: 'translate(-20px, 16px) scale(1.06)' },
          '60%': { transform: 'translate(18px, -10px) scale(0.95)' },
        },
        'drift-c': {
          '0%, 100%': { transform: 'translate(0px, 0px)' },
          '50%': { transform: 'translate(-14px, -20px)' },
        },
        'ring-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(0, 160, 227, 0.35)' },
          '100%': { boxShadow: '0 0 0 14px rgba(0, 160, 227, 0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '60%, 100%': { transform: 'translateX(220%)' },
        },
        'blob-morph': {
          '0%, 100%': { borderRadius: '46% 54% 38% 62% / 52% 44% 56% 48%' },
          '33%': { borderRadius: '62% 38% 56% 44% / 40% 60% 40% 60%' },
          '66%': { borderRadius: '38% 62% 44% 56% / 60% 38% 62% 40%' },
        },
        'beam-x': {
          '0%': { transform: 'translateX(-100%)', opacity: 0 },
          '20%, 80%': { opacity: 1 },
          '100%': { transform: 'translateX(100%)', opacity: 0 },
        },
        'tilt-slow': {
          '0%, 100%': { transform: 'rotate(-1.2deg)' },
          '50%': { transform: 'rotate(1.2deg)' },
        },
        'bob-hint': {
          '0%, 100%': { transform: 'translateY(0)', opacity: 0.55 },
          '50%': { transform: 'translateY(6px)', opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
