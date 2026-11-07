'use client';
import {useEffect,useRef,useState} from 'react';
import SavedPlaces from './SavedPlaces';
import {useSavedPlaces} from './useSavedPlaces';
import type {Place} from '../lib/saved-places';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {ArrowUpRight,Search,MapPin,Layers,Navigation,Accessibility,ArrowRight,TrainFront,Trees,Landmark,Compass,X} from 'lucide-react';
type Route={engine:string;attribution?:string;distanceMeters:number;durationSeconds:number;geometry:{type:'LineString';coordinates:number[][]};instructions:{text:string;distanceMeters:number}[]};
export default function Explorer(){
 const savedPlaces=useSavedPlaces();
 const [originId,setOriginId]=useState(''),[mode,setMode]=useState('pedestrian'),[route,setRoute]=useState<Route|null>(null),[routeStatus,setRouteStatus]=useState('');
 const container=useRef<HTMLDivElement>(null),map=useRef<maplibregl.Map|null>(null),marker=useRef<maplibregl.Marker|null>(null);
 const [nearby,setNearby]=useState<Place[]>([]),[nearbyStatus,setNearbyStatus]=useState('');
 const [places,setPlaces]=useState<Place[]>([]),[results,setResults]=useState<Place[]>([]),[query,setQuery]=useState(''),[selected,setSelected]=useState<Place|null>(null),[tilted,setTilted]=useState(true),[mapError,setMapError]=useState(''),[searchError,setSearchError]=useState(''),[loading,setLoading]=useState(false),[category,setCategory]=useState('Tout'),[source,setSource]=useState('local');
 useEffect(()=>{const abort=new AbortController();fetch('/api/places',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setPlaces(d.places)).catch(e=>{if(e.name!=='AbortError')setSearchError('Le répertoire est indisponible. Réessayez plus tard.');});return()=>abort.abort();},[]);
 useEffect(()=>{
  if(!container.current)return;
  try {
   const m=new maplibregl.Map({container:container.current,style:'https://tiles.openfreemap.org/styles/liberty',center:[6.800,47.510],zoom:15.4,pitch:50,bearing:-18,attributionControl:{compact:true}});map.current=m;
   m.addControl(new maplibregl.NavigationControl(),'bottom-right');
   m.on('load',()=>{setMapError('');const layers=m.getStyle().layers||[];const buildings=layers.find(l=>l.type==='fill-extrusion');if(buildings)m.setPaintProperty(buildings.id,'fill-extrusion-opacity',0.85);
   else {const base=layers.find(l=>l.type==='fill'&&l.id.includes('building'));if(base&&'source' in base&&'source-layer' in base){m.addLayer({id:'citysense-buildings',type:'fill-extrusion',source:base.source,'source-layer':base['source-layer'],minzoom:14,paint:{'fill-extrusion-color':'#c8d2bd','fill-extrusion-height':['coalesce',['get','render_height'],8],'fill-extrusion-base':0,'fill-extrusion-opacity':0.8}});}}});
   m.on('error',()=>setMapError('Le fond de carte ne peut pas être chargé. Les lieux restent accessibles dans la liste.'));
   return()=>{m.remove();map.current=null;};
  }catch{setMapError('La carte nécessite WebGL. Explorez les lieux avec la liste ci-contre.');}
 },[]);
 useEffect(()=>{
  if(query.trim().length<2){setResults([]);setLoading(false);return;}
  const controller=new AbortController();setLoading(true);setSearchError('');
  const timer=setTimeout(()=>fetch(`/api/search?${new URLSearchParams({q:query,source})}`,{signal:controller.signal}).then(async r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setResults(d.places)).catch(e=>{if(e.name!=='AbortError')setSearchError('Recherche indisponible. Essayez les lieux du répertoire.');}).finally(()=>{if(!controller.signal.aborted)setLoading(false);}),350);
  return()=>{clearTimeout(timer);controller.abort();};
 },[query,source]);
 useEffect(()=>{
  setNearby([]);if(!selected){setNearbyStatus('');return;}
  const abort=new AbortController();setNearbyStatus('Recherche à proximité…');
  const [lon,lat]=selected.coordinates;
  fetch(`/api/places?${new URLSearchParams({lon:String(lon),lat:String(lat),radius:'800'})}`,{signal:abort.signal}).then(async r=>{if(!r.ok)throw Error();return r.json();}).then(d=>{setNearby(d.places.filter((p:Place)=>p.id!==selected.id));setNearbyStatus('');}).catch(e=>{if(e.name!=='AbortError')setNearbyStatus('Lieux à proximité indisponibles.');});
  return()=>abort.abort();
 },[selected]);
 useEffect(()=>{
  setRoute(null);setRouteStatus('');const origin=places.find(p=>p.id===originId);if(!origin||!selected||origin.id===selected.id)return;
  const abort=new AbortController();setRouteStatus('Calcul de l’itinéraire…');
  fetch(`/api/routes?${new URLSearchParams({from:origin.coordinates.join(','),to:selected.coordinates.join(','),mode})}`,{signal:abort.signal}).then(async r=>{if(!r.ok)throw Error(r.status===422?'Aucun itinéraire trouvé.':'Le service de calcul est indisponible. Réessayez plus tard.');return r.json();}).then(d=>{setRoute(d);setRouteStatus('');}).catch(e=>{if(e.name!=='AbortError')setRouteStatus(e.message);});
  return()=>abort.abort();
 },[originId,selected,mode,places]);
 useEffect(()=>{
  const m=map.current;if(!m)return;
  function draw(){if(!m)return;const data:Parameters<maplibregl.GeoJSONSource['setData']>[0]={type:'FeatureCollection',features:route?[{type:'Feature',properties:{},geometry:route.geometry}]:[]};const source=m.getSource('citysense-route') as maplibregl.GeoJSONSource|undefined;if(source)source.setData(data);else{m.addSource('citysense-route',{type:'geojson',data});m.addLayer({id:'citysense-route',type:'line',source:'citysense-route',paint:{'line-color':'#087c70','line-width':6}});}if(route){const bounds=new maplibregl.LngLatBounds();route.geometry.coordinates.forEach(p=>bounds.extend([p[0],p[1]]));m.fitBounds(bounds,{padding:75,maxZoom:16});}}
  if(m.isStyleLoaded())draw();else m.once('load',draw);return()=>{m.off('load',draw);};
 },[route]);
 function choose(p:Place){setSelected(p);const m=map.current;if(m){m.flyTo({center:p.coordinates,zoom:16.4,essential:false});marker.current?.remove();marker.current=new maplibregl.Marker({color:'#087b70'}).setLngLat(p.coordinates).addTo(m);}}
 function toggle(){const next=!tilted;setTilted(next);map.current?.easeTo({pitch:next?50:0,bearing:next?-18:0,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:600});}
 const list=(query.trim().length>=2?results:places).filter(p=>category==='Tout'||p.category===category);
 return <main>
  <aside className="rail" aria-label="CitySense"><a className="brand-icon" href="/" aria-label="Accueil CitySense"><Layers size={25}/></a><div className="rail-line"/><span className="rail-active"><Compass size={23}/></span><span className="rail-bottom">CS</span></aside>
  <section className="panel" aria-label="Explorer Montbéliard">
   <header><a className="wordmark" href="/">city<span>sense</span><i/></a><span className="beta">PILOTE</span></header>
   <div className="eyebrow"><span/> MONTBÉLIARD, FRANCE</div>
   <h1>La ville, à votre<br/><em>rythme.</em></h1>
   <p className="intro">Explorez les lieux qui vous entourent.<br/>Une autre façon de vivre la ville.</p>
   <label className="search"><Search size={20}/><input aria-label="Rechercher un lieu" placeholder="Un lieu, une adresse…" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button aria-label="Effacer la recherche" onClick={()=>setQuery('')}><X size={16}/></button>}</label>
   <div className="source"><label htmlFor="source">Rechercher dans</label><select id="source" value={source} onChange={e=>setSource(e.target.value)}><option value="local">Lieux du pilote</option><option value="address">Adresses IGN</option></select></div>
   <div className="categories" aria-label="Catégories">{['Tout','Patrimoine','Nature','Transport'].map(c=><button key={c} aria-pressed={category===c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
   <div className="section-heading"><h2>{query.length>=2?'Résultats':'À découvrir'}</h2><span>{list.length} lieux</span></div>
   <div role="status" className="status">{loading?'Recherche en cours…':searchError}</div>
   <div className="place-list">{list.map((p,i)=><button className={`place ${selected?.id===p.id?'chosen':''}`} key={p.id} onClick={()=>choose(p)}><span className={`place-icon icon-${i%3}`}>{p.category==='Nature'?<Trees size={21}/>:p.category==='Transport'?<TrainFront size={21}/>:<Landmark size={21}/>}</span><span className="place-copy"><strong>{p.name}</strong><small>{p.category} · Montbéliard</small></span><ArrowUpRight size={17}/></button>)}{!loading&&!searchError&&!list.length&&<p className="empty">Aucun lieu trouvé. Essayez une autre recherche.</p>}</div>
   <SavedPlaces places={savedPlaces.saved} onSelect={choose} onRemove={savedPlaces.toggle}/>
   <div role="status" className="saved-notice">{savedPlaces.notice}</div>
   <div className="access-card"><span className="access-icon"><Accessibility size={23}/></span><div><h3>Une ville pour chacun.</h3><p>La mobilité accessible est au cœur de CitySense.</p><span>Navigation accessible · À venir <ArrowRight size={13}/></span></div></div>
   <footer><span className="footer-dot"/> Explorer aujourd’hui, mieux se déplacer demain.<small>Répertoire pilote · Positions et hauteurs indicatives</small></footer>
  </section>
  <section className="map-section" aria-label="Carte de Montbéliard"><div ref={container} className="map"/><div className="map-top"><span className="location-pill"><MapPin size={16}/> Montbéliard <span className="pill-divider"/> Bourgogne-Franche-Comté</span><span className="live-pill"><span/> EXPLORATION</span></div>
   <div className="map-tools"><button onClick={toggle} aria-pressed={tilted}><Layers size={17}/>{tilted?'Vue 3D':'Vue 2D'}</button><button aria-label="Recentrer sur Montbéliard" onClick={()=>map.current?.flyTo({center:[6.800,47.510],zoom:15.4})}><Navigation size={18}/></button></div>
   {mapError&&<div role="status" className="map-error">{mapError}</div>}
   <div className="map-caption"><span>47°30′ N &nbsp; 6°48′ E</span><strong>Un nouveau regard sur votre ville.</strong></div>
   {selected&&<article className="detail"><button className="close" onClick={()=>setSelected(null)} aria-label="Fermer les détails"><X size={18}/></button><span className="eyebrow">{selected.category}</span><h2>{selected.name}</h2><p>{selected.category==='Adresse'?'Adresse IGN · Zone pilote de Montbéliard':'Montbéliard · Position indicative du répertoire pilote'}</p><button className="save-place" disabled={!savedPlaces.ready} aria-pressed={savedPlaces.saved.some(p=>p.id===selected.id)} onClick={()=>savedPlaces.toggle(selected)}>{savedPlaces.saved.some(p=>p.id===selected.id)?'Retirer des favoris':'Enregistrer ce lieu'}</button><div className="uncertainty"><Accessibility size={18}/> Accessibilité non vérifiée</div><section className="nearby" aria-label="Lieux à proximité"><h3>À proximité · 800 m</h3><p role="status">{nearbyStatus}</p>{nearby.slice(0,3).map(p=><button key={p.id} onClick={()=>choose(p)}><span>{p.name}</span><small>{p.distanceMeters} m</small></button>)}{!nearbyStatus&&!nearby.length&&<p>Aucun autre lieu du pilote dans ce rayon.</p>}<small>Distances à vol d’oiseau, sans itinéraire.</small></section><section className="routing" aria-label="Itinéraire"><h3>Itinéraire vers ce lieu</h3><label>Départ<select aria-label="Lieu de départ" value={originId} onChange={e=>setOriginId(e.target.value)}><option value="">Choisir un départ</option>{places.filter(p=>p.id!==selected.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Mode<select aria-label="Mode de déplacement" value={mode} onChange={e=>setMode(e.target.value)}><option value="pedestrian">À pied</option><option value="bicycle">À vélo</option></select></label><p role="status">{routeStatus}</p>{route&&<><strong>{route.distanceMeters} m · {Math.ceil(route.durationSeconds/60)} min</strong><ol>{route.instructions.map((step,i)=><li key={i}>{step.text} <small>({step.distanceMeters} m)</small></li>)}</ol><small>{route.attribution || `${route.engine} · © OpenStreetMap contributors`}</small></>}<p className="detail-note">Accessibilité du trajet non vérifiée. Les conditions réelles peuvent différer des données cartographiques.</p></section></article>}
  </section>
 </main>;
}
