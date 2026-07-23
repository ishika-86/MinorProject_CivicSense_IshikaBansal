/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        auth:  { 1:'#DFF2EB', 2:'#B9E5E8', 3:'#7AB2D3', 4:'#4A628A' },
        dash:  { 1:'#19183B', 2:'#708993', 3:'#A1C2BD', 4:'#E7F2EF' },
        pub:   { 1:'#355872', 2:'#7AAACE', 3:'#9CD5FF', 4:'#F7F8F0' },
        bot:   { 1:'#0F2854', 2:'#1C4D8D', 3:'#4988C4', 4:'#BDE8F5' },
      },
      fontFamily: {
        sans:    ['"Outfit"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      animation: {
        'pulse-slow':    'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'emergency-pulse':'emergencyPulse 1.2s ease-in-out infinite',
        'shimmer':       'shimmer 1.5s infinite linear',
        'slide-up':      'slideUp 0.3s ease-out',
        'fade-in':       'fadeIn 0.4s ease-out',
      },
      keyframes: {
        emergencyPulse: { '0%,100%':{ opacity:1, transform:'scale(1)' }, '50%':{ opacity:0.8, transform:'scale(1.02)' } },
        shimmer:        { '0%':{ backgroundPosition:'-200% 0' }, '100%':{ backgroundPosition:'200% 0' } },
        slideUp:        { from:{ opacity:0, transform:'translateY(12px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        fadeIn:         { from:{ opacity:0 }, to:{ opacity:1 } },
      },
      boxShadow: {
        glass:    '0 8px 32px rgba(0,0,0,0.08)',
        'glass-lg':'0 20px 60px rgba(0,0,0,0.12)',
        emergency:'0 0 24px rgba(239,68,68,0.45)',
      },
    },
  },
  plugins: [],
}
