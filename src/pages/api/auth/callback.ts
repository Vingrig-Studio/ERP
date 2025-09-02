import { NextApiRequest, NextApiResponse } from 'next';

// OAuth callback handler from Shopify
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get request parameters
  const { code, shop, state, hmac } = req.query;

  // In a real application there should be HMAC verification for security
  // Example: verifyHmac(req.query, process.env.SHOPIFY_API_SECRET);

  if (!code || !shop) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Exchange code for permanent access token
    // Example:
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
    
    // Save token in database or session
    // saveAccessToken(shop, access_token);
    */

    // For example just redirect to main application page
    // In real application need to add host parameter for App Bridge
    const redirectUrl = `/`;
    
    return res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('OAuth error:', error);
    return res.status(500).json({ error: 'OAuth authentication failed' });
  }
} 