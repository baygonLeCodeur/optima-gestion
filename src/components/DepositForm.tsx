'use client';

import { useState } from 'react';

const ACTIVATION_COST = Number(process.env.NEXT_PUBLIC_PROPERTY_ACTIVATION_COST) || 5000;

export function DepositForm() {
  const [amount, setAmount] = useState<number>(ACTIVATION_COST);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (amount <= 0 || amount % ACTIVATION_COST !== 0) {
      setError(`Le montant doit être un multiple de ${ACTIVATION_COST}.`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const result = await response.json();

      if (result.code === '201' && result.data?.payment_url) {
        // Redirection vers la page de paiement de CinetPay
        if (typeof window !== 'undefined') {
          window.location.href = result.data.payment_url;
        }
      } else {
        setError(result.description || result.error || 'Erreur lors de l\'initialisation du paiement.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError('Une erreur de connexion est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Déposer des fonds</h2>
      
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
        
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {loading ? 'Traitement...' : 'Procéder au paiement'}
        </button>
      </form>
    </div>
  );
}
