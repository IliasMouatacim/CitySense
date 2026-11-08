'use client';
import {useEffect,useRef,useState} from 'react';
import {CITY_VIEWS,styleCity,type SceneMood} from '../lib/city-scene';
import SavedPlaces from './SavedPlaces';
import {useSavedPlaces} from './useSavedPlaces';
import type {Place} from '../lib/saved-places';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {ArrowUpRight,Search,MapPin,Layers,Navigation,Accessibility,ArrowRight,TrainFront,Trees,Landmark,Compass,X,Sun,Sunset,Moon,Play,Pause,RotateCcw,Maximize2,Minimize2} from 'lucide-react';
type Route={engine:string;attribution?:string;distanceMeters:number;durationSeconds:number;geometry:{type:'LineString';coordinates:number[][]};instructions:{text:string;distanceMeters:number}[]};
export default function Explorer(){
 const savedPlaces=useSavedPlaces();
 const [immersive,setImmersive]=useState(false);
 const [mood,setMood]=useState<SceneMood>('golden'),[heightScale,setHeightScale]=useState(1),[mapReady,setMapReady]=useState(false),[tour,setTour]=useState(false),[reducedMotion,setReducedMotion]=useState(false),[camera,setCamera]=useState({pitch:62,bearing:-26}),[viewId,setViewId]=useState('centre');
 useEffect(()=>{const query=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>{setReducedMotion(query.matches);if(query.matches)setTour(false);};sync();query.addEventListener('change',sync);return()=>query.removeEventListener('change',sync);},[]);
 const [originId,setOriginId]=useState(''),[mode,setMode]=useState('pedestrian'),[route,setRoute]=useState<Route|null>(null),[routeStatus,setRouteStatus]=useState('');
 const container=useRef<HTMLDivElement>(null),map=useRef<maplibregl.Map|null>(null),marker=useRef<maplibregl.Marker|null>(null);
 const [nearby,setNearby]=useState<Place[]>([]),[nearbyStatus,setNearbyStatus]=useState('');
 const [places,setPlaces]=useState<Place[]>([]),[results,setResults]=useState<Place[]>([]),[query,setQuery]=useState(''),[selected,setSelected]=useState<Place|null>(null),[tilted,setTilted]=useState(true),[mapError,setMapError]=useState(''),[searchError,setSearchError]=useState(''),[loading,setLoading]=useState(false),[category,setCategory]=useState('Tout'),[source,setSource]=useState('local');
 useEffect(()=>{const abort=new AbortController();fetch('/api/places',{signal:abort.signal}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setPlaces(d.places)).catch(e=>{if(e.name!=='AbortError')setSearchError('Le répertoire est indisponible. Réessayez plus tard.');});return()=>abort.abort();},[]);
 useEffect(()=>{
  if(!container.current)return;
  try {
   const first=CITY_VIEWS[0];
   const m=new maplibregl.Map({container:container.current,style:'https://tiles.openfreemap.org/styles/liberty',center:first.center,zoom:first.zoom,pitch:first.pitch,bearing:first.bearing,maxPitch:75,canvasContextAttributes:{antialias:true},attributionControl:{compact:true}});map.current=m;
   m.addControl(new maplibregl.NavigationControl({visualizePitch:true}),'bottom-right');
   m.on('load',()=>{styleCity(m,'golden');setMapReady(true);setMapError('');});
   m.on('moveend',()=>{const pitch=Math.round(m.getPitch()),bearing=Math.round(m.getBearing());setCamera(previous=>previous.pitch===pitch&&previous.bearing===bearing?previous:{pitch,bearing});setTilted(m.getPitch()>10);});
   m.on('dragstart',()=>{setTour(false);setViewId('');});
   m.on('zoomstart',event=>{if(event.originalEvent)setTour(false);});
   m.on('pitchstart',event=>{if(event.originalEvent)setTour(false);});
   m.getCanvas().addEventListener('pointerdown',()=>setTour(false));
   m.on('error',()=>setMapError('Le fond de carte ne peut pas être chargé. Les lieux restent accessibles dans la liste.'));
   return()=>{m.remove();map.current=null;};
  }catch{setMapError('La carte nécessite WebGL. Explorez les lieux avec la liste ci-contre.');}
 },[]);
 useEffect(()=>{if(mapReady&&map.current){const m=map.current;styleCity(m,mood,heightScale,tilted);if(m.getLayer('citysense-route'))m.setPaintProperty('citysense-route','line-color',mood==='night'?'#6ae8cb':'#087c70');}},[mapReady,mood,heightScale,tilted]);
 useEffect(()=>{
  const frame=requestAnimationFrame(()=>map.current?.resize());
  const escape=(event:KeyboardEvent)=>{if(event.key==='Escape')setImmersive(false);};
  window.addEventListener('keydown',escape);return()=>{cancelAnimationFrame(frame);window.removeEventListener('keydown',escape);};
 },[immersive]);
 useEffect(()=>{
  const m=map.current;if(!m||!mapReady||!tour||reducedMotion)return;
  let frame=0;const started=performance.now(),bearing=m.getBearing();
  const animate=(now:number)=>{m.rotateTo(bearing+(now-started)*0.004,{duration:0});frame=requestAnimationFrame(animate);};
  frame=requestAnimationFrame(animate);
  const hide=()=>{if(document.hidden)setTour(false);};document.addEventListener('visibilitychange',hide);
  return()=>{cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',hide);};
 },[tour,mapReady,reducedMotion]);
 function visitView(id:string){const preset=CITY_VIEWS.find(v=>v.id===id);if(!preset)return;setTour(false);setViewId(id);setTilted(true);map.current?.flyTo({center:preset.center,zoom:preset.zoom,pitch:preset.pitch,bearing:preset.bearing,duration:reducedMotion?0:1800,essential:false});}
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
  function draw(){if(!m)return;const data:Parameters<maplibregl.GeoJSONSource['setData']>[0]={type:'FeatureCollection',features:route?[{type:'Feature',properties:{},geometry:route.geometry}]:[]};const source=m.getSource('citysense-route') as maplibregl.GeoJSONSource|undefined;if(source)source.setData(data);else{m.addSource('citysense-route',{type:'geojson',data});m.addLayer({id:'citysense-route-casing',type:'line',source:'citysense-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#fff9e9','line-width':10,'line-opacity':0.8}});m.addLayer({id:'citysense-route',type:'line',source:'citysense-route',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':mood==='night'?'#6ae8cb':'#087c70','line-width':5}});}if(route){const bounds=new maplibregl.LngLatBounds();route.geometry.coordinates.forEach(p=>bounds.extend([p[0],p[1]]));m.fitBounds(bounds,{padding:75,maxZoom:16});}}
  if(m.isStyleLoaded())draw();else m.once('load',draw);return()=>{m.off('load',draw);};
 },[route]);
 function choose(p:Place){setTour(false);setViewId('');setSelected(p);const m=map.current;if(m){m.flyTo({center:p.coordinates,zoom:16.4,essential:false});marker.current?.remove();marker.current=new maplibregl.Marker({color:'#087b70'}).setLngLat(p.coordinates).addTo(m);}}
 function toggle(){setTour(false);const next=!tilted;setTilted(next);map.current?.easeTo({pitch:next?62:0,bearing:next?-26:0,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:600});}
 const list=(query.trim().length>=2?results:places).filter(p=>category==='Tout'||p.category===category);
 return <main className={immersive?'immersive':undefined}>
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
  <section className="map-section" data-mood={mood} aria-label="Carte de Montbéliard"><div ref={container} className="map" data-ready={mapReady} data-scene={mood} data-pitch={camera.pitch} data-bearing={camera.bearing}/><div className="map-top"><span className="location-pill"><MapPin size={16}/> Montbéliard <span className="pill-divider"/> Bourgogne-Franche-Comté</span><span className="live-pill"><span/> EXPLORATION</span></div>
   <div className="map-tools"><button disabled={!mapReady} onClick={toggle} aria-pressed={tilted}><Layers size={17}/>{tilted?'Vue 3D':'Vue 2D'}</button><button disabled={!mapReady} aria-label="Recentrer sur Montbéliard" onClick={()=>visitView('centre')}><RotateCcw size={17}/></button><button disabled={!mapReady} aria-label={immersive?'Quitter le plein écran':'Agrandir la carte'} aria-pressed={immersive} onClick={()=>setImmersive(!immersive)}>{immersive?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button></div>
   <section className="scene-panel" aria-label="Ambiance de la ville">
    <div className="scene-heading"><span>EXPLORER EN 3D</span><span className="camera-angle">{camera.pitch}°</span></div>
    <div className="scene-moods" aria-label="Éclairage">{([{id:'day',label:'Jour',Icon:Sun},{id:'golden',label:'Doré',Icon:Sunset},{id:'night',label:'Nuit',Icon:Moon}]as const).map(({id,label,Icon})=><button key={id} aria-pressed={mood===id} disabled={!mapReady} onClick={()=>setMood(id)}><Icon size={16}/>{label}</button>)}</div>
    <label className="scene-scale">Hauteur visuelle <span>{heightScale.toFixed(1)}×</span><input aria-label="Échelle visuelle des bâtiments" type="range" min="1" max="2" step="0.1" value={heightScale} disabled={!mapReady||!tilted} onChange={e=>setHeightScale(Number(e.target.value))}/></label>
    <small>{heightScale===1?'Hauteurs cartographiques ou estimées':'Exagération visuelle · mesures inchangées'}</small>
   </section>
   <div className="city-views" aria-label="Points de vue"><span className="views-label">PRENDRE DE LA HAUTEUR</span><div>{CITY_VIEWS.map(v=><button key={v.id} aria-pressed={viewId===v.id&&tilted} disabled={!mapReady} onClick={()=>visitView(v.id)}><MapPin size={14}/>{v.name}</button>)}</div><button className="tour-toggle" disabled={!mapReady||reducedMotion} aria-pressed={tour} onClick={()=>{if(!tilted){setTilted(true);map.current?.easeTo({pitch:62,duration:600});}setTour(!tour);}}>{tour?<Pause size={15}/>:<Play size={15}/>} {tour?'Arrêter la visite':'Visite orbitale'}</button>{reducedMotion&&<small>Animations réduites activées</small>}</div>

   {mapError&&<div role="status" className="map-error">{mapError}</div>}
   <div className="map-caption"><span>47°30′ N &nbsp; 6°48′ E</span><strong>{immersive?'Exploration immersive · Échap pour revenir':'Montbéliard, sous un autre angle.'}</strong></div>
   {selected&&<article className="detail"><button className="close" onClick={()=>setSelected(null)} aria-label="Fermer les détails"><X size={18}/></button><span className="eyebrow">{selected.category}</span><h2>{selected.name}</h2><p>{selected.category==='Adresse'?'Adresse IGN · Zone pilote de Montbéliard':'Montbéliard · Position indicative du répertoire pilote'}</p><button className="save-place" disabled={!savedPlaces.ready} aria-pressed={savedPlaces.saved.some(p=>p.id===selected.id)} onClick={()=>savedPlaces.toggle(selected)}>{savedPlaces.saved.some(p=>p.id===selected.id)?'Retirer des favoris':'Enregistrer ce lieu'}</button><div className="uncertainty"><Accessibility size={18}/> Accessibilité non vérifiée</div><section className="nearby" aria-label="Lieux à proximité"><h3>À proximité · 800 m</h3><p role="status">{nearbyStatus}</p>{nearby.slice(0,3).map(p=><button key={p.id} onClick={()=>choose(p)}><span>{p.name}</span><small>{p.distanceMeters} m</small></button>)}{!nearbyStatus&&!nearby.length&&<p>Aucun autre lieu du pilote dans ce rayon.</p>}<small>Distances à vol d’oiseau, sans itinéraire.</small></section><section className="routing" aria-label="Itinéraire"><h3>Itinéraire vers ce lieu</h3><label>Départ<select aria-label="Lieu de départ" value={originId} onChange={e=>setOriginId(e.target.value)}><option value="">Choisir un départ</option>{places.filter(p=>p.id!==selected.id).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Mode<select aria-label="Mode de déplacement" value={mode} onChange={e=>setMode(e.target.value)}><option value="pedestrian">À pied</option><option value="bicycle">À vélo</option></select></label><p role="status">{routeStatus}</p>{route&&<><strong>{route.distanceMeters} m · {Math.ceil(route.durationSeconds/60)} min</strong><ol>{route.instructions.map((step,i)=><li key={i}>{step.text} <small>({step.distanceMeters} m)</small></li>)}</ol><small>{route.attribution || `${route.engine} · © OpenStreetMap contributors`}</small></>}<p className="detail-note">Accessibilité du trajet non vérifiée. Les conditions réelles peuvent différer des données cartographiques.</p></section></article>}
  </section>
 </main>;
}
