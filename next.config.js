module.exports = {
  // Для локальной разработки и тестирования с API роутами
  // и интеграции с Shopify закомментируйте следующую строку
  // output: 'export',
  
  // Раскомментировано для использования API роутов и Shopify интеграции
  output: undefined,
  
  // Настройки для Shopify
  env: {
    SHOPIFY_API_KEY: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
    SHOPIFY_API_SECRET: process.env.SHOPIFY_API_SECRET,
  },
}; 