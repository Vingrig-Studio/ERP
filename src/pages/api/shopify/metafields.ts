import { NextApiRequest, NextApiResponse } from 'next';

// Функция для проверки подлинности запроса от Shopify
function verifyShopifyRequest(req: NextApiRequest) {
  // В реальном приложении здесь должна быть проверка HMAC или другой способ аутентификации
  // Для примера просто проверяем наличие shop параметра
  return !!req.query.shop || (req.body && req.body.shop);
}

// Функция для получения метаполей магазина
async function getShopifyMetafields(shop: string) {
  try {
    // Здесь должен быть реальный запрос к Shopify GraphQL API
    // Пример запроса:
    /*
    const response = await fetch(`https://${shop}/admin/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_API_SECRET || '',
      },
      body: JSON.stringify({
        query: `
          {
            shop {
              metafields(namespace: "pascalite", first: 10) {
                edges {
                  node {
                    key
                    value
                  }
                }
              }
            }
          }
        `
      }),
    });
    const data = await response.json();
    */
    
    // Для примера возвращаем заглушку
    return {
      profile: {
        companyType: 'limited',
        isLargeProducer: true,
        packagingSupplied: true,
        registeredAddress: {
          line1: 'Example Street 1',
          city: 'London',
          postcode: 'E149PB',
          country: 'GB',
        },
      }
    };
  } catch (error) {
    console.error('Error fetching Shopify metafields:', error);
    throw error;
  }
}

// Функция для обновления метаполей магазина
async function updateShopifyMetafields(shop: string, profile: any) {
  try {
    // Здесь должен быть реальный запрос к Shopify GraphQL API
    // Пример запроса:
    /*
    const response = await fetch(`https://${shop}/admin/api/2023-07/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_API_SECRET || '',
      },
      body: JSON.stringify({
        query: `
          mutation UpdateStoreMetadata($profile: String!) {
            shopUpdate(metafields: [
              { namespace: "pascalite", key: "org_profile", value: $profile }
            ]) { userErrors { message } }
          }
        `,
        variables: {
          profile: JSON.stringify(profile),
        }
      }),
    });
    const data = await response.json();
    */
    
    // Для примера возвращаем успешный результат
    return { success: true };
  } catch (error) {
    console.error('Error updating Shopify metafields:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Проверяем аутентификацию запроса
  if (!verifyShopifyRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const shop = req.query.shop as string || req.body?.shop;
  
  if (!shop) {
    return res.status(400).json({ error: 'Shop parameter is required' });
  }

  try {
    if (req.method === 'GET') {
      // Получение метаполей
      const data = await getShopifyMetafields(shop);
      return res.status(200).json(data);
    } else if (req.method === 'POST') {
      // Обновление метаполей
      const profile = req.body.profile;
      if (!profile) {
        return res.status(400).json({ error: 'Profile data is required' });
      }
      
      const result = await updateShopifyMetafields(shop, profile);
      return res.status(200).json(result);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error in metafields API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 