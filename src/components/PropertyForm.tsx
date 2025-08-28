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
  price: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le prix doit être un nombre."}).optional().nullable()),
  area_sqm: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "La superficie doit être un nombre."}).positive('La superficie doit être positive').optional().nullable()),
  number_of_rooms: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le nombre de pièces doit être un nombre."}).int('Le nombre de pièces doit être un entier').optional().nullable()),
  number_of_bathrooms: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "Le nombre de salles de bain doit être un nombre."}).int('Le nombre de salles de bain doit être un entier').optional().nullable()),
  year_built: z.preprocess((val) => (val === "" ? null : val), z.coerce.number({ invalid_type_error: "L'année doit être un nombre."}).int('L\'année doit être un nombre entier').optional().nullable()),
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
    if (data.price == null || data.price <= 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['price'],
            message: 'Le prix est requis et doit être un montant positif.',
        });
    }
    if (data.is_for_rent && data.status === 'available') {
        if (data.security_deposit == null) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['security_deposit'], message: 'La caution est requise.' });
        }
        if (data.advance_rent == null) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['advance_rent'], message: 'L\'avance sur loyer est requise.' });
        }
    }
});

const statusTranslations: { [key: string]: string } = {
  available: 'Disponible',
  rented: 'Loué',
  sold: 'Vendu',
  under_contract: 'Sous contrat',
  archived: 'Archivé'
};

const getVisibleFields = (typeName: string | undefined): string[] => {
    if (!typeName) return [];
    const name = typeName.toLowerCase();
    const baseFields = ['title', 'description', 'address', 'city', 'country', 'price'];
    const residentialTypes = ['studio', 'appartement 2 pièces', 'appartement 3 pièces', 'appartement 4 pièces', 'appartement 5 pièces et plus', 'penthouse', 'duplex', 'triplex', 'villa basse', 'villa duplex', 'maison de ville', 'immeuble', 'chambre'];
    const commercialTypes = ['bureau', 'magasin', 'boutique', 'local commercial', 'fonds de commerce'];
    const industrialTypes = ['entrepôt', 'hangar', 'local industriel'];
    const landTypes = ['terrain nu', 'terrain agricole', 'terrain industriel', 'lotissement'];
    const parkingTypes = ['parking', 'garage / box'];
    const residentialKit = ['area_sqm', 'number_of_rooms', 'number_of_bathrooms', 'year_built'];
    const commercialKit = ['area_sqm', 'number_of_rooms', 'year_built'];
    const industrialAndLandKit = ['area_sqm'];
    if (residentialTypes.includes(name)) return [...baseFields, ...residentialKit];
    if (commercialTypes.includes(name)) return [...baseFields, ...commercialKit];
    if (industrialTypes.includes(name) || landTypes.includes(name)) return [...baseFields, ...industrialAndLandKit];
    if (parkingTypes.includes(name)) return baseFields;
    return baseFields;
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
      year_built: propertyToEdit?.year_built || undefined,
  status: (propertyToEdit?.status ?? 'available') as z.infer<typeof propertySchema>['status'],
      is_for_sale: propertyToEdit?.is_for_sale ?? false,
      is_for_rent: propertyToEdit?.is_for_rent ?? false,
      is_featured: propertyToEdit?.is_featured ?? false,
      security_deposit: propertyToEdit?.security_deposit || undefined,
      advance_rent: propertyToEdit?.advance_rent || undefined,
      virtual_tour_config: propertyToEdit?.virtual_tour_config || null,
    },
  });

  const { control, setValue } = form;
  const watchedStatus = useWatch({ control, name: 'status' });
  const watchedPropertyTypeId = useWatch({ control, name: 'property_type_id' });
  const watchedIsForRent = useWatch({ control, name: 'is_for_rent' });
  const watchedIsForSale = useWatch({ control, name: 'is_for_sale' });

  const selectedPropertyTypeName = React.useMemo(() => {
    return propertyTypes.find(pt => pt.id === watchedPropertyTypeId)?.name;
  }, [watchedPropertyTypeId, propertyTypes]);

  const visibleFields = getVisibleFields(selectedPropertyTypeName);

  const priceLabel = React.useMemo(() => {
    if (watchedIsForRent) return "Loyer Mensuel (FCFA)";
    if (watchedIsForSale) return "Prix de vente (FCFA)";
    return "Prix (FCFA)";
  }, [watchedIsForRent, watchedIsForSale]);

  React.useEffect(() => {
    if (watchedStatus !== 'available') {
        setValue('is_for_sale', false, { shouldValidate: true });
        setValue('is_for_rent', false, { shouldValidate: true });
    }
  }, [watchedStatus, setValue]);

  React.useEffect(() => {
    const fetchPropertyTypes = async () => {
      try {
        console.log('🔍 Récupération des types de biens...');
        const { data, error } = await supabase.from('property_types').select('*').eq('is_active', true);
        
        if (error) {
          console.error('❌ Erreur lors de la récupération des types de biens:', error);
          toast({ 
            variant: 'destructive', 
            title: 'Erreur', 
            description: `Impossible de charger les types de biens: ${error.message}` 
          });
          return;
        }
        
        console.log('✅ Types de biens récupérés:', data);
        if (data && data.length > 0) {
          setPropertyTypes(data);
        } else {
          console.warn('⚠️ Aucun type de bien actif trouvé');
          toast({ 
            variant: 'destructive', 
            title: 'Attention', 
            description: 'Aucun type de bien actif trouvé dans la base de données' 
          });
        }
      } catch (err) {
        console.error('❌ Erreur inattendue:', err);
        toast({ 
          variant: 'destructive', 
          title: 'Erreur', 
          description: 'Erreur inattendue lors du chargement des types de biens' 
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

  const renderField = (fieldName: string) => {
    if (!visibleFields.includes(fieldName)) return null;
    if (fieldName === 'price') {
      return (
        <FormField control={control} name="price" render={({ field }) => (
          <FormItem>
            <FormLabel>{priceLabel}</FormLabel>
            <FormControl><Input type="number" {...field} value={renderValue(field.value)} /></FormControl>
            <FormMessage />
          </FormItem>
        )}/>
      );
    }
    switch(fieldName) {
      case 'title': return <FormField control={control} name="title" render={({ field }) => (<FormItem><FormLabel>Titre de l'annonce</FormLabel><FormControl><Input placeholder="Ex: Belle villa avec piscine" {...field} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'description': return <FormField control={control} name="description" render={({ field }) => (<FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Décrivez le bien en détail..." {...field} value={renderValue(field.value)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'address': return <FormField control={control} name="address" render={({ field }) => (<FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'city': return <FormField control={control} name="city" render={({ field }) => (<FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'country': return <FormField control={control} name="country" render={({ field }) => (<FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'area_sqm': return <FormField control={control} name="area_sqm" render={({ field }) => (<FormItem><FormLabel>Superficie (m²)</FormLabel><FormControl><Input type="number" {...field} value={renderValue(field.value)}/></FormControl><FormMessage /></FormItem> )}/>;
      case 'number_of_rooms': return <FormField control={control} name="number_of_rooms" render={({ field }) => (<FormItem><FormLabel>Nombre de pièces</FormLabel><FormControl><Input type="number" {...field} value={renderValue(field.value)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'number_of_bathrooms': return <FormField control={control} name="number_of_bathrooms" render={({ field }) => (<FormItem><FormLabel>Nombre de salles de bain</FormLabel><FormControl><Input type="number" {...field} value={renderValue(field.value)} /></FormControl><FormMessage /></FormItem> )}/>;
      case 'year_built': return <FormField control={control} name="year_built" render={({ field }) => (<FormItem><FormLabel>Année de construction</FormLabel><FormControl><Input type="number" {...field} value={renderValue(field.value)} /></FormControl><FormMessage /></FormItem> )}/>;
      default: return null;
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <div className="p-4 border rounded-lg">
          <FormField control={control} name="property_type_id" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-lg font-semibold">Quel type de bien annoncez-vous ?</FormLabel>
              <PropertyTypeSelect 
                onValueChange={field.onChange} 
                value={field.value}
                propertyTypes={propertyTypes}
                isLoading={false}
              />
              <FormMessage />
            </FormItem>
          )} />
        </div>
        {watchedPropertyTypeId && (
          <>
            <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger><h3 className="text-lg font-semibold">Détails de l'annonce</h3></AccordionTrigger>
                <AccordionContent className="pt-4 space-y-8">
                  {renderField('title')}
                  {renderField('description')}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {renderField('address')}
                    {renderField('city')}
                    {renderField('country')}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {renderField('area_sqm')}
                    {renderField('number_of_rooms')}
                    {renderField('number_of_bathrooms')}
                  </div>
                  {renderField('year_built')}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start pt-4">
                    {propertyToEdit && (
                      <FormField control={control} name="status" render={({ field }) => (
                          <FormItem>
                              <FormLabel>Statut de l'annonce</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                      <SelectTrigger><SelectValue placeholder="Sélectionnez un statut" /></SelectTrigger>
                                  </FormControl>
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
                    <div className="space-y-4">
                        <FormField control={control} name="is_for_sale" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={watchedStatus !== 'available'}/></FormControl>
                                <FormLabel className={watchedStatus !== 'available' ? 'text-gray-400 cursor-not-allowed' : ''}>À Vendre</FormLabel>
                            </FormItem>
                        )}/>
                        <FormField control={control} name="is_for_rent" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={watchedStatus !== 'available'}/></FormControl>
                                <FormLabel className={watchedStatus !== 'available' ? 'text-gray-400 cursor-not-allowed' : ''}>À Louer</FormLabel>
                            </FormItem>
                        )}/>
                        <FormField control={control} name="is_featured" render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel>Mettre en avant (Featured)</FormLabel>
                            </FormItem>
                        )}/>
                    </div>
                  </div>
                  {renderField('price')}
                  {watchedIsForRent && (
                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-lg mt-6">
                      <h4 className="font-semibold mb-4">Conditions de location</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={control} name="security_deposit" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Caution (en mois)</FormLabel>
                                <FormControl><Input type="number" {...field} value={renderValue(field.value)} /></FormControl>
                                <FormDescription>Ex: 2</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField control={control} name="advance_rent" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Avance (en mois)</FormLabel>
                                <FormControl><Input type="number" {...field} value={renderValue(field.value)} /></FormControl>
                                <FormDescription>Ex: 3</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}/>
                      </div>
                    </div>
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
                  <FormField control={control} name="virtual_tour_config" render={({ field }) => (
                    <VirtualTourEditor initialConfig={field.value as Json} onChange={field.onChange} baseImagePath={`/properties/${propertyId}/panoramas`}/>
                  )}/>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}
        <Button type="submit" disabled={isLoading || !watchedPropertyTypeId} className="w-full md:w-auto mt-8">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {propertyToEdit ? 'Mettre à jour le bien' : 'Créer le bien'}
        </Button>
      </form>
    </Form>
  );
}