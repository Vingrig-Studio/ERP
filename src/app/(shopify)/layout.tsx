'use client';

import { Provider } from '@shopify/app-bridge-react';
import { ReactNode, useEffect, useState } from 'react';

import '@/app/globals.css';

type LayoutProps = {
  children: ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY || '';
  
  // Проверяем, есть ли реальный API ключ (не dummy)
  const isRealApiKey = apiKey && apiKey !== 'dummy-api-key';
  
  // Получаем host из URL параметров (как это делает Shopify)
  const getShopifyHost = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const host = params.get('host');
      return host || window.location.host;
    }
    return 'dummy-host';
  };

  // Конфигурация для App Bridge
  const config = {
    apiKey,
    host: mounted ? getShopifyHost() : 'dummy-host',
    forceRedirect: isRealApiKey ? true : false, // Исправляю тип на boolean
  };

  console.log('Using real Shopify API:', isRealApiKey);
  console.log('API Key:', apiKey);
  console.log('Host:', config.host);

  // Рендерим только на клиенте
  if (!mounted) {
    return <div>Loading...</div>;
  }

  // Если нет реального API ключа, работаем в mock режиме
  if (!isRealApiKey) {
    console.log('Running in mock mode without Shopify App Bridge');
    return <>{children}</>;
  }

  // Для mock mode не используем Provider, чтобы избежать ошибки invalid host
  if (isRealApiKey) {
    console.log('Mock mode: Skipping Shopify Provider');
    return <div>{children}</div>;
  }

  // Для реальных ключей используем Provider
  return (
    <Provider config={config}>
      {children}
    </Provider>
  );
} 