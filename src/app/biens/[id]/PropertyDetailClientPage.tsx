// src/app/biens/[id]/PropertyDetailClientPage.tsx
'use client'; // Indique que c'est un Composant Client

import { useState, useEffect } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ImageGallery } from '@/components/image-gallery';
import { AgentContactForm } from '@/components/agent-contact-form';
import { VisitRequestForm } from '@/components/VisitRequestForm';
import { SimilarProperties } from '@/components/similar-properties';
import { VirtualTour } from '@/components/VirtualTour';
import { Map } from '@/components/Map';
import { ShareButtons } from '@/components/ShareButtons';
import { Tables } from '@/types/supabase';
import { Badge } from '@/components/ui/badge';
import { DoorOpen, Bath, SquareM, Phone } from 'lucide-react';

// On redéfinit le type ici pour que le composant soit autonome
type Property = Tables<'properties'> & {
  users: Tables<'users'> | null;
  property_types: Tables<'property_types'> | null;
  virtual_tours: Tables<'virtual_tours'>[] | null;
};

// Le composant reçoit la propriété en tant que prop
export default function PropertyDetailClientPage({ property }: { property: Property }) {
  const [showAgentPhone, setShowAgentPhone] = useState(false);

  useEffect(() => {
    const checkFormSuccess = () => {
      if (typeof window !== 'undefined') {
        const formSuccess = localStorage.getItem(`form_success_${property.id}`);
        if (formSuccess === 'true') {
          setShowAgentPhone(true);
        } else {
          setShowAgentPhone(false);
        }
      }
    };
    
    // Vérifier au chargement
    checkFormSuccess();

    // Écouter les changements de localStorage (pour les autres onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `form_success_${property.id}`) {
        checkFormSuccess();
      }
    };
    
    // Écouter l'événement personnalisé (pour la même page)
    const handleFormSuccess = (e: CustomEvent) => {
      if (e.detail.propertyId === property.id) {
        setShowAgentPhone(true);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('formSuccess', handleFormSuccess as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('formSuccess', handleFormSuccess as EventListener);
    };
  }, [property.id]);

  const getMarketingStatus = () => {
    if (property.is_for_rent && property.is_for_sale) return "En Location-Vente";
    if (property.is_for_rent) return "À Louer";
    if (property.is_for_sale) return "À Vendre";
    return "";
  };

  const marketingStatus = getMarketingStatus();
  const images = property.image_paths && property.image_paths.length > 0 ? property.image_paths : ['/fond-appart.jpeg'];
  const agent = property.users; // Agent récupéré côté serveur
  const propertyTypeId = property.property_types?.id ?? '';
  const virtualTourData = property.virtual_tours && property.virtual_tours.length > 0 ? property.virtual_tours[0] : null;

  // CORRECTION: Créer un agent factice seulement si aucun agent n'est trouvé
  const effectiveAgent = agent || (property.agent_id ? {
    id: property.agent_id,
    full_name: 'Agent Immobilier',
    email: 'contact@perfectimmo.com',
    image: null,
    phone_number: null,
    created_at: null,
    email_verified: null,
    is_active: true,
    last_login: null,
    provider: null,
    provider_account_id: null,
    role: 'agent',
    updated_at: null
  } : null);

  // Le JSX est exactement celui que nous avions, mais il est maintenant dans un fichier client dédié
  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-950">
      <Header />
      <main className="flex-grow">
        <div className="w-full">
          <ImageGallery images={images} />
        </div>
        <div className="container mx-auto px-4 mt-[-80px]"> 
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 shadow-xl rounded-lg p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">{property.property_types?.name} {marketingStatus}</h1>
                  <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">{property.city}, {property.address}</p>
                </div>
                <ShareButtons title={property.title} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-6">
                 <Badge variant="secondary" className="flex items-center gap-2 py-2 px-3"><DoorOpen className="h-4 w-4" /> {property.number_of_rooms} Pièces</Badge>
                 <Badge variant="secondary" className="flex items-center gap-2 py-2 px-3"><Bath className="h-4 w-4" /> {property.number_of_bathrooms} Salles de bain</Badge>
                 <Badge variant="secondary" className="flex items-center gap-2 py-2 px-3"><SquareM className="h-4 w-4" /> {property.area_sqm} m²</Badge>
                        {showAgentPhone && effectiveAgent && (
                    <Badge variant="default" className="flex items-center gap-2 py-2 px-3 bg-green-600 hover:bg-green-700">
                        <Phone className="h-4 w-4" /> {effectiveAgent.phone_number || '+225 XX XX XX XX'}
                    </Badge>
                 )}
              </div>
              {virtualTourData && virtualTourData.scenes && (
                <section className="mt-8"><h2 className="text-2xl font-bold mb-4">Visite Virtuelle</h2><div className="overflow-hidden rounded-lg"><VirtualTour scenes={virtualTourData.scenes as object} /></div></section>
              )}
              <section className="mt-8"><h2 className="text-2xl font-bold mb-4">Description</h2><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{property.description}</p></section>
              {property.is_for_rent && (property.advance_rent || property.security_deposit) && (
                <section className="mt-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <h3 className="text-xl font-bold mb-2">Conditions de Location</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-700 dark:text-gray-300">
                        {property.advance_rent && <p><strong>Avance :</strong> {property.advance_rent} mois</p>}
                        {property.security_deposit && <p><strong>Caution :</strong> {property.security_deposit} mois</p>}
                    </div>
                </section>
              )}
              {property.latitude && property.longitude && (
                <section className="mt-8"><h2 className="text-2xl font-bold mb-4">Localisation</h2><div className="overflow-hidden rounded-lg"><Map lat={property.latitude} lng={property.longitude} popupText={property.address} /></div></section>
              )}
            </div>
            <aside className="relative">
              <div className="sticky top-24">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl">
                  <p className="text-3xl font-bold text-green-600 mb-6 text-center">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(property.price)}</p>
                  
                  {effectiveAgent ? (
                    <>
                      <div className="mb-6"><h3 className="text-xl font-bold mb-4 text-center">Demander une visite</h3><VisitRequestForm propertyId={property.id} agentId={effectiveAgent.id} /></div>
                      <hr className="my-6 border-gray-200 dark:border-gray-700" />
                      <div><h3 className="text-xl font-bold mb-4 text-center">Contacter l'agent</h3><AgentContactForm agent={effectiveAgent} propertyId={property.id} /></div>
                    </>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h3 className="text-lg font-semibold mb-2">Informations de contact</h3>
                      <p className="text-gray-600 dark:text-gray-400">Les informations de l'agent ne sont pas disponibles pour le moment.</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Veuillez nous contacter directement pour plus d'informations sur ce bien.</p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-950/50 py-16 mt-16">
          <div className="container mx-auto px-4"><h2 className="text-3xl font-bold text-center mb-8">Biens Similaires</h2><SimilarProperties propertyId={property.id} city={property.city} propertyTypeId={propertyTypeId} price={property.price} area={property.area_sqm}/></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}