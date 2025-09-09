// src/components/PropertyForm.tsx
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
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { VirtualTourEditor } from './VirtualTourEditor';
import ImageUploader from './ImageUploader';
import { createClient } from '@/lib/supabase/client';
import { PropertyTypeSelect } from './property-type-select';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

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
    if (data.status === 'available') {
      if (!data.is_for_sale && !data.is_for_rent) {
          ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: ['is_for_sale'],
              message: 'Un bien "Disponible" doit être marqué comme "À Vendre" et/ou "À Louer".',
          });
      }
    }
    // La validation pour security_deposit et advance_rent est maintenant gérée dynamiquement
});

const statusTranslations: { [key: string]: string } = {
  available: 'Disponible',
  rented: 'Loué',
  sold: 'Vendu',
  under_contract: 'Sous contrat',
  archived: 'Archivé'
};

// Logique d'affichage des champs conditionnels basée sur pageWeb2.html
const conditionalFieldsByType: Record<string, string[]> = {
    'Appartement 2 pièces': ['floor_number', 'has_elevator', 'number_of_parkings'],
    'Appartement 3 pièces': ['floor_number', 'has_elevator', 'number_of_parkings'],
    'Appartement 4 pièces': ['floor_number', 'has_elevator', 'number_of_parkings'],
    'Appartement 5 pièces et plus': ['floor_number', 'has_elevator', 'number_of_parkings'],
    'Maison': ['has_garden', 'number_of_rooms', 'number_of_parkings'],
    'Villa': ['has_pool', 'has_garden', 'number_of_parkings', 'number_of_rooms'],
    'Studio': ['floor_number', 'has_elevator'],
    'Résidence': ['has_elevator', 'number_of_parkings', 'floor_number'],
    'Duplex': ['has_pool', 'number_of_rooms', 'has_elevator', 'number_of_parkings', 'floor_number', 'total_floors'],
    'Triplex': ['has_pool', 'number_of_rooms', 'has_elevator', 'number_of_parkings', 'floor_number', 'total_floors'],
    'Villa basse': ['has_pool', 'has_garden', 'number_of_rooms', 'number_of_parkings'],
    'Villa Duplex': ['has_pool', 'has_garden', 'number_of_rooms', 'number_of_parkings'],
    'Maison de ville': ['number_of_rooms', 'number_of_parkings', 'has_garden'],
    'Chambre': ['floor_number', 'number_of_bathrooms'],
    'Local commercial': ['floor_number', 'number_of_parkings', 'has_elevator'],
    'Penthouse': ['has_pool', 'total_floors', 'number_of_parkings'],
    'Bureau': ['has_elevator', 'floor_number', 'number_of_parkings', 'total_floors'],
    'Magasin': ['floor_number', 'number_of_parkings', 'has_elevator'],
    'Boutique': ['floor_number', 'number_of_parkings', 'has_elevator'],
    'Fonds de commerce': ['floor_number', 'number_of_parkings', 'has_elevator'],
    'Entrepôt': ['floor_number', 'number_of_parkings', 'has_elevator'],
    'Terrain nu': [],
    'Terrain agricole': [],
    // Fallback pour les types génériques de la DB
    'Appartement': ['floor_number', 'has_elevator', 'number_of_parkings', 'number_of_rooms', 'number_of_bathrooms'],
    'Terrain': [],
};

const getConditionalFieldsForType = (typeName: string | undefined): string[] => {
    if (!typeName) return [];
    // Recherche exacte d'abord
    if (conditionalFieldsByType.hasOwnProperty(typeName)) {
        return conditionalFieldsByType[typeName];
    }
    // Logique de fallback pour les types comme "Appartement"
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

export default function PropertyForm({ propertyToEdit, onFormSubmit }: PropertyFormProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
  const propertyId = React.useMemo(() => propertyToEdit?.id || uuidv4(), [propertyToEdit]);
  const [propertyTypes, setPropertyTypes] = React.useState<Tables<'property_types'>[]>([]);

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

  const selectedPropertyType = React.useMemo(() => {
    return propertyTypes.find(pt => pt.id === watchedPropertyTypeId);
  }, [watchedPropertyTypeId, propertyTypes]);

  const conditionalFields = getConditionalFieldsForType(selectedPropertyType?.name);

  const isTitleLocked = selectedPropertyType?.name?.toLowerCase().startsWith('appartement') ?? false;

  React.useEffect(() => {
    if (selectedPropertyType?.name) {
        if (isTitleLocked) {
            setValue('title', selectedPropertyType.name, { shouldValidate: true });
        } else if (form.getValues('title') === '' || propertyTypes.some(pt => pt.name === form.getValues('title'))) {
            // Effacer le titre si l'utilisateur change pour un type non-appartement
            // et que le titre était auto-rempli
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
        showFields = false;
    }
    return { priceLabel: label, showRentalFields: showFields };
  }, [watchedIsForRent, watchedIsForSale, selectedPropertyType?.name]);

  React.useEffect(() => {
    // Valider les champs de location lorsque leur visibilité change
    if (showRentalFields) {
        trigger(['security_deposit', 'advance_rent']);
    }
  }, [showRentalFields, trigger]);


  React.useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        const { data, error } = await supabase.from('property_types').select('*').eq('is_active', true);
        if (error) throw error;
        setPropertyTypes(data || []);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: `Impossible de charger les types de biens: ${error.message}`
        });
      }
    };
    fetchPropertyTypes();
  }, [supabase, toast]);

  const handleSubmit = async (values: z.infer<typeof propertySchema>) => {
    setIsLoading(true);
    let uploadedUrls: string[] = propertyToEdit?.image_paths || [];
    try {
      if (selectedFiles.length > 0) {
        toast({ title: "Upload en cours...", description: "Veuillez patienter." });
        for (const file of selectedFiles) {
          const filePath = `${propertyId}/${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage.from('properties-images').upload(filePath, file);
          if (error) throw new Error(`Échec de l'upload pour ${file.name}: ${error.message}`);
          const { data: { publicUrl } } = supabase.storage.from('properties-images').getPublicUrl(data.path);
          uploadedUrls.push(publicUrl);
        }
      }
      await onFormSubmit({ ...values, image_paths: uploadedUrls });
      toast({ title: 'Succès', description: 'Le bien a été sauvegardé avec succès.' });
      setTimeout(() => {
        router.push('/agent/biens');
        router.refresh();
      }, 1000);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erreur', description: error.message || "Une erreur est survenue." });
    } finally {
      setIsLoading(false);
    }
  };
  
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
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="p-4 border rounded-lg">
          <FormField control={control} name="property_type_id" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base font-semibold">Type de bien</FormLabel>
              <PropertyTypeSelect 
                onValueChange={field.onChange} 
                value={field.value}
                propertyTypes={propertyTypes}
                isLoading={propertyTypes.length === 0}
              />
              <FormMessage />
            </FormItem>
          )} />
        </div>
        
        {watchedPropertyTypeId && (
          <div className="space-y-6">
            {/* Section 1: Champs principaux */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={control} name="title" render={({ field }) => (<FormItem><FormLabel>Titre de l’annonce</FormLabel><FormControl><Input {...field} disabled={isTitleLocked} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={control} name="area_sqm" render={({ field }) => (<FormItem><FormLabel>Superficie (en m²)</FormLabel><FormControl><Input type="number" {...field} value={renderValue(field.value)}/></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={control} name="address" render={({ field }) => (<FormItem><FormLabel>Quartier/Secteur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
                <FormField control={control} name="city" render={({ field }) => (<FormItem><FormLabel>Commune</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>
            </div>

            {/* Section 2: Description */}
            <FormField control={control} name="description" render={({ field }) => (<FormItem><FormLabel>Description (autres détails)</FormLabel><FormControl><Textarea {...field} value={renderValue(field.value)} rows={4} /></FormControl><FormMessage /></FormItem> )}/>

            {/* Section 3: Cases à cocher principales */}
            <div className="flex justify-center items-center gap-8 pt-4">
                <FormField control={control} name="is_for_sale" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0">À vendre</FormLabel></FormItem> )}/>
                <FormField control={control} name="is_for_rent" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0">À louer</FormLabel></FormItem> )}/>
                <FormField control={control} name="is_featured" render={({ field }) => (<FormItem className="flex items-center space-x-2"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="!mt-0">Mettre sur le marché</FormLabel></FormItem> )}/>
            </div>

            {/* Section 4: Prix et champs liés */}
            <div className="flex justify-center items-start gap-6">
                <FormField control={control} name="price" render={({ field }) => (
                    <FormItem className="max-w-[180px]">
                      <FormLabel>{priceLabel}</FormLabel>
                      <FormControl><Input type="number" className="text-center" {...field} value={renderValue(field.value)} /></FormControl>
                      <FormMessage />
                    </FormItem>
                )}/>
                {showRentalFields && (
                    <>
                        <FormField control={control} name="security_deposit" render={({ field }) => (
                            <FormItem className="max-w-[180px]">
                                <FormLabel>Caution</FormLabel>
                                <FormControl><Input type="number" className="text-center" {...field} value={renderValue(field.value)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={control} name="advance_rent" render={({ field }) => (
                            <FormItem className="max-w-[180px]">
                                <FormLabel>Avance</FormLabel>
                                <FormControl><Input type="number" className="text-center" {...field} value={renderValue(field.value)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </>
                )}
            </div>

            <hr className="my-6" />

            {/* Section 5: Champs conditionnels */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 justify-items-center">
                {renderField('number_of_rooms')}
                {renderField('number_of_bathrooms')}
                {renderField('number_of_parkings')}
                {renderField('floor_number')}
                {renderField('total_floors')}
            </div>
            <div className="flex justify-center items-center gap-8 pt-4">
                {renderField('has_garden')}
                {renderField('has_pool')}
                {renderField('has_elevator')}
            </div>
            
            <hr className="my-6" />

            {/* Section 6: Autres détails et Accordéon */}
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger><h3 className="text-lg font-semibold">Autres détails & Statut</h3></AccordionTrigger>
                <AccordionContent className="pt-4 space-y-6">
                  <FormField control={control} name="year_built" render={({ field }) => (<FormItem><FormLabel>Année de construction</FormLabel><FormControl><Input type="number" {...field} value={renderValue(field.value)} /></FormControl><FormMessage /></FormItem> )}/>
                  {propertyToEdit && (
                      <FormField control={control} name="status" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Statut de l'annonce</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                      {Object.entries(statusTranslations).map(([value, label]) => (
                                          <SelectItem key={value} value={value}>{label}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                          </FormItem>
                      )}/>
                  )}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger><h3 className="text-lg font-semibold">Images</h3></AccordionTrigger>
                <AccordionContent className="pt-4">
                  <ImageUploader onFilesChange={setSelectedFiles} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger><h3 className="text-lg font-semibold">Visite Virtuelle (Optionnel)</h3></AccordionTrigger>
                <AccordionContent className="pt-4">
                  <FormField control={control} name="virtual_tour_config" render={({ field }) => {
                    const { data: { publicUrl } } = supabase.storage.from('properties-images').getPublicUrl(`${propertyId}/panoramas`);
                    return (
                      <VirtualTourEditor 
                        initialConfig={field.value as Json} 
                        onChange={field.onChange} 
                        baseImagePath={publicUrl}
                      />
                    );
                  }}/>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        )}
        <Button type="submit" disabled={isLoading || !watchedPropertyTypeId} className="w-full md:w-auto mt-8">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {propertyToEdit ? 'Mettre à jour le bien' : 'Créer le bien'}
        </Button>
      </form>
    </Form>
  );
}
