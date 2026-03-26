/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#3B82F6', // Electric Blue
                secondary: '#8B5CF6', // Example Light Purple
                accent: '#F97316', // Pastel Orange
                background: '#F3F4F6', // Smoke White / Gray 100
            },
            fontFamily: {
                sans: ['"Be Vietnam Pro"', 'Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
