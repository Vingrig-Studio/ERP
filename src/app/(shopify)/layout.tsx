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
  
  // Check if we have a real API key (not dummy)
  const isRealApiKey = apiKey && apiKey !== 'dummy-api-key';
  
  // Get host from URL parameters (as Shopify does)
  const getShopifyHost = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const host = params.get('host');
      return host || window.location.host;
    }
    return 'dummy-host';
  };

  // Configuration for App Bridge
  const config = {
    apiKey,
    host: mounted ? getShopifyHost() : 'dummy-host',
    forceRedirect: isRealApiKey ? true : false, // Fixing type to boolean
  };

  console.log('Using real Shopify API:', isRealApiKey);
  console.log('API Key:', apiKey);
  console.log('Host:', config.host);

  // Render only on client
  if (!mounted) {
    return <div>Loading...</div>;
  }

  // If no real API key, work in mock mode
  if (!isRealApiKey) {
    console.log('Running in mock mode without Shopify App Bridge');
    return <>{children}</>;
  }

  // For mock mode don't use Provider to avoid invalid host error
  if (isRealApiKey) {
    console.log('Mock mode: Skipping Shopify Provider');
    return <div>{children}</div>;
  }

  // For real keys use Provider
  return (
    <Provider config={config}>
      {children}
    </Provider>
  );
} 