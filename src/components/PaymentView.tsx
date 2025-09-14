// src/components/PaymentView.tsx
import { PaymentForm } from "@/components/PaymentForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PaymentsList } from "@/components/PaymentsList";
import { Separator } from "@/components/ui/separator";
import { ClientOnlyWrapper } from "./ClientOnlyWrapper";

export function PaymentView() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Effectuer un nouveau paiement</CardTitle>
                    <CardDescription>
                       Remplissez les informations ci-dessous pour initier une transaction sécurisée par Mobile Money.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PaymentForm />
                </CardContent>
            </Card>

            <Separator />

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Historique des paiements</h2>
                <ClientOnlyWrapper fallback={<div className="flex justify-center items-center h-40">Chargement de l'historique...</div>}>
                    <PaymentsList />
                </ClientOnlyWrapper>
            </div>
        </div>
    );
}
