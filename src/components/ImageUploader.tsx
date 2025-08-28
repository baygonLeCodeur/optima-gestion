// src/components/ImageUploader.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone, FileWithPath } from 'react-dropzone';
import { Trash2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  onFilesChange: (files: File[]) => void;
  // We can add existing images later for an edit view
}

interface UploadFile {
  file: FileWithPath;
  preview: string;
}

export default function ImageUploader({ onFilesChange }: ImageUploaderProps) {
  const [myFiles, setMyFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
    const newFiles = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
    }));

    setMyFiles(prevFiles => {
        const updatedFiles = [...prevFiles, ...newFiles];
        onFilesChange(updatedFiles.map(f => f.file));
        return updatedFiles;
    });
  }, [onFilesChange]);

  const removeFile = (fileToRemove: UploadFile) => {
    const updatedFiles = myFiles.filter(file => file !== fileToRemove);
    setMyFiles(updatedFiles);
    onFilesChange(updatedFiles.map(f => f.file));
    URL.revokeObjectURL(fileToRemove.preview); // Clean up memory
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.png', '.jpg', '.gif', '.webp'],
    },
  });

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => myFiles.forEach(file => URL.revokeObjectURL(file.preview));
  }, [myFiles]);

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary'}`}>
        <input {...getInputProps()} />
        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
        {isDragActive ? (
          <p className="mt-2 font-semibold">Déposez les fichiers ici...</p>
        ) : (
          <p className="mt-2 text-muted-foreground">Glissez-déposez des images ici, ou cliquez pour les sélectionner</p>
        )}
      </div>

      {myFiles.length > 0 && (
        <div className="space-y-2">
            <h4 className="font-semibold">Aperçu des images sélectionnées :</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {myFiles.map((uploadFile, index) => (
                    <div key={index} className="relative group border rounded-md">
                        <img src={uploadFile.preview} alt={uploadFile.file.name} className="w-full h-32 object-cover rounded-md"/>
                        <div className="absolute top-1 right-1">
                            <Button variant="destructive" size="icon" className="h-7 w-7 opacity-75 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); removeFile(uploadFile); }}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
}
