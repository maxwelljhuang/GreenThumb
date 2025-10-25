import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // GreenThumb Color Palette
        sand: {
          DEFAULT: '#f5f5d5',
          50: '#f5f5d5',
          100: '#f0f0d0',
          200: '#e8e8c0',
          300: '#e0e0b0',
          400: '#d8d8a0',
          500: '#d0d090',
          600: '#c8c880',
          700: '#c0c070',
          800: '#b8b860',
          900: '#b0b050',
        },
        dune: {
          DEFAULT: '#c7b793',
          50: '#f5f3ed',
          100: '#ebe6d8',
          200: '#d7cdb1',
          300: '#c3b48a',
          400: '#af9b63',
          500: '#9b823c',
          600: '#7d682f',
          700: '#5f4e22',
          800: '#413415',
          900: '#231a08',
        },
        sage: {
          DEFAULT: '#a3b68a',
          50: '#f0f4ed',
          100: '#e1e9db',
          200: '#c3d3b7',
          300: '#a5bd93',
          400: '#87a76f',
          500: '#69914b',
          600: '#54743c',
          700: '#3f572d',
          800: '#2a3a1e',
          900: '#151d0f',
        },
        pine: {
          DEFAULT: '#5c724a',
          50: '#f0f2ef',
          100: '#e1e5df',
          200: '#c3cbbf',
          300: '#a5b19f',
          400: '#87977f',
          500: '#697d5f',
          600: '#54644c',
          700: '#3f4b39',
          800: '#2a3226',
          900: '#151913',
        },
        forest: {
          DEFAULT: '#354a2f',
          50: '#f0f2ef',
          100: '#e1e5df',
          200: '#c3cbbf',
          300: '#a5b19f',
          400: '#87977f',
          500: '#697d5f',
          600: '#54644c',
          700: '#3f4b39',
          800: '#2a3226',
          900: '#151913',
        },
        // Shadcn/ui colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
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
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-in': 'slide-in 0.3s ease-out',
        'bounce-gentle': 'bounce-gentle 2s infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      screens: {
        'xs': '475px',
      },
      aspectRatio: {
        '4/3': '4 / 3',
        '3/2': '3 / 2',
        '2/3': '2 / 3',
        '9/16': '9 / 16',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
