'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map} from 'maplibre-gl';
import {Building2,Store,ChevronDown,MapPin,Search} from 'lucide-react';
import type {SceneMood} from '../lib/city-scene';
import type {CityPoi} from '../lib/city-details-data';
import type {DetailStatus,createCityDetails} from '../lib/city-details';
import {PHOTO_SOURCE,setPhotoGround} from '../lib/photo-city';
import {facadeReferences} from '../lib/facade-references';

export default function CityDetails({map,mood,scale,dimensional,walking,routeCoordinates}:{map:Map;mood:SceneMood;scale:number;dimensional:boolean;walking:boolean;routeCoordinates?:number[][]}){
  const [enabled,setEnabled]=useState(true),[open,setOpen]=useState(false),[query,setQuery]=useState(''),[error,setError]=useState('');
  const [photo,setPhoto]=useState(true),[photoError,setPhotoError]=useState(false);
  const [status,setStatus]=useState<DetailStatus>({buildings:0,windows:0,signs:0,pois:[],street:''});
  const controller=useRef<ReturnType<typeof createCityDetails>|null>(null);
  const options=useRef({mood,scale,enabled:enabled&&dimensional,dimensional,walking,photo,routeCoordinates});options.current={mood,scale,enabled:enabled&&dimensional,dimensional,walking,photo,routeCoordinates};
  useEffect(()=>{
    setPhotoGround(map,photo,mood==='night');
    const failed=(event:{sourceId?:string})=>{if(event.sourceId===PHOTO_SOURCE){setPhotoError(true);setPhoto(false);}};
    map.on('error',failed);return()=>{map.off('error',failed);};
  },[map,photo,mood]);
  useEffect(()=>{
    let cancelled=false;
    // Keep the 3D renderer out of the first page load and free its GPU resources on teardown.
    import('../lib/city-details').then(({createCityDetails})=>{
      if(cancelled)return;
      try{controller.current=createCityDetails(map,options.current,setStatus);}
      catch{setError('Les détails 3D sont indisponibles sur cet appareil.');}
    }).catch(()=>{if(!cancelled)setError('Les détails 3D n’ont pas pu être chargés.');});
    return()=>{cancelled=true;controller.current?.dispose();controller.current=null;};
  },[map]);
  useEffect(()=>{controller.current?.update(options.current);},[mood,scale,enabled,dimensional,walking,photo,routeCoordinates]);
  function focus(poi:CityPoi){
    if(walking)map.fire('citysense-look-at',{coordinates:poi.coordinates});
    else map.flyTo({center:poi.coordinates,zoom:18.3,pitch:62,duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000});
    setOpen(false);
  }
  const list=status.pois.filter(p=>`${p.name} ${p.category}`.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  return <section className="architecture-panel" aria-label="Détails de la ville" data-buildings={status.buildings} data-windows={status.windows} data-signs={status.signs} data-enabled={enabled&&dimensional} data-photo-roofs={status.photoRoofTriangles||0} data-route-segments={status.routeSegments||0} data-model-meshes={status.modelMeshes||0} data-reference-buildings={status.referenceBuildings||0} data-facade-photo-faces={status.facadePhotoFaces||0}>
    {walking&&status.street&&<div className="street-name"><MapPin size={14}/>{status.street}</div>}
    <div className="architecture-actions"><button aria-pressed={enabled} disabled={!dimensional} onClick={()=>setEnabled(!enabled)}><Building2 size={15}/> Façades {enabled?'détaillées':'simples'}</button><button aria-expanded={open} aria-controls="city-businesses" onClick={()=>setOpen(!open)}><Store size={15}/> Noms et commerces <ChevronDown size={13}/></button></div>
    <label className="photo-choice"><span>Sol et toits</span><select aria-label="Style de la ville" value={photo?'photo':'map'} onChange={e=>{setPhoto(e.target.value==='photo');setPhotoError(false);if(walking)map.getCanvas().focus({preventScroll:true});}}><option value="photo">Photo + 3D</option><option value="map">Carte 3D</option></select></label>
    <p className="architecture-credit">{photo?'Photos IGN · Façades stylisées':'Noms OSM · Façades stylisées'}</p>
    {!!status.referenceBuildings&&<details className="facade-evidence"><summary>{status.referenceBuildings} bâtiments · Panoramax</summary><p>Tour photographiée ; immeuble gris : front reconstruit et côté photographié ; commerce bleu modélisé d’après les vues. Parties cachées non documentées ; autres bâtiments stylisés.</p><p>Photos du 21 août 2026 · <a href={facadeReferences.source.url} target="_blank" rel="noreferrer">Panorama principal</a>{facadeReferences.additionalSources.map((source,i)=><span key={source.id}> · <a href={source.url} target="_blank" rel="noreferrer">Vue {i+2}</a></span>)}</p></details>}
    {!!status.referenceBuildings&&<p className="architecture-credit"><a href={facadeReferences.source.url} target="_blank" rel="noreferrer">Panoramax © {facadeReferences.source.author}</a> · <a href={facadeReferences.source.licenseUrl} target="_blank" rel="noreferrer">CC-BY-SA-4.0</a> · façades adaptées</p>}
    {status.facadePhotoFailed&&<p role="status">Textures de façade indisponibles ; volumes simplifiés affichés.</p>}
    {photoError&&<p role="status">Photos indisponibles. La carte reste utilisable.</p>}
    {error&&<p role="status">{error}</p>}
    {open&&<div id="city-businesses" className="city-businesses"><strong>Autour de vous <span>{status.pois.length}</span></strong><label><Search size={14}/><input aria-label="Filtrer les commerces visibles" placeholder="Café, boutique, musée…" value={query} onChange={e=>setQuery(e.target.value)}/></label><ul>{list.slice(0,30).map(p=><li key={p.id}><button onClick={()=>focus(p)}><i style={{background:p.color}}/><span><strong>{p.name}</strong><small>{p.category} · {p.distance} m</small></span><MapPin size={13}/></button></li>)}</ul>{!list.length&&<p>{query?'Aucun lieu ne correspond.':'Zoomez sur les rues pour charger les lieux cartographiés.'}</p>}<small>{walking?'Choisissez un lieu pour regarder dans sa direction.':'Choisissez un lieu pour le voir sur la carte.'} Données OpenStreetMap, disponibilité non vérifiée.</small></div>}
  </section>;
}
