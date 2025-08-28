// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

// --- DÉBUT DE LA LOGIQUE SUPABASE ---
// Cette fonction met à jour la session de l'utilisateur en arrière-plan.
async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // La ligne la plus importante : rafraîchit le jeton d'authentification si nécessaire.
  const { data: { user } } = await supabase.auth.getUser();

  return { response, user }; // On retourne la réponse et l'utilisateur pour la suite
}
// --- FIN DE LA LOGIQUE SUPABASE ---


export async function middleware(request: NextRequest) {
  // 1. On exécute d'abord la logique de Supabase pour rafraîchir la session.
  // Cela garantit que les informations d'authentification sont à jour.
  const { response, user } = await updateSession(request);
  
  // On récupère le rôle depuis les métadonnées de l'utilisateur Supabase.
  // C'est plus fiable que de se baser sur un cookie séparé.
  const role = user?.user_metadata?.role || 'client';
  
  const { pathname } = request.nextUrl;

  // --- DÉBUT DE VOTRE LOGIQUE DE REDIRECTION EXISTANTE ---
  // (Légèrement adaptée pour utiliser l'objet `user` de Supabase)
  const protectedRoutes = ['/dashboard', '/profil', '/agent', '/admin'];
  const authRoutes = ['/login', '/signup'];
  
  const isProtectedRoute = protectedRoutes.some(path => pathname.startsWith(path));
  const isAuthRoute = authRoutes.some(path => pathname.startsWith(path));

  const dashboardMap = {
    admin: '/admin/dashboard',
    agent: '/agent/dashboard',
    client: '/dashboard',
  };
  const userDashboardUrl = dashboardMap[role as keyof typeof dashboardMap];

  // Règle 1 : Si l'utilisateur n'est PAS connecté et tente d'accéder à une route protégée
  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Règle 2 : Si l'utilisateur EST connecté
  if (user) {
    // 2a. S'il est sur une page d'authentification, on le redirige vers son tableau de bord.
    if (isAuthRoute) {
      return NextResponse.redirect(new URL(userDashboardUrl, request.url));
    }

    // 2b. On applique le contrôle d'accès par rôle.
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(userDashboardUrl, request.url));
    }
    if (pathname.startsWith('/agent') && role !== 'agent') {
      return NextResponse.redirect(new URL(userDashboardUrl, request.url));
    }
    
    // 2c. Si un admin/agent arrive sur le dashboard client, on le redirige.
    if (pathname === '/dashboard' && role !== 'client') {
       return NextResponse.redirect(new URL(userDashboardUrl, request.url));
    }
  }

  // 3. Si aucune règle de redirection ne s'applique, on retourne la réponse
  // préparée par la fonction de session de Supabase.
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (routes API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
