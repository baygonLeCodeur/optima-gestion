// src/components/agent-contact-form.tsx
    "use client";
    
    import { zodResolver } from "@hookform/resolvers/zod";
    import { useForm } from "react-hook-form";
    import { z } from "zod";
    import { Button } from "@/components/ui/button";
    import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
    import { Input } from "@/components/ui/input";
    import { Textarea } from "@/components/ui/textarea";
    import { useToast } from "@/hooks/use-toast";
    import { Tables } from "@/types/supabase";
    import { useState } from "react";
    import { Loader2 } from "lucide-react";
    
    const formSchema = z.object({
        name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
        email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
        phone: z.string().min(10, { message: "Le numéro de téléphone doit contenir au moins 10 chiffres." }),
        message: z.string().min(10, { message: "Le message doit contenir au moins 10 caractères." }),
    });
    
    interface AgentContactFormProps {
        agent: Tables<'users'>;
        propertyId: string;
    }
    
    export function AgentContactForm({ agent, propertyId }: AgentContactFormProps) {
        const { toast } = useToast();
        const [isLoading, setIsLoading] = useState(false);
    
        const form = useForm<z.infer<typeof formSchema>>({
            resolver: zodResolver(formSchema),
            defaultValues: { name: "", email: "", phone: "", message: "" },
        });

        async function onSubmit(values: z.infer<typeof formSchema>) {
            setIsLoading(true);
            try {
                const response = await fetch('/api/visits', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: values.name,
                        email: values.email,
                        phone: values.phone,
                        message: values.message,
                        agentId: agent.id,
                        propertyId: propertyId,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || "Échec de l'envoi du message.");
                }

                toast({
                    title: "Message envoyé !",
                    description: `Votre message a bien été envoyé à ${agent.full_name}.`,
                });
                form.reset();
    
                localStorage.setItem(`form_success_${propertyId}`, 'true');
                window.dispatchEvent(new CustomEvent('formSuccess', { detail: { propertyId } }));
    
            } catch (error: any) {
                toast({
                    title: "Erreur",
                    description: error.message || "Une erreur est survenue lors de l'envoi du message.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        }
    
        return (
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Votre nom</FormLabel>
                            <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Votre e-mail</FormLabel>
                            <FormControl><Input placeholder="john.doe@example.com" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Votre téléphone</FormLabel>
                            <FormControl><Input type="tel" placeholder="06 12 34 56 78" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name="message" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Votre message</FormLabel>
                            <FormControl><Textarea placeholder="Bonjour, je suis intéressé par ce bien..." className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Envoi en cours...' : 'Envoyer le message'}
                    </Button>
                </form>
            </Form>
        );
    }
