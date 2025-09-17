// lib/cinetpay.ts
import axios from 'axios';
import { CinetPayInitRequest, CinetPayInitResponse, CinetPayVerificationResponse } from '@/types/payment';
import { config } from '@/lib/config';

class CinetPayService {
  private apiKey: string;
  private siteId: string;

  constructor( ) {
    // AJOUT: Vérification que les variables d'environnement sont bien chargées.
    if (!config.cinetpay.apiKey || !config.cinetpay.siteId) {
      throw new Error("Les variables d'environnement CINETPAY_APIKEY et CINETPAY_SITE_ID sont requises.");
    }
    this.apiKey = config.cinetpay.apiKey;
    this.siteId = config.cinetpay.siteId;
  }

  async initializePayment(data: Omit<CinetPayInitRequest, 'apikey' | 'site_id'>): Promise<CinetPayInitResponse> {
    const payload = {
      apikey: this.apiKey,
      site_id: this.siteId,
      ...data,
    };

    // Validation des données critiques avant envoi
    if (!data.notify_url || !data.return_url) {
      throw new Error('Les URLs notify_url et return_url sont obligatoires');
    }

    // Validation que les URLs sont bien formées
    try {
      new URL(data.notify_url);
      new URL(data.return_url);
    } catch (urlError) {
      throw new Error(`URLs invalides - notify_url: ${data.notify_url}, return_url: ${data.return_url}`);
    }

    try {
      console.log('CinetPay payload:', {
        ...payload,
        apikey: '[MASKED]' // Masquer la clé API dans les logs
      });
      
      const response = await axios.post<CinetPayInitResponse>(`${config.cinetpay.apiUrl}/payment`, payload, {
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (error) {
      // CHANGEMENT: Gestion d'erreur améliorée pour logger les détails de l'API.
      if (axios.isAxiosError(error) && error.response) {
        console.error('CinetPay API Error Response:', error.response.data);
        console.error('CinetPay Request payload:', {
          ...payload,
          apikey: '[MASKED]'
        });
        throw new Error(`Erreur API CinetPay: ${error.response.data.description || error.response.data.message || error.message}`);
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
      const response = await axios.post<CinetPayVerificationResponse>(`${config.cinetpay.apiUrl}/payment/check`, payload, {
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
