// src/app/actions.ts
'use server';

import { Resend } from 'resend';
import * as z from 'zod';

// Schéma de validation pour les données du formulaire
const contactFormSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.string().email("L'adresse e-mail n'est pas valide."),
  message: z.string().min(10, "Le message doit contenir au moins 10 caractères."),
});

export async function sendContactEmail(formData: {
  name: string;
  email: string;
  message: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  
  const validatedFields = contactFormSchema.safeParse(formData);

  // Si la validation échoue, retourner une erreur
  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.errors.map(e => e.message).join(', '),
    };
  }

  const { name, email, message } = validatedFields.data;

  const resend = new Resend(process.env.RESEND_API_KEY);
  const adminEmail = process.env.ADMIN_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!adminEmail || !fromEmail) {
    console.error("ADMIN_EMAIL or RESEND_FROM_EMAIL environment variables are not set.");
    return { success: false, error: "La configuration du serveur est incomplète." };
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Nouveau message de ${name} via le formulaire de contact`,
      replyTo: email,
      html: `<p>Vous avez reçu un nouveau message de :</p>
             <p><strong>Nom :</strong> ${name}</p>
             <p><strong>Email :</strong> ${email}</p>
             <p><strong>Message :</strong></p>
             <p>${message}</p>`,
    });

    return { success: true, message: "Votre message a été envoyé avec succès !" };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: "Une erreur est survenue lors de l'envoi de l'e-mail." };
  }
}
