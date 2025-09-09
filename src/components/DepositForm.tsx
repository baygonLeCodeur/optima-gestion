'use client';

import { useState } from 'react';

// Idéalement, ces constantes seraient partagées ou importées
const ACTIVATION_COST = Number(process.env.NEXT_PUBLIC_PROPERTY_ACTIVATION_COST) || 5000;

export function DepositForm() {
  const [amount, setAmount] = useState<number>(ACTIVATION_COST);
  const [paymentMethod, setPaymentMethod] = useState<string>('WAVE');
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Gère la soumission du formulaire de dépôt
  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setTransactionId(null);

    // Validation simple côté client
    if (amount <= 0 || amount % ACTIVATION_COST !== 0) {
      setError(`Le montant doit être un multiple de ${ACTIVATION_COST}.`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/payment/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, payment_method: paymentMethod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue.');
      }

      setMessage('Dépôt initié. Veuillez simuler la confirmation de paiement.');
      setTransactionId(data.deposit.cinetpay_transaction_id);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Simule l'appel du webhook par CinetPay (via Mockoon)
  const handleSimulateWebhook = async () => {
    if (!transactionId) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // L'URL doit correspondre à celle configurée dans Mockoon
      const webhookUrl = 'http://localhost:3001/webhook'; 
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          status: 'completed', // Simuler un paiement réussi
        }),
      });

      if (!response.ok) {
        throw new Error('La simulation du webhook a échoué.');
      }
      
      setMessage('Webhook simulé avec succès ! Votre solde devrait être mis à jour.');
      setTransactionId(null); // Réinitialiser après succès

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Déposer des fonds</h2>
      
      {/* Formulaire de dépôt */}
      <form onSubmit={handleDeposit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
            Montant (multiple de {ACTIVATION_COST})
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            step={ACTIVATION_COST}
            min={ACTIVATION_COST}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
        <div>
          <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
            Méthode de paiement
          </label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="WAVE">WAVE</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="MTN_MONEY">MTN Money</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading || !!transactionId}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {loading ? 'Initiation...' : 'Initier le dépôt'}
        </button>
      </form>

      {/* Section de simulation du Webhook */}
      {transactionId && (
        <div className="mt-6 p-4 border-t border-dashed">
          <p className="text-sm text-gray-600 mb-2">
            Dépôt initié avec ID: <span className="font-mono bg-gray-100 p-1 rounded">{transactionId}</span>
          </p>
          <button
            onClick={handleSimulateWebhook}
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400"
          >
            {loading ? 'Simulation...' : 'Cliquer ici pour simuler le paiement'}
          </button>
        </div>
      )}

      {/* Affichage des messages */}
      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}
