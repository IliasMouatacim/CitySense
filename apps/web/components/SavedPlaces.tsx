'use client';
import {Bookmark, X} from 'lucide-react';
import type {Place} from '../lib/saved-places';

export default function SavedPlaces({places, onSelect, onRemove}: {
  places: Place[];
  onSelect: (place: Place) => void;
  onRemove: (place: Place) => void;
}) {
  return <section className="saved-places" aria-label="Lieux enregistrés">
    <div className="section-heading"><h2><Bookmark size={15} aria-hidden="true"/> Mes lieux</h2><span>{places.length}/50</span></div>
    <p className="saved-hint">Sur cet appareil · sans compte</p>
    {places.length === 0 ? <p className="empty">Enregistrez un lieu depuis sa fiche pour le retrouver ici.</p>
      : <ul>{places.map(place => <li key={place.id}>
        <button className="saved-select" onClick={() => onSelect(place)}><strong>{place.name}</strong><small>{place.category}</small></button>
        <button className="saved-remove" onClick={() => onRemove(place)} aria-label={`Retirer ${place.name} des lieux enregistrés`}><X size={16} aria-hidden="true"/></button>
      </li>)}</ul>}
  </section>;
}
