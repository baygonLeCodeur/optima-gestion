// src/components/header.tsx
'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';

import { useAuth } from '@/hooks/use-auth';
import { useMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Icons } from './icons';
import { logout } from '@/app/auth/actions';

// Importation dynamique pour NotificationBell
const NotificationBell = dynamic(() => import('./NotificationBell').then(mod => mod.NotificationBell), {
  ssr: false,
  loading: () => <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse" />,
});

const mainNavLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/acheter', label: 'Acheter' },
  { href: '/louer', label: 'Louer' },
  { href: '/location-vente', label: 'Location-Vente' },
  { href: '/a-propos', label: 'Qui sommes-nous ?' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isMobile = useMobile();
  const { user, loading } = useAuth(); 
  const router = useRouter();

  const handleContactClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push('/#contact');
    }
  };

  const renderAuthButtons = () => {
    if (loading) {
      return <div className="h-10 w-48 bg-gray-200 rounded-md animate-pulse" />;
    }

    if (user) {
      return (
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button variant="ghost" onClick={handleContactClick}>Contact</Button>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Mon Espace</Link>
          </Button>
          <form action={logout}>
            <Button variant="outline" size="icon" type="submit" aria-label="Déconnexion">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={handleContactClick}>Contact</Button>
        <Button variant="ghost" asChild>
          <Link href="/login">Connexion</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">S'inscrire</Link>
        </Button>
      </div>
    );
  };

  if (isMobile) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Icons.logo className="h-6 w-6" />
            <span className="font-bold">OPTIMA GESTION</span>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {mainNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`text-lg font-semibold ${
                      pathname === link.href ? 'text-primary' : 'text-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                 <hr />
                <div className="flex flex-col gap-2">
                 {renderAuthButtons()}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.logo className="h-8 w-8" />
          <span className="font-bold text-lg">OPTIMA GESTION</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {mainNavLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-foreground/80 ${
                pathname === link.href ? 'text-foreground font-semibold' : 'text-foreground/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-2">
          {renderAuthButtons()}
        </div>
      </div>
    </header>
  );
}
