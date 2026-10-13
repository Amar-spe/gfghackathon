/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Professional Healthcare & Emergency Design System
        primary: {
          DEFAULT: '#10243A', // Deep operational navy
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#10243A',
          950: '#071525',
        },
        emergency: {
          DEFAULT: '#E53935', // Controlled emergency red
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#E53935',
          600: '#D32F2F',
          700: '#C62828',
          800: '#B71C1C',
        },
        teal: {
          DEFAULT: '#0F9D8A', // Secondary healthcare teal
          50: '#E6F7F5',
          100: '#C0ECE6',
          200: '#96E0D5',
          300: '#6BD4C4',
          400: '#45C7B3',
          500: '#0F9D8A',
          600: '#0C8373',
          700: '#09695C',
          800: '#064F46',
        },
        amber: {
          DEFAULT: '#D97706',
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        slate: {
          850: '#162238',
          900: '#0F172A',
          950: '#0B1220',
        },
        // Backward-compatible brand tokens mapped to refined palette
        brand: {
          bg:      '#0B1220', // Clean dark base
          surface: '#10243A', // Deep navy surface
          card:    '#131F33', // Elevated navy card
          border:  '#1E2D44', // Subtle slate border
          cyan:    '#0EA5E9', // Controlled sky/cyan accent (not neon)
          green:   '#0F9D8A', // Healthcare teal-green
          amber:   '#D97706', // Alert amber
          red:     '#E53935', // Emergency red
          text:    '#F1F5F9', // High-contrast clean white-slate
          muted:   '#64748B', // Professional muted slate
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        body: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 2px 8px -2px rgba(16, 36, 58, 0.08), 0 1px 4px -1px rgba(16, 36, 58, 0.04)',
        'card-dark': '0 4px 12px -2px rgba(0, 0, 0, 0.3), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
        'emergency': '0 4px 14px 0 rgba(229, 57, 53, 0.25)',
      },
      borderRadius: {
        'sm': '4px',
        DEFAULT: '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
      }
    }
  },
  plugins: []
};
