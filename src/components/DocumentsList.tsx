// src/components/DocumentsList.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { FileText, Download, Eye, Edit } from 'lucide-react';
import { PandaDocSigningModal } from './PandaDocSigningModal';

type Document = Tables<'documents'>;

export const DocumentsList = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [isSigningModalOpen, setIsSigningModalOpen] = useState(false);
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);

    const fetchDocuments = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('client_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDocuments(data || []);
        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: 'Impossible de charger vos documents.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [user, toast]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);
    
    const handleDownload = (filePath: string | null) => {
        if (!filePath) {
             toast({ title: 'Info', description: 'Chemin du fichier non disponible.' });
             return;
        }
        toast({ title: 'Info', description: `Simulation du téléchargement de ${filePath}` });
    }

    const handleView = (url: string | null) => {
        if (url) {
            window.open(url, '_blank');
        } else {
            toast({ title: 'Info', description: 'Aucun aperçu disponible (URL manquante).' });
        }
    }

    const handleOpenSignModal = (docId: string) => {
        setSelectedDocumentId(docId);
        setIsSigningModalOpen(true);
    };

    const handleCloseSignModal = () => {
        setSelectedDocumentId(null);
        setIsSigningModalOpen(false);
    };
    
    const handleDocumentSigned = () => {
        toast({
            title: 'Mise à jour',
            description: 'Mise à jour de la liste des documents...'
        });
        fetchDocuments();
    };

    // --- Rendu des badges de statut (FIXED) ---
    const getStatusBadge = (status: string | null) => {
        switch (status) {
            case 'signed':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">Signé</span>;
            case 'pending_signature':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">En attente</span>;
            case 'archived':
                 return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">Archivé</span>;
            default:
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-500 bg-gray-100">{status || 'N/A'}</span>;
        }
    };

    if (loading) {
        return <Skeleton className="h-40 w-full" />;
    }
    
    if (documents.length === 0) {
        return (
            <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Aucun document</AlertTitle>
                <AlertDescription>Vous n'avez aucun document pour le moment.</AlertDescription>
            </Alert>
        );
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map(doc => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">{doc.title}</TableCell>
                            <TableCell>{doc.document_type}</TableCell>
                            <TableCell>{new Date(doc.created_at!).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>{getStatusBadge(doc.signature_status)}</TableCell>
                            <TableCell className="text-right space-x-2">
                               <Button variant="outline" size="icon" onClick={() => handleView(doc.file_path)} title="Visualiser">
                                    <Eye className="h-4 w-4" />
                               </Button>
                               <Button variant="outline" size="icon" onClick={() => handleDownload(doc.file_path)} title="Télécharger">
                                    <Download className="h-4 w-4" />
                               </Button>
                               {doc.signature_status === 'pending_signature' && (
                                 <Button variant="default" size="sm" onClick={() => handleOpenSignModal(doc.id)} title="Signer le document">
                                    <Edit className="h-4 w-4 mr-2" />
                                    Signer
                                 </Button>
                               )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            <PandaDocSigningModal
                isOpen={isSigningModalOpen}
                documentId={selectedDocumentId}
                onClose={handleCloseSignModal}
                onSigned={handleDocumentSigned}
            />
        </>
    );
};
