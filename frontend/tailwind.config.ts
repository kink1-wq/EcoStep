import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: { extend: {
    colors: {
      emerald: { 50: '#EFF5E9', 100: '#E0ECD6', 200: '#C6DBB5', 300: '#A6C695', 400: '#80AC70', 500: '#588B51', 600: '#345F42', 700: '#234C3B', 800: '#1D4032', 900: '#18342A' },
      slate: { 50: '#F7F8F2', 100: '#EFF1E9', 200: '#E1E5D9', 300: '#CDD4C6', 400: '#8B9786', 500: '#59664F', 600: '#515F4D', 700: '#394A38', 800: '#283D2D', 900: '#20382A' }
    }, fontFamily: { sans: ['Manrope', 'Arial', 'sans-serif'] }
  } },
  plugins: [],
};
export default config;
