// lib/config.ts
// Configuration centralisée pour éviter les incohérences entre les variables d'environnement

export const config = {
  // URLs de l'application
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || '',
  
  // CinetPay Configuration
  cinetpay: {
    apiKey: process.env.CINETPAY_APIKEY || '',
    siteId: process.env.CINETPAY_SITE_ID || '',
    secretKey: process.env.CINETPAY_SECRET_KEY || '',
    mode: process.env.CINETPAY_MODE || 'TEST',
    apiUrl: 'https://api-checkout.cinetpay.com/v2',
  },
  
  // Supabase Configuration
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  
  // Business Configuration
  business: {
    activationCost: Number(process.env.NEXT_PUBLIC_PROPERTY_ACTIVATION_COST) || 250,
    commissionRate: Number(process.env.NEXT_PUBLIC_CINETPAY_COMMISSION_RATE) || 2.5,
  },
  
  // Email Configuration
  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || '',
    adminEmail: process.env.ADMIN_EMAIL || '',
  },
};

// Validation des configurations critiques
export function validateConfig() {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('NEXT_PUBLIC_BASE_URL est manquante');
  }

  if (!config.cinetpay.apiKey) {
    errors.push('CINETPAY_APIKEY est manquante');
  }

  if (!config.cinetpay.siteId) {
    errors.push('CINETPAY_SITE_ID est manquante');
  }

  if (!config.cinetpay.secretKey) {
    errors.push('CINETPAY_SECRET_KEY est manquante');
  }

  if (!config.supabase.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL est manquante');
  }

  if (!config.supabase.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY est manquante');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration invalide: ${errors.join(', ')}`);
  }
}

// Utilitaires pour construire les URLs
export function buildNotifyUrl(): string {
  return `${config.baseUrl}/api/payments/webhook`;
}

export function buildReturnUrl(path: string = '/profil/paiements'): string {
  return `${config.baseUrl}${path}`;
}

// Validation des URLs
export function validateUrls() {
  const notifyUrl = buildNotifyUrl();
  const returnUrl = buildReturnUrl();

  try {
    new URL(notifyUrl);
    new URL(returnUrl);
  } catch (error) {
    throw new Error(`URLs invalides: notify_url=${notifyUrl}, return_url=${returnUrl}`);
  }

  return { notifyUrl, returnUrl };
}