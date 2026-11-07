export type Place = {
  id: string;
  name: string;
  category: string;
  coordinates: [number, number];
  distanceMeters?: number;
};

export const SAVED_PLACES_KEY = 'citysense.saved-places.v1';
export const MAX_SAVED_PLACES = 50;

export function isPilotPlace(value: unknown): value is Place {
  if (!value || typeof value !== 'object') return false;
  const p = value as Partial<Place>;
  return typeof p.id === 'string' && p.id.length > 0 && p.id.length <= 200
    && typeof p.name === 'string' && p.name.length > 0 && p.name.length <= 300
    && typeof p.category === 'string' && p.category.length <= 80
    && Array.isArray(p.coordinates) && p.coordinates.length === 2
    && p.coordinates.every(Number.isFinite)
    && p.coordinates[0] >= 6.6 && p.coordinates[0] <= 7
    && p.coordinates[1] >= 47.3 && p.coordinates[1] <= 47.7;
}

export function decodeSavedPlaces(raw: string | null): Place[] {
  if (!raw) return [];
  const values: unknown = JSON.parse(raw);
  if (!Array.isArray(values)) throw new Error('Invalid saved list');
  const unique = new Map<string, Place>();
  for (const value of values) {
    if (!isPilotPlace(value) || unique.has(value.id)) continue;
    unique.set(value.id, {id:value.id, name:value.name, category:value.category, coordinates:value.coordinates});
    if (unique.size === MAX_SAVED_PLACES) break;
  }
  return [...unique.values()];
}
