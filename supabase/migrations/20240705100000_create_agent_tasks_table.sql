
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_tasks') THEN
        CREATE TABLE public.agent_tasks (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
            created_at timestamp with time zone DEFAULT now() NOT NULL,
            agent_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
            lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
            title text NOT NULL,
            due_date timestamp with time zone NOT NULL,
            is_completed boolean DEFAULT false NOT NULL,
            completed_at timestamp with time zone
        );

        -- Activez la Row Level Security (RLS) pour la nouvelle table
        ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;

        -- Créez les politiques de sécurité pour s'assurer que les agents
        -- ne peuvent voir et gérer que leurs propres tâches.
        CREATE POLICY "Agents can view their own tasks"
        ON public.agent_tasks
        FOR SELECT USING (auth.uid() = agent_id);

        CREATE POLICY "Agents can insert tasks for themselves"
        ON public.agent_tasks
        FOR INSERT WITH CHECK (auth.uid() = agent_id);

        CREATE POLICY "Agents can update their own tasks"
        ON public.agent_tasks
        FOR UPDATE USING (auth.uid() = agent_id);

        CREATE POLICY "Agents can delete their own tasks"
        ON public.agent_tasks
        FOR DELETE USING (auth.uid() = agent_id);

        -- Ajout d'index pour améliorer les performances des requêtes
        CREATE INDEX idx_agent_tasks_agent_id ON public.agent_tasks(agent_id);
        CREATE INDEX idx_agent_tasks_lead_id ON public.agent_tasks(lead_id);
    END IF;
END$$;
