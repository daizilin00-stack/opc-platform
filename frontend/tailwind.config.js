/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 中新数据港品牌色
        brand: {
          50: '#f0f7ff',
          100: '#dcebfe',
          200: '#bfd6fe',
          300: '#93bbfd',
          400: '#609afa',
          500: '#3b82f6',
          600: '#2563eb',  // 中新数据港主蓝
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',  // 中新数据港辅绿
          600: '#16a34a',
        },
        // 兼容旧代码的 primary 别名
        primary: {
          50: '#f0f7ff',
          100: '#dcebfe',
          200: '#bfd6fe',
          300: '#93bbfd',
          400: '#609afa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}