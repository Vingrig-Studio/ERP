import { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Pascalite UK Compliance Calculator',
  description: 'UK EPR calculation for Shopify',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
} 