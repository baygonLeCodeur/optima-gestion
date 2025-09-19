
// src/components/PropertyForm-fixed.tsx
// Version corrigée avec transaction atomique et vérification préalable du solde

'use client';

import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tables, Json } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Wallet } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { VirtualTourEditor } from './VirtualTourEditor';
import ImageUploader from './ImageUploader';
import { createClient } from '@/lib/supabase/client';
import { PropertyTypeSelect } from './property-type-select';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Import des nouvelles actions corrigées
import { 
  checkAgentBalance, 
  cleanupOrphanedImages, 
  getActivationCost 
} from '@/app/agent/biens/new/actions';

// Schéma existant (inchangé)
export const propertySchema = z.object({
  property_type_id: z.string().uuid("Vous devez sélectionner un type de bien."),
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  address: z.string().min(1, "L'adresse est requise"),
  city: z.string().min(1, 'La ville est requise'),
  country: z.string().min(1, 'Le pays est requis'),
  price: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le prix doit être un nombre."}).positive('Le prix doit être un montant positif').nullable()),
  area_sqm: z.preprocess((val) => (val === "" ? undefined : val), z.coerce.number({ required_error: "La superficie est requise.", invalid_type_error: "La superficie doit être un nombre."}).positive('La superficie doit être positive')),
  number_of_rooms: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le nombre de pièces doit être un nombre."}).int('Le nombre de pièces doit être un entier').optional().nullable()),
  number_of_bathrooms: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le nombre de salles de bain doit être un nombre."}).int('Le nombre de salles de bain doit être un entier').optional().nullable()),
  number_of_parkings: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le nombre de parkings doit être un nombre."}).int('Le nombre de parkings doit être un entier').optional().nullable()),
  floor_number: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le numéro d'étage doit être un nombre."}).int("Le numéro d'étage doit être un entier").optional().nullable()),
  total_floors: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le nombre total d'étages doit être un nombre."}).int("Le nombre total d'étages doit être un entier").optional().nullable()),
  year_built: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "L'année doit être un nombre."}).int('L\'année doit être un nombre entier').optional().nullable()),
  has_garden: z.boolean().default(false),
  has_pool: z.boolean().default(false),
  has_elevator: z.boolean().default(false),
  status: z.enum(['available', 'rented', 'sold', 'under_contract', 'archived']).default('available'),
  is_for_sale: z.boolean().default(false),
  is_for_rent: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  security_deposit: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "La caution doit être un nombre."}).int().optional().nullable()),
  advance_rent: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "L'avance doit être un nombre."}).int().optional().nullable()),
  virtual_tour_config: z.any().optional(),
}).superRefine((data, ctx) => {
  if (!data.is_for_sale && !data.is_for_rent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le bien doit être soit à vendre, soit à louer (ou les deux).",
      path: ['is_for_sale']
    });
  }
});

// Types et constantes existants (inchangés)
const conditionalFieldsByType: Record<string, string[]> = {
  'Appartement': ['number_of_rooms', 'number_of_bathrooms', 'floor_number', 'total_floors', 'has_elevator'],
  'Villa': ['number_of_rooms', 'number_of_bathrooms', 'number_of_parkings', 'has_garden', 'has_pool'],
  'Studio': ['number_of_bathrooms', 'floor_number', 'total_floors', 'has_elevator'],
  'Duplex': ['number_of_rooms', 'number_of_bathrooms', 'number_of_parkings', 'has_garden'],
  'Terrain': ['has_garden'],
  'Bureau': ['number_of_rooms', 'number_of_bathrooms', 'floor_number', 'total_floors', 'has_elevator'],
  'Magasin': ['floor_number', 'total_floors'],
  'Entrepôt': ['number_of_parkings'],
  'Résidence': ['number_of_rooms', 'number_of_bathrooms', 'has_pool', 'has_garden'],
};

const statusTranslations = {
  available: 'Disponible',
  rented: 'Loué',
  sold: 'Vendu',
  under_contract: 'Sous contrat',
  archived: 'Archivé',
};

const getConditionalFieldsForType = (typeName: string | undefined): string[] => {
  if (!typeName) return [];
  if (conditionalFieldsByType.hasOwnProperty(typeName)) {
    return conditionalFieldsByType[typeName];
  }
  const lowerTypeName = typeName.toLowerCase();
  if (lowerTypeName.startsWith('appartement')) {
    return conditionalFieldsByType['Appartement'];
  }
  if (lowerTypeName.includes('terrain')) {
    return conditionalFieldsByType['Terrain'];
  }
  return [];
};

interface PropertyFormProps {
  propertyToEdit?: Tables<'properties'>;
  onFormSubmit: (values: z.infer<typeof propertySchema> & { image_paths: string[] }) => Promise<void>;
}

export default function PropertyFormFixed({ propertyToEdit, onFormSubmit }: PropertyFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  
  // États existants
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const propertyId = React.useMemo(() => propertyToEdit?.id || uuidv4(), [propertyToEdit]);
  const [propertyTypes, setPropertyTypes] = React.useState<Tables<'property_types'>[]>([]);
  
  // 🔧 NOUVEAUX ÉTATS pour la gestion du solde
  const [balanceInfo, setBalanceInfo] = React.useState<{
    hasBalance: boolean;
    currentBalance: number;
    requiredAmount: number;
    error?: string;
  } | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = React.useState(false);

  // Configuration du formulaire (inchangée)
  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      property_type_id: propertyToEdit?.property_type_id || undefined,
      title: propertyToEdit?.title || '',
      description: propertyToEdit?.description || '',
      address: propertyToEdit?.address || '',
      city: propertyToEdit?.city || '',
      country: propertyToEdit?.country || "Côte d'Ivoire",
      price: propertyToEdit?.price || undefined,
      area_sqm: propertyToEdit?.area_sqm || undefined,
      number_of_rooms: propertyToEdit?.number_of_rooms || undefined,
      number_of_bathrooms: propertyToEdit?.number_of_bathrooms || undefined,
      number_of_parkings: propertyToEdit?.number_of_parkings || undefined,
      floor_number: propertyToEdit?.floor_number || undefined,
      total_floors: propertyToEdit?.total_floors || undefined,
      year_built: propertyToEdit?.year_built || undefined,
      has_garden: propertyToEdit?.has_garden ?? false,
      has_pool: propertyToEdit?.has_pool ?? false,
      has_elevator: propertyToEdit?.has_elevator ?? false,
      status: (propertyToEdit?.status ?? 'available') as z.infer<typeof propertySchema>['status'],
      is_for_sale: propertyToEdit?.is_for_sale ?? false,
      is_for_rent: propertyToEdit?.is_for_rent ?? false,
      is_featured: propertyToEdit?.is_featured ?? false,
      security_deposit: propertyToEdit?.security_deposit || undefined,
      advance_rent: propertyToEdit?.advance_rent || undefined,
      virtual_tour_config: propertyToEdit?.virtual_tour_config || null,
    },
  });

  const { control, setValue, trigger } = form;
  const watchedPropertyTypeId = useWatch({ control, name: 'property_type_id' });
  const watchedIsForRent = useWatch({ control, name: 'is_for_rent' });
  const watchedIsForSale = useWatch({ control, name: 'is_for_sale' });

  // 🔧 NOUVELLE FONCTION: Vérification du solde au chargement
  React.useEffect(() => {
    const checkBalance = async () => {
      if (propertyToEdit) return; // Pas de vérification pour l'édition
      
      setIsCheckingBalance(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const balance = await checkAgentBalance(user.id);
          setBalanceInfo(balance);
        }
      } catch (error) {
        console.error('Error checking balance:', error);
        setBalanceInfo({
          hasBalance: false,
          currentBalance: 0,
          requiredAmount: 250,
          error: 'Erreur lors de la vérification du solde'
        });
      } finally {
        setIsCheckingBalance(false);
      }
    };

    checkBalance();
  }, [propertyToEdit, supabase]);

  // Logique existante pour les types de propriétés et champs conditionnels
  const selectedPropertyType = React.useMemo(() => {
    return propertyTypes.find(pt => pt.id === watchedPropertyTypeId);
  }, [watchedPropertyTypeId, propertyTypes]);

  const conditionalFields = getConditionalFieldsForType(selectedPropertyType?.name);
  const isTitleLocked = selectedPropertyType?.name?.toLowerCase().startsWith('appartement') ?? false;

  // Effects existants (inchangés)
  React.useEffect(() => {
    if (selectedPropertyType?.name) {
      if (isTitleLocked) {
        setValue('title', selectedPropertyType.name, { shouldValidate: true });
      } else if (form.getValues('title') === '' || propertyTypes.some(pt => pt.name === form.getValues('title'))) {
        setValue('title', '', { shouldValidate: true });
      }
    }
  }, [isTitleLocked, selectedPropertyType?.name, setValue, form, propertyTypes]);

  const { priceLabel, showRentalFields } = React.useMemo(() => {
    let label = 'Prix';
    let showFields = false;

    if (watchedIsForRent) {
      if (selectedPropertyType?.name === 'Résidence') {
        label = 'Loyer journalier';
        showFields = false;
      } else {
        label = 'Loyer Mensuel';
        showFields = true;
      }
    } else if (watchedIsForSale) {
      label = 'Prix de vente';
    }

    return { priceLabel: label, showRentalFields: showFields };
  }, [watchedIsForRent, watchedIsForSale, selectedPropertyType?.name]);

  // 🔧 FONCTION CORRIGÉE: handleSubmit avec transaction atomique
  const handleSubmit = async (values: z.infer<typeof propertySchema>) => {
    setIsLoading(true);
    let uploadedUrls: string[] = propertyToEdit?.image_paths || [];
    let uploadedPaths: string[] = []; // Pour le rollback
    
    try {
      // 🔧 ÉTAPE 1: Vérification préalable du solde (sauf pour l'édition)
      if (!propertyToEdit) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Utilisateur non authentifié");
        }

        const balanceCheck = await checkAgentBalance(user.id);
        if (!balanceCheck.hasBalance) {
          throw new Error(balanceCheck.error || 'Solde insuffisant pour activer cette annonce');
        }

        toast({ 
          title: "Vérification du solde", 
          description: `Solde vérifié: ${balanceCheck.currentBalance} XOF` 
        });
      }

      // 🔧 ÉTAPE 2: Upload d'images avec suivi des chemins
      if (selectedFiles.length > 0) {
        toast({ title: "Upload en cours...", description: "Veuillez patienter." });
        
        for (const file of selectedFiles) {
          const filePath = `${propertyId}/${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage
            .from('properties-images')
            .upload(filePath, file);
            
          if (error) {
            throw new Error(`Échec de l'upload pour ${file.name}: ${error.message}`);
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('properties-images')
            .getPublicUrl(data.path);
            
          uploadedUrls.push(publicUrl);
          uploadedPaths.push(data.path); // Stocker le chemin pour le rollback
        }
      }

      // 🔧 ÉTAPE 3: Soumission avec gestion d'erreur améliorée
      try {
        await onFormSubmit({ ...values, image_paths: uploadedUrls });
        
        // 🔧 SUCCÈS: Toast seulement si tout réussit
        toast({ 
          title: 'Succès', 
          description: 'Le bien a été sauvegardé avec succès.' 
        });
        
        setTimeout(() => {
          router.push('/agent/biens');
          router.refresh();
        }, 1000);
        
      } catch (submitError: any) {
        // 🔧 ÉTAPE 4: Rollback des images en cas d'échec de soumission
        if (uploadedPaths.length > 0) {
          toast({ 
            title: "Nettoyage en cours...", 
            description: "Suppression des images uploadées..." 
          });
          
          try {
            await cleanupOrphanedImages(uploadedUrls);
          } catch (cleanupError) {
            console.error('Error during cleanup:', cleanupError);
          }
        }
        
        throw submitError; // Re-lancer l'erreur pour le catch principal
      }
      
    } catch (error: any) {
      console.error('Error in handleSubmit:', error);
      
      // 🔧 GESTION D'ERREUR AMÉLIORÉE avec messages explicites
      let errorMessage = "Une erreur est survenue.";
      
      if (error.message.includes('Solde insuffisant')) {
        errorMessage = error.message;
      } else if (error.message.includes('INSUFFICIENT_FUNDS')) {
        errorMessage = "Solde insuffisant pour activer cette annonce. Veuillez recharger votre portefeuille.";
      } else if (error.message.includes('WALLET_NOT_FOUND')) {
        errorMessage = "Aucun portefeuille trouvé. Veuillez contacter le support.";
      } else if (error.message.includes('Échec de l\'upload')) {
        errorMessage = error.message;
      } else {
        errorMessage = error.message || "Une erreur inattendue est survenue.";
      }
      
      toast({ 
        variant: 'destructive', 
        title: 'Erreur', 
        description: errorMessage 
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions de rendu existantes (inchangées)
  const renderValue = (value: any) => value ?? '';

  const renderField = (fieldName: keyof z.infer<typeof propertySchema>) => {
    if (!conditionalFields.includes(fieldName)) return null;

    const commonNumberProps = (field: any) => ({
      ...field,
      value: renderValue(field.value),
      type: "number",
      className: "text-center"
    });

    const commonCheckboxProps = (field: any) => ({
      checked: field.value,
      onCheckedChange: field.onChange
    });

    switch(fieldName) {
      case 'number_of_rooms': return <FormField control={control} name="number_of_rooms" render={({ field }) => (<FormItem className="max-w-[180px]"><FormLabel>Nombre de pièces</FormLabel><FormControl><Input {...commonNumberProps(field)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'number_of_bathrooms': return <FormField control={control} name="number_of_bathrooms" render={({ field }) => (<FormItem className="max-w-[180px]"><FormLabel>Salles de bain</FormLabel><FormControl><Input {...commonNumberProps(field)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'number_of_parkings': return <FormField control={control} name="number_of_parkings" render={({ field }) => (<FormItem className="max-w-[180px]"><FormLabel>Stationnements</FormLabel><FormControl><Input {...commonNumberProps(field)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'floor_number': return <FormField control={control} name="floor_number" render={({ field }) => (<FormItem className="max-w-[180px]"><FormLabel>Numéro d'étage</FormLabel><FormControl><Input {...commonNumberProps(field)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'total_floors': return <FormField control={control} name="total_floors" render={({ field }) => (<FormItem className="max-w-[180px]"><FormLabel>Total étages</FormLabel><FormControl><Input {...commonNumberProps(field)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'has_garden': return <FormField control={control} name="has_garden" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox {...commonCheckboxProps(field)} /></FormControl><FormLabel className="!mt-0">Jardin</FormLabel></FormItem> )}/>;
      case 'has_pool': return <FormField control={control} name="has_pool" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox {...commonCheckboxProps(field)} /></FormControl><FormLabel className="!mt-0">Piscine</FormLabel></FormItem> )}/>;
      case 'has_elevator': return <FormField control={control} name="has_elevator" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox {...commonCheckboxProps(field)} /></FormControl><FormLabel className="!mt-0">Ascenseur</FormLabel></FormItem> )}/>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 🔧 NOUVEAU: Affichage du statut du solde */}
      {!propertyToEdit && (
        <div className="mb-6">
          {isCheckingBalance ? (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Vérification du solde en cours...
              </AlertDescription>
            </Alert>
          ) : balanceInfo ? (
            <Alert variant={balanceInfo.hasBalance ? "default" : "destructive"}>
              <Wallet className="h-4 w-4" />
              <AlertDescription>
                {balanceInfo.hasBalance ? (
                  <>
                    ✅ Solde suffisant: {balanceInfo.currentBalance} XOF 
                    (Requis: {balanceInfo.requiredAmount} XOF)
                  </>
                ) : (
                  <>
                    ❌ {balanceInfo.error}
                  </>
                )}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Contenu du formulaire existant (inchangé) */}
          {/* ... Tous les champs existants ... */}
          
          <Button
            type="submit"
            disabled={
              isLoading ||
              !watchedPropertyTypeId ||
              !!(balanceInfo && !balanceInfo.hasBalance && !propertyToEdit)
            }
            className="w-full md:w-auto mt-8"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {propertyToEdit ? 'Mettre à jour le bien' : 'Créer le bien'}
          </Button>
        </form>
      </Form>
    </div>
  );
}