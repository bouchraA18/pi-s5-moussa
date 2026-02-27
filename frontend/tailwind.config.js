/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // New Premium "Petrol Blue" Palette based on user image
                primary: {
                    50: '#f2f9fd',
                    100: '#e5f2fa',
                    200: '#c5e2f4',
                    300: '#94cbeb',
                    400: '#5caedc',
                    500: '#3490c6',
                    600: '#004e7c', // The Target Color
                    700: '#004067',
                    800: '#003554',
                    900: '#002e47',
                    950: '#001e30',
                },
                accent: {
                    500: '#f97316',
                    600: '#ea580c',
                }
            },
            backdropBlur: {
                xs: '2px',
            }
        },
    },
    plugins: [],
}
