'use client';
import {useEffect, useState} from 'react';
import {decodeSavedPlaces, isPilotPlace, MAX_SAVED_PLACES, Place, SAVED_PLACES_KEY} from '../lib/saved-places';

export function useSavedPlaces() {
  const [saved, setSaved] = useState<Place[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try { setSaved(decodeSavedPlaces(localStorage.getItem(SAVED_PLACES_KEY))); }
    catch { setNotice('La liste enregistrée est indisponible. Vous pouvez créer une nouvelle liste.'); }
    setReady(true);
    const update = (event: StorageEvent) => {
      if (event.key !== SAVED_PLACES_KEY && event.key !== null) return;
      try { setSaved(decodeSavedPlaces(event.newValue)); }
      catch { setNotice('La liste enregistrée dans un autre onglet est illisible.'); }
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(saved)); }
    catch { setNotice('Stockage local indisponible : vos lieux restent disponibles uniquement pendant cette visite.'); }
  }, [saved, ready]);

  function toggle(place: Place) {
    if (!ready) return;
    if (!isPilotPlace(place)) {
      setNotice('Seuls les lieux de la zone pilote de Montbéliard peuvent être enregistrés.');
      return;
    }
    if (saved.some(p => p.id === place.id)) {
      setSaved(current => current.filter(p => p.id !== place.id));
      setNotice('Lieu retiré de votre liste.');
    } else if (saved.length >= MAX_SAVED_PLACES) {
      setNotice('Votre liste contient 50 lieux. Retirez un lieu avant d’en ajouter un autre.');
    } else {
      setSaved(current => current.some(p => p.id === place.id) ? current : [...current, {
        id:place.id, name:place.name, category:place.category, coordinates:place.coordinates
      }].slice(0, MAX_SAVED_PLACES));
      setNotice('Lieu enregistré sur cet appareil.');
    }
  }
  return {saved, ready, notice, toggle};
}
