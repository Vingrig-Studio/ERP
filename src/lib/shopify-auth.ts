// Функции для работы с Shopify API

// Проверка, используем ли мы мок-режим
export function isMockMode(): boolean {
  // Проверяем наличие реальных API ключей
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
  return !apiKey || apiKey === 'dummy-api-key' || apiKey === 'your_shopify_api_key';
}

// Получение профиля организации из метаполей Shopify
export async function getProfile() {
  if (isMockMode()) {
    console.log('Using mock profile data');
    // Возвращаем мок-данные для локальной разработки
    return {
      companyType: 'limited',
      isLargeProducer: true,
      packagingSupplied: true,
      registeredAddress: {
        line1: 'Example Street 1',
        city: 'London',
        postcode: 'E149PB',
        country: 'GB',
      },
    };
  }

  try {
    // Получаем текущий хост из window.location
    const shop = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('shop') : null;
    
    if (!shop) {
      console.error('Shop parameter not found');
      return null;
    }

    // Запрос к нашему API для получения метаполей
    const response = await fetch(`/api/shopify/metafields?shop=${shop}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.profile;
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Обновление профиля организации в метаполях Shopify
export async function updateProfile(profile: any) {
  if (isMockMode()) {
    console.log('Mock mode: profile would be saved to Shopify', profile);
    return { success: true };
  }

  try {
    // Получаем текущий хост из window.location
    const shop = typeof window !== 'undefined' ? new URL(window.location.href).searchParams.get('shop') : null;
    
    if (!shop) {
      console.error('Shop parameter not found');
      return { success: false, error: 'Shop parameter not found' };
    }

    // Запрос к нашему API для обновления метаполей
    const response = await fetch('/api/shopify/metafields', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shop,
        profile,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: String(error) };
  }
} 