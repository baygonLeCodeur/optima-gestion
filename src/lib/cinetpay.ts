// lib/cinetpay.ts
import axios from 'axios';
import { CinetPayInitRequest, CinetPayInitResponse, CinetPayVerificationResponse } from '@/types/payment';

const CINETPAY_API_URL = 'https://api-checkout.cinetpay.com/v2';

class CinetPayService {
  private apiKey: string;
  private siteId: string;

  constructor( ) {
    // AJOUT: Vérification que les variables d'environnement sont bien chargées.
    if (!process.env.CINETPAY_APIKEY || !process.env.CINETPAY_SITE_ID) {
      throw new Error("Les variables d'environnement CINETPAY_APIKEY et CINETPAY_SITE_ID sont requises.");
    }
    this.apiKey = process.env.CINETPAY_APIKEY;
    this.siteId = process.env.CINETPAY_SITE_ID;
  }

  async initializePayment(data: Omit<CinetPayInitRequest, 'apikey' | 'site_id'>): Promise<CinetPayInitResponse> {
    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      ...data,
    };

    try {
      const response = await axios.post<CinetPayInitResponse>(`${CINETPAY_API_URL}/payment`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      // CHANGEMENT: Gestion d'erreur améliorée pour logger les détails de l'API.
      if (axios.isAxiosError(error) && error.response) {
        console.error('CinetPay API Error Response:', error.response.data);
        throw new Error(`Erreur API CinetPay: ${error.response.data.description || error.message}`);
      }
      throw new Error(`Erreur lors de l'initialisation du paiement: ${error.message}`);
    }
  }

  async verifyTransaction(transactionId: string): Promise<CinetPayVerificationResponse> {
    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      transaction_id: transactionId,
    };

    try {
      const response = await axios.post<CinetPayVerificationResponse>(`${CINETPAY_API_URL}/payment/check`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      // CHANGEMENT: Gestion d'erreur améliorée.
      if (axios.isAxiosError(error) && error.response) {
        console.error('CinetPay Verification Error Response:', error.response.data);
        throw new Error(`Erreur API CinetPay (Vérification): ${error.response.data.description || error.message}`);
      }
      throw new Error(`La vérification de la transaction a échoué: ${error.message}`);
    }
  }
}

// CHANGEMENT: Export d'une instance unique (Singleton) pour une meilleure performance.
const cinetPayService = new CinetPayService();
export default cinetPayService;
