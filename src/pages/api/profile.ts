import { NextApiRequest, NextApiResponse } from 'next';
import { getProfile, updateProfile } from '@/lib/shopify-auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;
  // TODO: get shop from session
  const shop = 'example';

  switch (method) {
    case 'GET':
      const profile = await getProfile();
      res.json(profile);
      break;
    case 'POST':
      const { profile: newProfile } = req.body;
      await updateProfile(newProfile);
      res.json({ success: true });
      break;
    default:
      res.status(405).json({ error: 'Method not allowed' });
  }
} 