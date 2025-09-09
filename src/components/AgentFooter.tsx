// src/components/AgentFooter.tsx
import Link from 'next/link';
import { Icons } from './icons';

export default function AgentFooter() {
  return (
    <footer className="bg-gray-800 text-white py-6 mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <h3 className="font-bold text-lg mb-3">Espace Agent</h3>
          <p className="text-gray-400 text-sm">
            Gérez efficacement vos biens immobiliers, vos clients et développez votre activité avec nos outils professionnels.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-3">Navigation</h3>
          <ul className="space-y-2">
            <li><Link href="/agent" className="hover:text-primary text-sm">Tableau de bord</Link></li>
            <li><Link href="/agent/biens" className="hover:text-primary text-sm">Mes Biens</Link></li>
            <li><Link href="/agent/clients" className="hover:text-primary text-sm">Mes Clients</Link></li>
            <li><Link href="/agent/rendez-vous" className="hover:text-primary text-sm">Rendez-vous</Link></li>
            <li><Link href="/agent/rapports" className="hover:text-primary text-sm">Rapports</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-3">Support</h3>
          <ul className="space-y-2">
            <li><Link href="/agent/aide" className="hover:text-primary text-sm">Centre d'aide</Link></li>
            <li><Link href="/agent/documentation" className="hover:text-primary text-sm">Documentation</Link></li>
            <li><Link href="/#contact" className="hover:text-primary text-sm">Contacter le support</Link></li>
            <li><Link href="/" className="hover:text-primary text-sm">Retour au site</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-3">Contact</h3>
          <p className="text-gray-400 text-sm mb-2">Angré, Boulevard Latrille, non loin du 22ème arrondissement</p>
          <p className="text-gray-400 text-sm mb-2">Email: support@optimagestion.net</p>
          <p className="text-gray-400 text-sm mb-3">Téléphone: +225 07 48 01 14 67</p>
          <div className="flex space-x-3">
            <Link href="#" aria-label="Facebook" className="text-gray-400 hover:text-primary">
              <Icons.facebook className="h-5 w-5"/>
            </Link>
            <Link href="#" aria-label="Twitter" className="text-gray-400 hover:text-primary">
              <Icons.twitter className="h-5 w-5"/>
            </Link>
            <Link href="#" aria-label="Instagram" className="text-gray-400 hover:text-primary">
              <Icons.instagram className="h-5 w-5"/>
            </Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto text-center mt-6 border-t border-gray-700 pt-4">
        <p className="text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Optima Gestion - Espace Agent. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}