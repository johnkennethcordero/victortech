module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'system-ui', 'sans-serif'],
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display': ['28px', { lineHeight: '34px', fontWeight: '600' }],
        'h1': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'h2': ['18px', { lineHeight: '24px', fontWeight: '500' }],
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'caption': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'micro': ['11px', { lineHeight: '16px', fontWeight: '400' }],
      },
      textColor: {
        'caption': '#6B7280',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      colors: {
        dark: {
          bg:     '#0a0a0a',  // true black page background
          card:   '#141414',  // slightly lighter for cards
          border: '#2a2a2a',  // subtle borders
        }
      }
    },
  },
  plugins: [],
}