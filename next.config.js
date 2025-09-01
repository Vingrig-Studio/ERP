/** @type {import('next').NextConfig} */
const nextConfig = {
  // Статический экспорт для Netlify
  output: 'export',
  
  // Отключаем оптимизацию изображений для статического экспорта
  images: {
    unoptimized: true
  },
  
  // Отключаем trailing slash для лучшей совместимости
  trailingSlash: true,
  
  // Базовый путь (можно настроить если нужно)
  // basePath: '',
  
  // Переменные окружения для клиентской стороны
  env: {
    NEXT_PUBLIC_SHOPIFY_API_KEY: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
  },
  
  // ESLint конфигурация
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript конфигурация
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig; 