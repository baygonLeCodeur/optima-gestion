// src/app/api/properties/search/route.ts
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Tables } from '@/types/supabase';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);

  const query = searchParams.get('query');
  const location = searchParams.get('location');
  const propertyType = searchParams.get('type');
  const operation = searchParams.get('operation');
  const propertyId = searchParams.get('propertyId');
  const city = searchParams.get('city');
  const propertyTypeId = searchParams.get('propertyTypeId');
  const price = searchParams.get('price');
  const area = searchParams.get('area');

  // Case 1: Autocomplétion pour la barre de recherche
  if (query) {
    const { data, error } = await supabase
      .from('properties')
      .select('city, address')
      .eq('is_featured', true)
      .or(`city.ilike.%${query}%,address.ilike.%${query}%`)
      .limit(10);
    
    if (error) {
      console.error('Supabase API error:', error);
      return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
    }
    
    const locations = Array.from(new Set(((data as unknown as Tables<'properties'>[]) || []).map(p => `${p.city}/${p.address}`)));
    return NextResponse.json(locations);
  }

  // Case 4: Recherche finale des biens correspondant aux critères
  if (location && propertyType && operation) {
    const [city, address] = location.split('/');
    
    if (!city || !address) {
      return NextResponse.json({ error: 'Invalid location format. Expected "city/address"' }, { status: 400 });
    }

    let queryBuilder = supabase
      .from('properties')
      .select('*, property_types(name)')
      .eq('is_featured', true)
      .eq('city', city)
      .eq('address', address)
      .eq('property_type_id', propertyType);

    switch (operation) {
      case 'À vendre':
        queryBuilder = queryBuilder.eq('is_for_sale', true).eq('is_for_rent', false);
        break;
      case 'À louer':
        queryBuilder = queryBuilder.eq('is_for_rent', true).eq('is_for_sale', false);
        break;
      case 'Location-Vente':
        queryBuilder = queryBuilder.eq('is_for_rent', true).eq('is_for_sale', true);
        break;
      default:
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error('Supabase API error:', error);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  }

  // Case 2: Recherche de types de biens disponibles à une localisation
  if (location && !propertyType) {
    const [city, address] = location.split('/');
    if (!city || !address) {
      return NextResponse.json({ error: 'Invalid location format. Expected "city/address"' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('properties')
      .select('property_types ( id, name )')
      .eq('is_featured', true)
      .eq('city', city)
      .eq('address', address);
    
    if (error) {
      console.error('Supabase API error:', error);
      return NextResponse.json({ error: 'Failed to fetch property types' }, { status: 500 });
    }
    
    const types = Array.from(
      new Map(
        (((data as unknown as Array<Record<string, unknown>>) || [])
          .map(p => p.property_types)
          .filter(Boolean) as Array<Record<string, unknown>>)
          .map((type) => [String(type.id), type])
      ).values()
    );
    
    return NextResponse.json(types);
  }

  // Case 3: Recherche des opérations disponibles pour un type de bien à une localisation
  if (location && propertyType) {
    const [city, address] = location.split('/');
    if (!city || !address) {
      return NextResponse.json({ error: 'Invalid location format. Expected "city/address"' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('properties')
      .select('is_for_sale, is_for_rent, property_types!inner(id)')
      .eq('is_featured', true)
      .eq('city', city)
      .eq('address', address)
      .eq('property_type_id', propertyType);
    
    if (error) {
      console.error('Supabase API error:', error);
      return NextResponse.json({ error: 'Failed to fetch operations' }, { status: 500 });
    }
    
    const operations = new Set<string>();
    
    ((data as unknown as Tables<'properties'>[]) || []).forEach(property => {
      if (property.is_for_rent && property.is_for_sale) {
        operations.add('Location-Vente');
      } else if (property.is_for_rent && !property.is_for_sale) {
        operations.add('À louer');
      } else if (!property.is_for_rent && property.is_for_sale) {
        operations.add('À vendre');
      }
    });
    
    return NextResponse.json(Array.from(operations));
  }

  // Case 5: Logique pour les biens similaires
  if (propertyId && city && propertyTypeId && price) {
    try {
      const priceNum = parseFloat(price);
      const minPrice = priceNum * 0.8;
      const maxPrice = priceNum * 1.2;

      let queryBuilder = supabase
        .from('properties')
        .select('*')
        .eq('city', city)
        .eq('property_type_id', propertyTypeId)
        .gte('price', minPrice)
        .lte('price', maxPrice)
        .neq('id', propertyId)
        .eq('status', 'available')
        .limit(3);

      if (area) {
        const areaNum = parseFloat(area);
        const minArea = areaNum * 0.75;
        const maxArea = areaNum * 1.25;
        queryBuilder = queryBuilder.gte('area_sqm', minArea).lte('area_sqm', maxArea);
      }
      
      const { data, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      return NextResponse.json(data);

    } catch (error) {
      console.error('Supabase API error (similar properties):', error);
      return NextResponse.json({ error: 'Failed to fetch similar properties' }, { status: 500 });
    }
  }

  // Fallback si aucun cas ne correspond
  return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
}