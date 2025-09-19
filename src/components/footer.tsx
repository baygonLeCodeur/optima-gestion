// src/components/footer.tsx
'use client';
import Link from 'next/link';
import { Icons } from './icons';

export default function Footer() { // Ajout de 'export default'
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="font-bold text-lg mb-4">A propos</h3>
          <p className="text-gray-400">
            Notre agence immobilière vous accompagne dans tous vos projets : achat, vente, location et gestion de biens.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4">Liens rapides</h3>
          <ul>
            <li><Link href="/acheter" className="hover:text-primary">Acheter</Link></li>
            <li><Link href="/louer" className="hover:text-primary">Louer</Link></li>
            <li><Link href="/vendre" className="hover:text-primary">Vendre</Link></li>
            <li><Link href="/#contact" className="hover:text-primary">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4">Contactez-nous</h3>
          <p className="text-gray-400">Angré, Boulevard Latrille, non loin du 22è arrondissement</p>
          <p className="text-gray-400">Email: contact@optimagestion.net</p>
          <p className="text-gray-400">Téléphone: +225 07 07 81 16 09</p>
        </div>
        <div>
          <h3 className="font-bold text-lg mb-4">Suivez-nous</h3>
          <div className="flex space-x-4">
            <Link href="#" aria-label="Facebook" className="text-gray-400 hover:text-primary"><Icons.facebook/></Link>
            <Link href="#" aria-label="Twitter" className="text-gray-400 hover:text-primary"><Icons.twitter/></Link>
            <Link href="#" aria-label="Instagram" className="text-gray-400 hover:text-primary"><Icons.instagram/></Link>
          </div>
        </div>
      </div>
      <div className="container mx-auto text-center mt-8 border-t border-gray-700 pt-4">
        <p className="text-gray-500">&copy; {new Date().getFullYear()} Optima Gestion. Tous droits réservés.</p>
      </div>
    </footer>
  );
}
