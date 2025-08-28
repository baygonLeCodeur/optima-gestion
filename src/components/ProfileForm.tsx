// src/components/ProfileForm.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const ProfileForm = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata.full_name || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleUpdateProfile = async (e: FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);

        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({
            data: { full_name: fullName }
        });

        setLoading(false);

        if (error) {
            toast({
                title: 'Erreur',
                description: "Une erreur est survenue lors de la mise à jour de votre profil.",
                variant: 'destructive',
            });
        } else {
            toast({
                title: 'Profil mis à jour',
                description: 'Vos informations ont été mises à jour avec succès.',
            });
        }
    };

    return (
        <form onSubmit={handleUpdateProfile}>
            <Card>
                <CardHeader>
                    <CardTitle>Informations Personnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nom complet</Label>
                        <Input
                            id="fullName"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Adresse e-mail</Label>
                        <Input
                            id="email"
                            value={email}
                            disabled
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Mise à jour...' : 'Mettre à jour le profil'}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
};
