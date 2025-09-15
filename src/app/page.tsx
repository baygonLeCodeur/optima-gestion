// src/app/page.tsx

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, MapPin, Phone } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import Header from '@/components/header';
import Footer from '@/components/footer';
import PropertyCard from '@/components/property-card';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Hero } from '@/components/hero';
import { Tables } from '@/types/supabase';
import { Testimonials } from '@/components/testimonials';
import { PropertyCardType } from '@/types';

const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
  message: z.string().min(10, { message: "Le message doit contenir au moins 10 caractères." }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const mapPropertyData = (property: Tables<'properties'>): PropertyCardType => {
  // Logique corrigée pour les statuts selon les règles définies
  let status = '';
  if (property.is_for_rent && property.is_for_sale) {
    status = 'Location-Vente';
  } else if (property.is_for_rent && !property.is_for_sale) {
    status = 'À Louer';
  } else if (!property.is_for_rent && property.is_for_sale) {
    status = 'À Vendre';
  } else {
    status = 'Statut inconnu';
  }

  const imageUrl = property.image_paths && property.image_paths.length > 0 
      ? property.image_paths[0] 
      : 'https://placehold.co/600x400.png';
  
  return {
    id: property.id,
    type: property.title,
    status: status,
    price: `${new Intl.NumberFormat('fr-FR').format(property.price)} ${property.currency}`,
    address: `${property.address}, ${property.city}`,
    rooms: property.number_of_rooms || 0,
    bathrooms: property.number_of_bathrooms || 0,
    area: property.area_sqm || 0,
    image_url: imageUrl,
    isFeatured: property.is_featured || false,
    dataAiHint: property.description?.substring(0, 100) || '',
    latitude: property.latitude,
    longitude: property.longitude,
  };
};

export default function Home() {
  const { toast } = useToast();
  const [properties, setProperties] = useState<PropertyCardType[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('is_featured', true)
        .limit(6);

      if (error) {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les biens immobiliers.',
          variant: 'destructive',
        });
      } else if (data) {
        setProperties(data.map(mapPropertyData));
      }
      setLoading(false);
    };

    fetchProperties();
  }, [toast]);

  const handleContactSubmit = async (values: ContactFormValues) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Une erreur s'est produite lors de l'envoi.");
      }

      toast({ title: 'Succès', description: 'Votre message a bien été envoyé ! Nous vous contacterons bientôt.' });
      form.reset();
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast({
        title: 'Erreur',
        description: error.message || "Votre message n'a pas pu être envoyé. Veuillez réessayer.",
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen items-center">
      <div className="w-full">
        <Header />
      </div>

      <main className="flex-1">
        <Hero />

        <section id="recent-properties" className="py-12 md:py-24">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-8">Nos biens à la une</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="h-96 bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {properties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            )}
            <div className="text-center mt-12">
              <Button asChild>
                <Link href="/acheter">Voir plus de biens</Link>
              </Button>
            </div>
          </div>
        </section>
        
        <section id="about" className="bg-gray-50 dark:bg-gray-800 py-12 md:py-24">
          <div className="container grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-4">Qui sommes-nous ?</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Votre agence immobilière de confiance en Côte d'Ivoire. Nous mettons notre expertise à votre service pour vous accompagner dans l'achat, la vente ou la location de vos biens immobiliers.
              </p>
              <Button asChild variant="outline">
                <Link href="/a-propos">En savoir plus</Link>
              </Button>
            </div>
            <div className="relative h-80 w-full overflow-hidden rounded-lg shadow-md">
               <Image 
                src="/devant-og.jpg" 
                alt="A propos de nous" 
                fill
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <Testimonials />

        <section id="contact" className="py-12 md:py-24">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-8">Contactez-nous</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4">Nos coordonnées</h3>
                <div className="flex items-center gap-4 mb-4">
                  <MapPin className="h-6 w-6 text-primary" />
                  <span>Abidjan, Côte d'Ivoire</span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <Phone className="h-6 w-6 text-primary" />
                  <span>+225 07 48 01 14 67</span>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="h-6 w-6 text-primary" />
                  <span>contact@optimagestion.net</span>
                </div>
              </div>

              <Card>
                <CardContent className="p-6">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleContactSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Votre nom</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Votre e-mail</FormLabel>
                            <FormControl>
                              <Input placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Votre message</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Bonjour, je suis intéressé par vos services..."
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}