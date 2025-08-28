// src/app/api/properties/search/route.ts
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { Tables } from '@/types/supabase';

export async function GET(req: NextRequest) {
  const supabase = await createServerClient();
  const { searchParams } = new URL(req.url);

  // --- Paramètres pour les différentes logiques de l'API ---
  const query = searchParams.get('query');
  const location = searchParams.get('location');
  const propertyType = searchParams.get('type');
  const operation = searchParams.get('operation');
  const propertyId = searchParams.get('propertyId');
  const city = searchParams.get('city');
  const propertyTypeId = searchParams.get('propertyTypeId');
  const price = searchParams.get('price');
  const area = searchParams.get('area');

  // --- DÉBOGAGE : Afficher tous les paramètres reçus ---
  console.log('=== API ROUTE DEBUG ===');
  console.log('query:', query);
  console.log('location:', location);
  console.log('propertyType:', propertyType);
  console.log('operation:', operation);
  console.log('propertyId:', propertyId);
  console.log('city:', city);
  console.log('propertyTypeId:', propertyTypeId);
  console.log('price:', price);
  console.log('area:', area);
  console.log('=======================');

  // Case 1: Autocomplétion pour la barre de recherche
  if (query) {
    console.log('>>> EXÉCUTION DE LA CASE 1: Autocomplétion');
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
    console.log('>>> RETOUR CASE 1:', locations);
    return NextResponse.json(locations);
  }

  // Case 4: Recherche finale des biens correspondant aux critères (DOIT ÊTRE VÉRIFIÉE EN PREMIER)
  if (location && propertyType && operation) {
    console.log('>>> EXÉCUTION DE LA CASE 4: Recherche finale des biens');
    console.log('>>> Paramètres pour Case 4:', { location, propertyType, operation });
    
    const [city, address] = location.split('/');
    
    if (!city || !address) {
      console.log('>>> ERREUR CASE 4: Format de localisation invalide');
      return NextResponse.json({ error: 'Invalid location format. Expected "city/address"' }, { status: 400 });
    }

    console.log('>>> City:', city, 'Address:', address);

    let queryBuilder = supabase
      .from('properties')
      .select('*, property_types(name)')
      .eq('is_featured', true)
      .eq('city', city)
      .eq('address', address)
      .eq('property_type_id', propertyType);

    console.log('>>> Opération sélectionnée:', operation);

    switch (operation) {
      case 'À vendre':
        console.log('>>> Filtrage pour "À vendre"');
        queryBuilder = queryBuilder.eq('is_for_sale', true).eq('is_for_rent', false);
        break;
      case 'À louer':
        console.log('>>> Filtrage pour "À louer"');
        queryBuilder = queryBuilder.eq('is_for_rent', true).eq('is_for_sale', false);
        break;
      case 'Location-Vente':
        console.log('>>> Filtrage pour "Location-Vente"');
        queryBuilder = queryBuilder.eq('is_for_rent', true).eq('is_for_sale', true);
        break;
      default:
        console.log('>>> ERREUR CASE 4: Opération invalide:', operation);
        return NextResponse.json({ error: 'Invalid operation' }, { status: 400 });
    }

    const { data, error } = await queryBuilder;
    
    if (error) {
      console.error('>>> ERREUR SUPABASE CASE 4:', error);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }
    
    console.log('>>> RETOUR CASE 4 - Nombre de propriétés trouvées:', data?.length);
    console.log('>>> RETOUR CASE 4 - Données:', data);
    return NextResponse.json(data);
  }

  // Case 2: Recherche de types de biens disponibles à une localisation
  if (location && !propertyType) {
    console.log('>>> EXÉCUTION DE LA CASE 2: Types de biens');
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
    
    // `property_types` is a joined field from the query; its shape isn't present in the
    // generated `Tables<'properties'>` Row type, so use a narrow local any cast for this mapping.
    // data is a join result where `property_types` is a nested object; the generated Tables<'properties'>
    // Row type does not include the joined `property_types` shape, so constrain the any to this mapping only.
    const types = Array.from(
      new Map(
        (((data as unknown as Array<Record<string, unknown>>) || [])
          .map(p => p.property_types)
          .filter(Boolean) as Array<Record<string, unknown>>)
          .map((type) => [String(type.id), type])
      ).values()
    );
    
    console.log('>>> RETOUR CASE 2:', types);
    return NextResponse.json(types);
  }

  // Case 3: Recherche des opérations disponibles pour un type de bien à une localisation
  if (location && propertyType) {
    console.log('>>> EXÉCUTION DE LA CASE 3: Opérations disponibles');
    console.log('>>> Paramètres pour Case 3:', { location, propertyType, operation });
    
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
    
    console.log('>>> RETOUR CASE 3:', Array.from(operations));
    return NextResponse.json(Array.from(operations));
  }

  // Case 5: Logique pour les biens similaires (inchangée)
  if (propertyId && city && propertyTypeId && price) {
    console.log('>>> EXÉCUTION DE LA CASE 5: Biens similaires');
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

      console.log('>>> RETOUR CASE 5:', data);
      return NextResponse.json(data);

    } catch (error) {
      console.error('Supabase API error (similar properties):', error);
      return NextResponse.json({ error: 'Failed to fetch similar properties' }, { status: 500 });
    }
  }

  // Fallback si aucun cas ne correspond
  console.log('>>> AUCUNE CASE NE CORRESPOND - FALLBACK');
  return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
}



