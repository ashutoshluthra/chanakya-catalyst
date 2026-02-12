/** @type {import('tailwindcss').Config} */
export default {
  // CRITICAL: Must be 'class' to allow JS toggling on the <html> element.
  darkMode: 'class', 
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Enforce mandated Amber primary accent
        'amber': {
          '50': '#fffbeb',
          '100': '#fff3c7',
          '200': '#fce595',
          '400': '#fcc700', 
          '500': '#f59e0b',
          '600': '#d97706', 
          '800': '#92400e',
          '900': '#78350f',
        },
        // Enforce mandated Charcoal/Light Gray backgrounds
        'gray': {
          '100': '#f3f4f6',
          '500': '#6b7280',
          '800': '#1f2937', 
          '900': '#111827', 
        },
      }
    },
  },
  safelist: [
    'text-amber-600',
    'bg-gray-900',
    'bg-white',
    'border-amber-500',
    'bg-amber-50',
    'text-amber-400',
    'border-amber-300',
    'bg-amber-100',
    // Ensure all critical shades are included for stability
    'text-gray-900',
    'dark:text-white',
    'dark:bg-gray-800',
    'dark:bg-gray-900',
  ],
  plugins: [],
};