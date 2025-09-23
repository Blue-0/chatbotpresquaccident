/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
 
    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      boxShadowColor: {
        'shadowlight': 'var(--greenlight)',
      },
        fontFamily:{
            'poppins': ['Poppins', 'sans-serif'],
            'raleway': ['Raleway', 'sans-serif'],
        },
        borderColor: {
            'borderlight': 'var(--greenlight)',
            'borderdark': 'var(--greendark)',
            'borderorange': 'var(--orange)',
        }
    },
  },
  plugins: [],
}