/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Royal Blue brand palette
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary Royal Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        // Secondary Blue / Accent
        accent: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
        // Status Palette (Exact prompt specs)
        success: {
          DEFAULT: '#16a34a',
          light: '#f0fdf4',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fffbeb',
        },
        danger: {
          DEFAULT: '#dc2626',
          light: '#fef2f2',
        },
        running: {
          DEFAULT: '#2563eb',
          light: '#eff6ff',
        },
        pending: {
          DEFAULT: '#94a3b8',
          light: '#f1f5f9',
        },
        // Light surface palette
        surface: {
          50:  '#f8fafc', // Main App Background
          100: '#f1f5f9',
          200: '#e2e8f0', // Border
          300: '#cbd5e1',
          400: '#94a3b8', // Muted
          500: '#64748b', // Secondary text
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a', // Dark text
        },
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)',
        'card-hover': '0 4px 12px -2px rgba(37, 99, 235, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
