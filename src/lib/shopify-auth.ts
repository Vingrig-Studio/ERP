// Функции для работы с Shopify API

// Проверка, используем ли мы мок-режим
export function isMockMode(): boolean {
  // Проверяем наличие реальных API ключей
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
  return !apiKey || apiKey === 'dummy-api-key' || apiKey === 'your_shopify_api_key';
}

// Получение профиля организации (для статического сайта используем localStorage)
export async function getProfile() {
  if (isMockMode() || typeof window === 'undefined') {
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
    // Для статического сайта используем localStorage
    const savedProfile = localStorage.getItem('shopify_profile');
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
    
    // Если профиль не найден, возвращаем значения по умолчанию
    return {
      companyType: 'limited',
      isLargeProducer: false,
      packagingSupplied: false,
      registeredAddress: {
        line1: '',
        city: '',
        postcode: '',
        country: 'GB',
      },
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Обновление профиля организации (для статического сайта используем localStorage)
export async function updateProfile(profile: any) {
  if (isMockMode() || typeof window === 'undefined') {
    console.log('Mock mode: profile would be saved to Shopify', profile);
    return { success: true };
  }

  try {
    // Для статического сайта сохраняем в localStorage
    localStorage.setItem('shopify_profile', JSON.stringify(profile));
    console.log('Profile saved to localStorage:', profile);
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: String(error) };
  }
} 