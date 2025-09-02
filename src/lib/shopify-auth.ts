// Functions for working with Shopify API

// Check if we're using mock mode
export function isMockMode(): boolean {
  // Check for presence of real API keys
  const apiKey = process.env.NEXT_PUBLIC_SHOPIFY_API_KEY;
  return !apiKey || apiKey === 'dummy-api-key' || apiKey === 'your_shopify_api_key';
}

// Get organisation profile (for static site we use localStorage)
export async function getProfile() {
  if (isMockMode() || typeof window === 'undefined') {
    console.log('Using mock profile data');
    // Return mock data for local development
    return {
      companyType: 'limited',
      isLargeProducer: true,
      packagingSupplied: true,
      registeredAddress: {
        line1: 'Example Street 1',
        city: 'London',
        postcode: 'E149PB',
        country: 'GB',
      },
    };
  }

  try {
    // For static site we use localStorage
    const savedProfile = localStorage.getItem('shopify_profile');
    if (savedProfile) {
      return JSON.parse(savedProfile);
    }
    
    // If profile not found, return default values
    return {
      companyType: 'limited',
      isLargeProducer: false,
      packagingSupplied: false,
      registeredAddress: {
        line1: '',
        city: '',
        postcode: '',
        country: 'GB',
      },
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

// Update organisation profile (for static site we use localStorage)
export async function updateProfile(profile: any) {
  if (isMockMode() || typeof window === 'undefined') {
    console.log('Mock mode: profile would be saved to Shopify', profile);
    return { success: true };
  }

  try {
    // For static site we save to localStorage
    localStorage.setItem('shopify_profile', JSON.stringify(profile));
    console.log('Profile saved to localStorage:', profile);
    return { success: true };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: String(error) };
  }
} 