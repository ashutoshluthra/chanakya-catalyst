// File: postcss.config.js

export default {
  plugins: {
    '@tailwindcss/postcss': {}, 
    'autoprefixer': {},
'postcss-preset-env': {
      stage: 1,
      features: {
        'color-function': true, // enables conversion of oklch(), lab(), etc.
      },
    },

  }
};