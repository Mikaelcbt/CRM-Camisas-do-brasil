module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          base:  '#09090b',
          card:  '#111113',
          hover: '#18181b',
          input: '#1c1c1f',
        },
        ink: {
          primary:   '#fafafa',
          secondary: '#a1a1aa',
          muted:     '#52525b',
          disabled:  '#3f3f46',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          dim:    '#27272a',
          focus:  '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight:   '-0.02em',
      },
      animation: {
        shimmer: 'shimmer 1.6s infinite linear',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-600px 0' },
          '100%': { backgroundPosition:  '600px 0' },
        },
      },
    },
  },
  plugins: [],
};
