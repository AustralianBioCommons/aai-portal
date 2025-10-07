module.exports = {
  content: ['./src/**/*.{html,ts}'],
  // Safelist classes that are used dynamically to ensure they're included in production builds
  safelist: [
    // Background colors
    'bg-sky-50',
    'bg-sky-100',
    'bg-sky-900',
    'bg-green-50',
    'bg-red-50',
    'bg-biocommons-primary',

    // Text colors
    'text-white',
    'text-biocommons-primary',
    'text-green-700',
    'text-red-700',

    // Hover states
    'hover:bg-sky-100',
    'hover:bg-sky-900',
    'hover:-translate-y-0.5',
    'hover:shadow-lg',

    // Min widths
    'min-w-4',
    'min-w-5',
    'min-w-6',
    'min-w-20',
    'min-w-24',
    'min-w-32',
    'min-w-44',
    'min-w-64',
    'min-w-80',
    'min-w-96',

    // Other utilities
    'ring-2',
    'ring-red-500',
    'ring-sky-400',
    'opacity-50',
    'cursor-not-allowed',
    'cursor-pointer',
  ],
  theme: {
    extend: {
      colors: {
        bpa: {
          primary: '#041e48',
          secondary: '#171717',
        },
        galaxy: {
          primary: '#243e8f',
        },
        biocommons: {
          primary: '#205a86',
        },
      },
    },
  },
  plugins: [],
};
