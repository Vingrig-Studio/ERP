import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const shop = req.query.shop as string;
  
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  // Формируем URL для авторизации в Shopify
  const scopes = process.env.SCOPES || 'write_metafields,read_shop';
  const redirectUri = `${req.headers.origin}/api/auth/callback`;
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
  
  // Создаем nonce для безопасности
  const nonce = Buffer.from(Math.random().toString()).toString('base64');
  
  // Сохраняем nonce в сессии или cookie (для простоты опущено)
  
  // Формируем URL авторизации
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;
  
  // Перенаправляем пользователя на страницу авторизации Shopify
  res.redirect(authUrl);
} 