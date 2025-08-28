
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from './ui/badge';

export type AgentTask = {
    id: string;
    title: string;
    due_date: string;
    is_completed: boolean;
};

type AgentTasksListProps = {
    tasks: AgentTask[];
    updateTaskAction: (taskId: string, isCompleted: boolean) => Promise<{ success: boolean; error?: string }>;
    deleteTaskAction: (taskId: string) => Promise<{ success: boolean; error?: string }>;
};

// --- Helper Function (Solution Propre) ---
const isSameDay = (d1: Date, d2: Date): boolean => {
    return d1.getFullYear() === d2.getFullYear()
        && d1.getDate() === d2.getDate()
        && d1.getMonth() === d2.getMonth();
}

export function AgentTasksList({ tasks, updateTaskAction, deleteTaskAction }: AgentTasksListProps) {
    const { toast } = useToast();
    const [pendingAction, setPendingAction] = React.useState<string | null>(null);

    const handleUpdate = async (taskId: string, isCompleted: boolean) => {
        setPendingAction(`update-${taskId}`);
        const result = await updateTaskAction(taskId, isCompleted);
        if (!result.success) toast({ variant: 'destructive', title: 'Erreur', description: result.error });
        setPendingAction(null);
    };

    const handleDelete = async (taskId: string) => {
        setPendingAction(`delete-${taskId}`);
        const result = await deleteTaskAction(taskId);
        if (!result.success) toast({ variant: 'destructive', title: 'Erreur', description: result.error });
        // L'item est retiré par le rafraîchissement des données
    };

    const isOverdue = (dueDateStr: string): boolean => {
        const dueDate = new Date(dueDateStr);
        const today = new Date();
        // Mettre l'heure à zéro pour ne comparer que les jours
        dueDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tâches et Rappels</CardTitle>
            </CardHeader>
            <CardContent>
                {tasks.length > 0 ? (
                    <ul className="space-y-3">
                        {tasks.map((task) => (
                            <li key={task.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id={`task-${task.id}`}
                                        checked={task.is_completed}
                                        onCheckedChange={(checked) => handleUpdate(task.id, !!checked)}
                                        disabled={pendingAction === `update-${task.id}`}
                                    />
                                    <div>
                                        <label htmlFor={`task-${task.id}`} className={`text-sm font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                            {task.title}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <p className={`text-xs ${task.is_completed ? 'line-through text-muted-foreground' : 'text-gray-500'}`}>
                                                Échéance: {format(new Date(task.due_date), 'PPP', { locale: fr })}
                                            </p>
                                            {!task.is_completed && isOverdue(task.due_date) && <Badge variant="destructive">En retard</Badge>}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDelete(task.id)}
                                    disabled={pendingAction === `delete-${task.id}`}
                                >
                                    {pendingAction === `delete-${task.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-muted-foreground" />}
                                </Button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground text-center">Aucune tâche planifiée pour ce prospect.</p>
                )}
            </CardContent>
        </Card>
    );
}
