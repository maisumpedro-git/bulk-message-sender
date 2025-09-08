/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1320px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
      colors: {
        bg: 'hsl(var(--bg))',
        surface: 'hsl(var(--surface))',
        'surface-alt': 'hsl(var(--surface-alt))',
        border: 'hsl(var(--border))',
        fg: 'hsl(var(--fg))',
        'fg-muted': 'hsl(var(--fg-muted))',
        brand: 'hsl(var(--brand))',
        'brand-hover': 'hsl(var(--brand-hover))',
        danger: 'hsl(var(--danger))',
        warning: 'hsl(var(--warning))',
        success: 'hsl(var(--success))',
        info: 'hsl(var(--info))',
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(0,0,0,0.06),0 1px 3px 1px rgba(0,0,0,0.04)',
      },
      borderRadius: {
        xl: '1rem',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(.16,1,.3,1)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.cq': {
          'container-type': 'inline-size',
        },
      });
    },
  ],
};
