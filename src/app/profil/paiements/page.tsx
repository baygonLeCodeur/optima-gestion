// src/app/profil/paiements/page.tsx
import { PaymentView } from "@/components/PaymentView";

export default function PaymentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
                <p className="text-muted-foreground">
                    Effectuez un nouveau paiement ou consultez votre historique.
                </p>
            </div>
            <PaymentView />
        </div>
    );
}
