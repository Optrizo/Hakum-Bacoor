/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      colors: {
        'brand-dark-blue': '#052699',
        'brand-blue': '#116AF8',
        'brand-cyan': '#20BCED',
        'brand-white': '#F1F1F1',
        'brand-gray': '#878EA0',
        'brand-light-gray': '#DCE3EB',
        'brand-black': '#0A0A0A',
        
        // Semantic colors for light/dark modes
        background: {
          light: '#F7F9FC', // Soft, off-white background
          dark: '#0A0A0A',   // brand-black
        },
        surface: {
          light: '#FFFFFF', // Clean white for cards/surfaces
          dark: '#1A1A1A', 
        },
        primary: {
          DEFAULT: '#116AF8', // brand-blue
          light: '#052699',   // brand-dark-blue
          dark: '#20BCED',    // brand-cyan
        },
        text: {
          primary: {
            light: '#0A0A0A', // brand-black
            dark: '#F1F1F1',   // brand-white
          },
          secondary: {
            light: '#6B7280', // A slightly darker gray for better contrast
            dark: '#878EA0', 
          }
        },
        border: {
          light: '#E5E7EB', // A neutral gray that works well with the new background
          dark: '#3A3A3A',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
};
