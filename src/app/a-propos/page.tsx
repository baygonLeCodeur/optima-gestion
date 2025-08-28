import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

const AboutPage = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="relative h-96">
        <Image
          src="/fond-appart.jpeg"
          alt="Illustration de la gestion immobilière"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center text-white p-4">
            <h1 className="text-5xl font-extrabold mb-4">OPTIMA GESTION</h1>
            <p className="text-xl max-w-2xl">
              Votre Partenaire de Confiance en Gestion Immobilière en Côte d'Ivoire
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-16 px-4">
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Simplifiez la Gestion de Votre Patrimoine Immobilier avec OPTIMA GESTION
          </h2>
          <p className="text-lg text-center max-w-3xl mx-auto">
            La gestion immobilière est un domaine complexe qui demande expertise, rigueur et disponibilité. Que vous soyez propriétaire bailleur, investisseur ou membre d'une copropriété, confier la gestion de vos biens à des professionnels est la clé pour optimiser votre investissement et vous libérer des contraintes quotidiennes. OPTIMA GESTION est votre partenaire privilégié pour une gestion immobilière sereine et performante.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h3 className="text-2xl font-bold mb-4">Qu'est-ce qu'une Société de Gestion Immobilière ?</h3>
            <p className="mb-4">
              Une société de gestion immobilière est une entreprise spécialisée dans l'administration de biens immobiliers pour le compte de tiers, qu'il s'agisse de particuliers ou de professionnels. Son activité principale est centrée sur la gestion des actifs immobiliers, offrant une gamme complète de services pour assurer la pérennité et la rentabilité de votre patrimoine.
            </p>
            <h3 className="text-2xl font-bold mb-4">Notre Rôle chez OPTIMA GESTION</h3>
            <p>
              Notre rôle chez OPTIMA GESTION est d'agir comme un intermédiaire de confiance entre les propriétaires et les locataires, ou entre les copropriétaires, en prenant en charge toutes les facettes de la gestion immobilière.
            </p>
          </div>
          <div className="relative h-80 w-full overflow-hidden rounded-lg shadow-md">
            <Image
                src="/devant-og.jpg"
                alt="A propos de nous"
                fill
                className="object-cover"
            />
          </div>
        </section>

        <section className="mb-16">
            <h3 className="text-2xl font-bold mb-6 text-center">Nous nous engageons à :</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Protéger votre patrimoine</CardTitle>
                    </CardHeader>
                    <CardContent>
                        En assurant une gestion rigoureuse et proactive de vos biens, nous veillons à leur entretien, à leur conformité et à leur optimisation financière.
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Optimiser la rentabilité</CardTitle>
                    </CardHeader>
                    <CardContent>
                        Grâce à notre connaissance du marché, nous ajustons les loyers, réduisons la vacance et conseillons sur les améliorations.
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Vous libérer des contraintes</CardTitle>
                    </CardHeader>
                    <CardContent>
                         Nous prenons en charge toutes les tâches chronophages et complexes, vous permettant de vous concentrer sur l'essentiel.
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><CheckCircle className="text-green-500" /> Assurer la satisfaction</CardTitle>
                    </CardHeader>
                    <CardContent>
                        Nous sommes le garant d'une communication fluide et professionnelle, et nous agissons en médiateur en cas de besoin.
                    </CardContent>
                </Card>
            </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold text-center mb-8">Nos Missions et Attributions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Gestion Locative</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Recherche et sélection de locataires</li>
                  <li>Rédaction et gestion des baux</li>
                  <li>Encaissement des loyers et des charges</li>
                  <li>Gestion des relations avec les locataires</li>
                  <li>Révision des loyers et régularisation des charges</li>
                  <li>Gestion des travaux et de l'entretien</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gestion de Copropriété</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Administration courante de l'immeuble</li>
                  <li>Gestion financière</li>
                  <li>Organisation et tenue des assemblées générales</li>
                  <li>Suivi des travaux</li>
                  <li>Gestion des litiges</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Gestion de Patrimoine</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-2">
                  <li>Conseil en investissement immobilier</li>
                  <li>Optimisation fiscale</li>
                  <li>Valorisation du bien</li>
                  <li>Représentation du propriétaire</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="text-center mt-16 bg-green-600 text-white p-12 rounded-lg">
          <h2 className="text-3xl font-bold mb-4">Pourquoi Choisir OPTIMA GESTION ?</h2>
          <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 text-left">
              <p><span className="font-bold">Expertise reconnue :</span> Notre équipe est composée de professionnels qualifiés et expérimentés, maîtrisant parfaitement les aspects juridiques, fiscaux et techniques de la gestion immobilière.</p>
              <p><span className="font-bold">Transparence et communication :</span> Nous vous tenons informé en temps réel de toutes les actions entreprises et vous fournissons des rapports détaillés.</p>
              <p><span className="font-bold">Service personnalisé :</span> Chaque bien et chaque propriétaire est unique. Nous adaptons nos services à vos besoins spécifiques pour une gestion sur mesure.</p>
              <p><span className="font-bold">Gain de temps et sérénité :</span> Déléguez-nous la gestion de vos biens et profitez pleinement de votre temps, en toute tranquillité.</p>
          </div>
          <Link href="mailto:contact@optima-gestion.com" className="mt-8 inline-block bg-white text-green-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors">
            Contactez-nous dès aujourd'hui
          </Link>
        </section>
      </main>
    </div>
  );
};

export default AboutPage;
