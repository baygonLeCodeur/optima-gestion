
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Interaction } from '@/app/agent/leads/[id]/page';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Mail, StickyNote } from 'lucide-react';

type LeadHistoryProps = {
  interactions: Interaction[];
};

const getInteractionIcon = (type: string) => {
    switch (type) {
        case 'email':
            return <Mail className="h-5 w-5 text-blue-500" />;
        case 'note':
            return <StickyNote className="h-5 w-5 text-yellow-500" />;
        default:
            return <StickyNote className="h-5 w-5" />;
    }
}

export function LeadHistory({ interactions }: LeadHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historique des Interactions</CardTitle>
      </CardHeader>
      <CardContent>
        {interactions.length > 0 ? (
          <ul className="space-y-6">
            {interactions.map((item) => (
              <li key={item.id} className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                    {getInteractionIcon(item.type)}
                </div>
                <div className="flex-1">
                  {item.type === 'email' && item.subject && (
                    <p className="font-bold text-sm">Sujet: {item.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDistanceToNow(new Date(item.created_at!), { addSuffix: true, locale: fr })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Aucune interaction enregistrée pour ce prospect.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
