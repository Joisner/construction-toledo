/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  safelist: [
    'bg-gray-800',
    'text-white',
    'shadow-md',
    'container',
    'mx-auto',
    'px-4',
    'py-4',
    'flex',
    'justify-between',
    'items-center',
    'text-2xl',
    'font-bold',
    'hover:bg-gray-700',
    'rounded-md'
  ]
}
