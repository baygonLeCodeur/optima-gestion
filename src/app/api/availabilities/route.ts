     // src/app/api/availabilities/route.ts
    import { createSupabaseServerClient } from '@/lib/supabase/server';
    import { NextRequest, NextResponse } from 'next/server';
    import { getDay, parse, addMinutes, isAfter, areIntervalsOverlapping } from 'date-fns';
    
    // --- CONFIGURATION ---
    const SLOT_DURATION = 60; // Durée d'un créneau de visite en minutes
    const DAYS_TO_SCAN = 30; // Nombre de jours à scanner pour les disponibilités
    
    // --- FONCTION PRINCIPALE ---
    export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    
    if (!agentId) {
        return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }
    
    // --- CORRECTION ICI ---
    const supabase = await createSupabaseServerClient();
    
    try {
        // 1. Récupérer les disponibilités hebdomadaires de l'agent
        const { data: weeklyAvailabilities, error: availabilitiesError } = await supabase
        .from('agent_availabilities')
        .select('day_of_week, start_time, end_time')
        .eq('agent_id', agentId);
    
        if (availabilitiesError) throw new Error(`Supabase error (availabilities): ${availabilitiesError.message}`);
    
        // 2. Récupérer les visites déjà confirmées pour cet agent
        const { data: existingVisits, error: visitsError } = await supabase
        .from('visits')
        .select('scheduled_at, duration_minutes')
        .eq('agent_id', agentId)
        .eq('status', 'confirmed')
        .gte('scheduled_at', new Date().toISOString());
    
        if (visitsError) throw new Error(`Supabase error (visits): ${visitsError.message}`);
    
        // 3. Générer tous les créneaux possibles pour les X prochains jours
        const availableSlots = generateAllPossibleSlots(weeklyAvailabilities || []);
    
        // 4. Filtrer les créneaux en retirant ceux qui sont déjà pris
        const filteredSlots = filterBookedSlots(availableSlots, existingVisits || []);
    
        return NextResponse.json(filteredSlots);
    
    } catch (error: any) {
        console.error('[API/AVAILABILITIES] Error:', error.message);
        return NextResponse.json({ error: 'Could not retrieve availabilities', details: error.message }, { status: 500 });
    }
    }
    
    // --- FONCTIONS UTILITAIRES ---
    
    /**
    * Génère tous les créneaux possibles pour les prochains jours en se basant sur les disponibilités hebdomadaires.
    */
    function generateAllPossibleSlots(
        weeklyAvailabilities: Pick<any, 'day_of_week' | 'start_time' | 'end_time'>[]
    ) {
        const slots: { start: Date; end: Date }[] = [];
        const today = new Date();
    
        for (let i = 0; i < DAYS_TO_SCAN; i++) {
        const currentDate = addMinutes(today, i * 24 * 60);
        // Correction pour s'aligner sur le début du jour pour les comparaisons
        currentDate.setHours(0, 0, 0, 0);
        const dayOfWeek = getDay(currentDate); // Dimanche = 0, Lundi = 1, etc.
    
        const dayAvailability = weeklyAvailabilities.find(a => a.day_of_week === dayOfWeek);
    
        if (dayAvailability) {
            const startTime = parse(dayAvailability.start_time, 'HH:mm:ss', currentDate);
            const endTime = parse(dayAvailability.end_time, 'HH:mm:ss', currentDate);
    
            let currentSlotStart = startTime;
    
            while (isAfter(endTime, currentSlotStart)) {
            const currentSlotEnd = addMinutes(currentSlotStart, SLOT_DURATION);
            if (!isAfter(currentSlotEnd, endTime)) {
                // On ajoute le créneau uniquement s'il est dans le futur
                if (isAfter(currentSlotStart, new Date())) {
                slots.push({ start: currentSlotStart, end: currentSlotEnd });
                }
            }
            currentSlotStart = addMinutes(currentSlotStart, SLOT_DURATION);
            }
        }
        }
        return slots;
    }
    
    /**
    * Filtre une liste de créneaux en retirant ceux qui se chevauchent avec des visites existantes.
    */
    function filterBookedSlots(
        allSlots: { start: Date; end: Date }[],
    bookedVisits: Pick<any, 'scheduled_at' | 'duration_minutes'>[]
    ) {
    if (bookedVisits.length === 0) return allSlots;

    const bookedIntervals = bookedVisits.map(visit => {
        const start = new Date(visit.scheduled_at);
        const end = addMinutes(start, visit.duration_minutes || SLOT_DURATION);
        return { start, end };
    });

    return allSlots.filter(slot => {
        return !bookedIntervals.some(bookedInterval =>
        areIntervalsOverlapping(
            { start: slot.start, end: slot.end },
            { start: bookedInterval.start, end: bookedInterval.end },
            { inclusive: true } // Important pour éviter les créneaux qui se touchent
        )
        );
    });
    }