// src/app/agent/biens/new/actions-fixed.ts
'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { propertySchema } from '@/components/PropertyForm';
import * as z from 'zod';
import { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type ActionValues = z.infer<typeof propertySchema> & { image_paths: string[] };

// Constante pour le coût d'activation (doit correspondre au trigger SQL)
const ACTIVATION_COST = Number(process.env.NEXT_PUBLIC_PROPERTY_ACTIVATION_COST) || 250;

/**
 * Vérifie si l'agent a un solde suffisant pour activer une annonce
 */
export async function checkAgentBalance(agentId: string): Promise<{
  hasBalance: boolean;
  currentBalance: number;
  requiredAmount: number;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  
  try {
    const { data: wallet, error } = await supabase
      .from('agent_wallets')
      .select('balance')
      .eq('agent_id', agentId)
      .single();

    if (error) {
      console.error('Error fetching wallet:', error);
      return {
        hasBalance: false,
        currentBalance: 0,
        requiredAmount: ACTIVATION_COST,
        error: 'Impossible de vérifier le solde du portefeuille'
      };
    }

    if (!wallet) {
      return {
        hasBalance: false,
        currentBalance: 0,
        requiredAmount: ACTIVATION_COST,
        error: 'Aucun portefeuille trouvé pour cet agent'
      };
    }

    const hasBalance = wallet.balance >= ACTIVATION_COST;
    
    return {
      hasBalance,
      currentBalance: wallet.balance,
      requiredAmount: ACTIVATION_COST,
      error: hasBalance ? undefined : `Solde insuffisant. Solde actuel: ${wallet.balance} XOF, Requis: ${ACTIVATION_COST} XOF`
    };
  } catch (error) {
    console.error('Unexpected error checking balance:', error);
    return {
      hasBalance: false,
      currentBalance: 0,
      requiredAmount: ACTIVATION_COST,
      error: 'Erreur inattendue lors de la vérification du solde'
    };
  }
}

/**
 * Nettoie les images orphelines du Storage
 */
export async function cleanupOrphanedImages(imagePaths: string[]): Promise<void> {
  if (imagePaths.length === 0) return;
  
  const supabase = await createSupabaseServerClient();
  
  try {
    // Extraire les chemins relatifs des URLs complètes
    const relativePaths = imagePaths.map(url => {
      if (url.includes('/storage/v1/object/public/properties-images/')) {
        return url.split('/storage/v1/object/public/properties-images/')[1];
      }
      return url; // Si c'est déjà un chemin relatif
    });

    const { error } = await supabase.storage
      .from('properties-images')
      .remove(relativePaths);

    if (error) {
      console.error('Error cleaning up images:', error);
    } else {
      console.log(`Cleaned up ${relativePaths.length} orphaned images`);
    }
  } catch (error) {
    console.error('Unexpected error during cleanup:', error);
  }
}

/**
 * Version corrigée de createPropertyAction avec vérification préalable du solde
 */
export async function createPropertyActionFixed(values: ActionValues) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Utilisateur non authentifié");
  }

  // 🔧 CORRECTION 1: Vérifier le solde AVANT tout traitement
  const balanceCheck = await checkAgentBalance(user.id);
  
  if (!balanceCheck.hasBalance) {
    throw new Error(balanceCheck.error || 'Solde insuffisant pour activer cette annonce');
  }

  const typedSupabase = supabase as unknown as SupabaseClient<Database>;

  // Validation des données (code existant conservé)
  if (values.price == null || values.price <= 0) {
    throw new Error("Le prix est obligatoire et doit être positif.");
  }
  if (values.area_sqm == null || values.area_sqm <= 0) {
    throw new Error("La superficie est obligatoire et doit être positive.");
  }

  // Préparation des données pour l'insertion
  const propertyDataForDb = {
    title: values.title,
    description: values.description,
    price: values.price,
    area_sqm: values.area_sqm,
    address: values.address,
    city: values.city,
    country: values.country,
    property_type_id: values.property_type_id,
    status: values.status,
    is_for_sale: values.is_for_sale,
    is_for_rent: values.is_for_rent,
    is_featured: values.is_featured,
    number_of_rooms: values.number_of_rooms ?? 0,
    number_of_bathrooms: values.number_of_bathrooms ?? 0,
    year_built: values.year_built,
    security_deposit: values.security_deposit,
    advance_rent: values.advance_rent,
    virtual_tour_config: values.virtual_tour_config,
    image_paths: values.image_paths,
    agent_id: user.id,
  };

  try {
    // 🔧 CORRECTION 2: Insertion avec gestion d'erreur améliorée
    const { data, error } = await typedSupabase
      .from('properties')
      .insert([propertyDataForDb])
      .select();

    if (error) {
      console.error('Error creating property:', error);
      
      // 🔧 CORRECTION 3: Nettoyage automatique des images en cas d'échec
      if (values.image_paths && values.image_paths.length > 0) {
        await cleanupOrphanedImages(values.image_paths);
      }
      
      // 🔧 CORRECTION 4: Messages d'erreur explicites
      if (error.message.includes('INSUFFICIENT_FUNDS')) {
        throw new Error(`Solde insuffisant. Solde actuel: ${balanceCheck.currentBalance} XOF, Requis: ${ACTIVATION_COST} XOF`);
      } else if (error.message.includes('WALLET_NOT_FOUND')) {
        throw new Error('Aucun portefeuille trouvé pour votre compte. Veuillez contacter le support.');
      } else {
        throw new Error(`Erreur lors de la création de l'annonce: ${error.message}`);
      }
    }

    return data;
  } catch (error) {
    // 🔧 CORRECTION 5: Nettoyage en cas d'erreur inattendue
    if (values.image_paths && values.image_paths.length > 0) {
      await cleanupOrphanedImages(values.image_paths);
    }
    throw error;
  }
}

/**
 * Fonction utilitaire pour obtenir le coût d'activation
 */
export async function getActivationCost(): Promise<number> {
  return ACTIVATION_COST;
}