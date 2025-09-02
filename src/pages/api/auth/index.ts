import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const shop = req.query.shop as string;
  
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }

  // Form URL for Shopify authorisation
  const scopes = process.env.SCOPES || 'write_metafields,read_shop';
  const redirectUri = `${req.headers.origin}/api/auth/callback`;
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
  
  // Create nonce for security
  const nonce = Buffer.from(Math.random().toString()).toString('base64');
  
  // Save nonce in session or cookie (omitted for simplicity)
  
  // Form authorisation URL
  const authUrl = `https://${shop}/admin/oauth/authorize?client_id=${apiKey}&scope=${scopes}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${nonce}`;
  
  // Redirect user to Shopify authorisation page
  res.redirect(authUrl);
} 