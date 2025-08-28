import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function SignupSuccess() {
  return (
    <>
      <Header />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Inscription finalisée !</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Votre compte a été créé avec succès.</p>
            <p className="mt-2">Vous pouvez maintenant vous connecter.</p>
            <Button asChild className="mt-4">
              <Link href="/login">Se connecter</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
