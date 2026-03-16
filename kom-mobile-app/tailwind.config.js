// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'space-mono': ['SpaceMono'],
      },
      colors: {
        primary: {
          DEFAULT: '#D4AF37', // Unified Metallic Gold
          50: '#FBF7E9',
          100: '#F6EFD3',
          200: '#EDE0A8',
          300: '#E3D07C',
          400: '#D9C050',
          500: '#D4AF37', // Base
          600: '#AA8C2C', // Darkened slightly
          700: '#7A6223',
          800: '#524118',
          900: '#29200C',
        },
        secondary: {
          DEFAULT: '#1F2937',
        },
        dark: {
          bg: '#121212',
          surface: '#1E1E1E',
        }
      }
    },
  },
  plugins: [],
}
