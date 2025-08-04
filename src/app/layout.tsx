import { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Pascalite UK Compliance Calculator',
  description: 'Расчёт UK EPR для Shopify',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
} 