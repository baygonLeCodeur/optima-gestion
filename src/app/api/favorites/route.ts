import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { propertyId } = body;
    if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 });

    // Attempt to identify user from cookies/session
    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { error } = await supabaseAdmin.from('user_favorites').insert({ user_id: userId, property_id: propertyId });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API favorites POST error', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { propertyId } = body;
    if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 });

    const serverClient = await createClient();
    const { data: { user } } = await serverClient.auth.getUser();
    const userId = user?.id;

    if (!userId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { error } = await supabaseAdmin.from('user_favorites').delete().eq('user_id', userId).eq('property_id', propertyId);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API favorites DELETE error', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
