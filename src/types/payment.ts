// types/payment.ts
export interface CinetPayInitRequest {
  amount: number;
  currency: string;
  transaction_id: string;
  description: string;
  customer_name: string;
  customer_surname: string;
  customer_email: string;
  customer_phone_number: string;
  customer_address: string;
  customer_city: string;
  customer_country: string;
  customer_state: string;
  customer_zip_code: string;
  return_url: string;
  notify_url: string;
  channels?: string;
}

export interface CinetPayInitResponse {
  code: string;
  message: string;
  description: string;
  data?: {
    payment_token: string;
    payment_url: string;
  };
  api_response_id: string;
}

// AJOUT: Type spécifique pour la réponse de vérification de transaction.
export interface CinetPayVerificationResponse {
  code: string; // "00" en cas de succès
  message: string;
  data?: {
    status: "ACCEPTED" | "REFUSED" | "PENDING" | "EXPIRED";
    amount: number;
    currency: string;
    payment_method: string;
    // ... et autres champs utiles retournés par l'API
  };
  api_response_id: string;
}
