'use client';

import {
  useEffect,
  useState,
} from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { Tables } from '@/types/supabase';
import { Skeleton } from './ui/skeleton';

export const Testimonials = () => {
  const [testimonials, setTestimonials] = useState<Tables<'testimonials'>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        // La politique RLS filtre déjà pour is_approved = true
        .limit(3);

      if (error) {
        console.error('Error fetching testimonials:', error);
      } else {
        setTestimonials(data);
      }
      setLoading(false);
    };

    fetchTestimonials();
  }, []);

  return (
    <section id="testimonials" className="bg-gray-50 dark:bg-gray-800 py-12 md:py-24">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-10">
          Ce que nos clients disent de nous
        </h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} className="flex flex-col justify-between shadow-lg">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-6" />
                  <div className="flex items-center">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="ml-4 space-y-2">
                      <Skeleton className="h-4 w-[100px]" />
                      <Skeleton className="h-4 w-[70px]" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            testimonials.map((testimonial) => (
              <Card key={testimonial.id} className="flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <p className="text-gray-600 dark:text-gray-300 mb-6 flex-grow">"{testimonial.description}"</p>
                  <div className="flex items-center">
                    <Avatar>
                      <AvatarFallback>{testimonial.avatar_text}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4">
                      <p className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </section>
  );
};