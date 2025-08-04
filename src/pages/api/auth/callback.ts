import { NextApiRequest, NextApiResponse } from 'next';

// Обработчик OAuth callback от Shopify
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Получаем параметры запроса
  const { code, shop, state, hmac } = req.query;

  // В реальном приложении здесь должна быть проверка HMAC для безопасности
  // Пример: verifyHmac(req.query, process.env.SHOPIFY_API_SECRET);

  if (!code || !shop) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Обмен кода на постоянный токен доступа
    // Пример:
    /*
    const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_SHOPIFY_API_KEY,
        client_secret: process.env.SHOPIFY_API_SECRET,
        code,
      }),
    });

    const { access_token } = await response.json();
    
    // Сохранение токена в базе данных или сессии
    // saveAccessToken(shop, access_token);
    */

    // Для примера просто перенаправляем на главную страницу приложения
    // В реальном приложении нужно добавить параметр host для App Bridge
    const redirectUrl = `/`;
    
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).json({ error: 'OAuth authentication failed' });
  }
} 