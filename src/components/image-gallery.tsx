"use client";

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(images[0]);

  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <p className="text-gray-500">Aucune image disponible</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div>
        <Image
          src={selectedImage}
          alt="Image du bien"
          width={1200}
          height={800}
          className="object-cover rounded-lg aspect-video"
        />
      </div>
      <div className="grid grid-cols-5 gap-4">
        {images.map((image, index) => (
          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            aria-label={`Afficher l'image ${index + 1}`}
            className={cn(
              'rounded-lg overflow-hidden border-2 transition-all',
              selectedImage === image ? 'border-green-500' : 'border-transparent'
            )}
          >
            <Image
              src={image}
              alt={`Miniature ${index + 1}`}
              width={200}
              height={150}
              className="object-cover aspect-video"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
