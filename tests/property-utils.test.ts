// tests/property-utils.test.ts
import assert from 'assert';
import { getBedrooms, getBathrooms, normalizeLatLng } from '@/lib/property-utils';

// Simple smoke tests
const p1 = { number_of_rooms: 3, number_of_bathrooms: 2, latitude: 5.0, longitude: 6.0 };
assert.strictEqual(getBedrooms(p1), 3);
assert.strictEqual(getBathrooms(p1), 2);
assert.deepStrictEqual(normalizeLatLng(p1), { latitude: 5.0, longitude: 6.0 });

const p2 = { number_of_rooms: null, number_of_bedrooms: 1, lat: 1.1, lng: 2.2 } as unknown as Record<string, unknown>;
assert.strictEqual(getBedrooms(p2), 1);
assert.strictEqual(getBathrooms(p2), 0);
assert.deepStrictEqual(normalizeLatLng(p2), { latitude: 1.1, longitude: 2.2 });

console.log('\u2705 property-utils tests passed');
