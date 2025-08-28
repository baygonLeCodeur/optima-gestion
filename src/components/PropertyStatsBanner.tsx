
import { Eye, Heart, MessageCircle, CalendarPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PropertyStatsBannerProps = {
  stats: {
    views: number;
    favorites: number;
    contactRequests: number;
    visitRequests: number;
  };
};

const formatStat = (num: number) => new Intl.NumberFormat('fr-FR').format(num);

export default function PropertyStatsBanner({ stats }: PropertyStatsBannerProps) {
  const { views, favorites, contactRequests, visitRequests } = stats;

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold tracking-tight mb-4">Statistiques de l'Annonce</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vues Totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStat(views)}</div>
            <p className="text-xs text-muted-foreground">Nombre de fois où l'annonce a été vue.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ajouts aux Favoris</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStat(favorites)}</div>
            <p className="text-xs text-muted-foreground">Nombre de clients ayant mis ce bien en favori.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes de Contact</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStat(contactRequests)}</div>
            <p className="text-xs text-muted-foreground">Nombre de prises de contact directes.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demandes de Visite</CardTitle>
            <CalendarPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatStat(visitRequests)}</div>
            <p className="text-xs text-muted-foreground">Nombre de visites planifiées ou demandées.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
