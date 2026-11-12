'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map} from 'maplibre-gl';
import {Building2,Store,ChevronDown,MapPin,Search} from 'lucide-react';
import type {SceneMood} from '../lib/city-scene';
import type {CityPoi} from '../lib/city-details-data';
import type {DetailStatus,createCityDetails} from '../lib/city-details';
import {PHOTO_SOURCE,setPhotoGround} from '../lib/photo-city';
import {facadeReferences} from '../lib/facade-references';
import {campusReferences} from '../lib/campus-references';
import {CAMPUS_VISITS} from '../lib/campus-visits';

export default function CityDetails({map,mood,scale,dimensional,walking,routeCoordinates,campusVisit='stgi',onCampusVisit}:{map:Map;mood:SceneMood;scale:number;dimensional:boolean;walking:boolean;routeCoordinates?:number[][];campusVisit?:string;onCampusVisit?:(id:string)=>void}){
  const [enabled,setEnabled]=useState(true),[open,setOpen]=useState(false),[query,setQuery]=useState(''),[error,setError]=useState('');
  const [photo,setPhoto]=useState(true),[photoError,setPhotoError]=useState(false);
  const [walkingToolsOpen,setWalkingToolsOpen]=useState(false);
  const [status,setStatus]=useState<DetailStatus>({buildings:0,windows:0,signs:0,pois:[],street:''});
  const controller=useRef<ReturnType<typeof createCityDetails>|null>(null);
  const options=useRef({mood,scale,enabled:enabled&&dimensional,dimensional,walking,photo,routeCoordinates});options.current={mood,scale,enabled:enabled&&dimensional,dimensional,walking,photo,routeCoordinates};
  useEffect(()=>{
    // A distant tile can fail at walking pitches while the visible ground is
    // already loaded. Only abandon imagery after an initial complete outage.
    let loaded=false,timer:ReturnType<typeof setTimeout>|undefined;
    const received=(event:{sourceId?:string;tile?:{state?:string}})=>{
      if(event.sourceId!==PHOTO_SOURCE||event.tile?.state!=='loaded')return;
      loaded=true;if(timer)clearTimeout(timer);timer=undefined;
    };
    const failed=(event:{sourceId?:string})=>{
      if(event.sourceId!==PHOTO_SOURCE||loaded||timer||!options.current.photo)return;
      timer=setTimeout(()=>{timer=undefined;if(!loaded&&options.current.photo){setPhotoError(true);setPhoto(false);}},5000);
    };
    map.on('sourcedata',received);map.on('error',failed);
    return()=>{if(timer)clearTimeout(timer);map.off('sourcedata',received);map.off('error',failed);};
  },[map]);
  useEffect(()=>{setPhotoGround(map,photo,mood==='night');},[map,photo,mood]);
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
  return <section className="architecture-panel" aria-label="Détails de la ville" data-buildings={status.buildings} data-windows={status.windows} data-signs={status.signs} data-enabled={enabled&&dimensional} data-photo-roofs={status.photoRoofTriangles||0} data-photo-ground={status.photoGroundTriangles||0} data-campus-ground={status.campusGroundTriangles||0} data-route-segments={status.routeSegments||0} data-model-meshes={status.modelMeshes||0} data-reference-buildings={status.referenceBuildings||0} data-facade-photo-faces={status.facadePhotoFaces||0} data-campus={status.campus||false} data-campus-buildings={status.campusBuildings||0} data-campus-facades={status.campusFacades||0} data-campus-finished-walls={status.campusFinishedWalls||0} data-campus-estimated-facades={status.campusEstimatedFacades||0} data-campus-reference-buildings={status.campusReferenceBuildings||0} data-campus-environment={status.campusEnvironment||false} data-campus-fixtures={status.campusFixtures||0} data-campus-shadows={status.campusShadowResolution||0}>
    {walking&&status.street&&<div className="street-name"><MapPin size={14}/>{status.street}</div>}
    {walking&&status.campus&&<button className="walking-details-toggle" aria-expanded={walkingToolsOpen} aria-controls="walking-details-content" onClick={()=>setWalkingToolsOpen(!walkingToolsOpen)}><Building2 size={14}/>{walkingToolsOpen?'Masquer les détails':'Options et lieux'}<ChevronDown size={14}/></button>}
    {error&&<p role="status">{error}</p>}
    <div id="walking-details-content" className="walking-details-content" data-expanded={walkingToolsOpen}>
    <div className="architecture-actions"><button aria-pressed={enabled} disabled={!dimensional} onClick={()=>setEnabled(!enabled)}><Building2 size={15}/> Façades {enabled?'détaillées':'simples'}</button><button aria-expanded={open} aria-controls="city-businesses" onClick={()=>setOpen(!open)}><Store size={15}/> Noms et commerces <ChevronDown size={13}/></button></div>
    <label className="photo-choice"><span>{walking&&status.campus?'Toits':'Sol et toits'}</span><select aria-label="Style de la ville" value={photo?'photo':'map'} onChange={e=>{setPhoto(e.target.value==='photo');setPhotoError(false);if(walking)map.getCanvas().focus({preventScroll:true});}}><option value="photo">Photo + 3D</option><option value="map">Carte 3D</option></select></label>
    <p className="architecture-credit">{walking&&status.campus?(photo?'Sols texturés · Toits IGN':'Sols texturés · Carte 3D'):photo?'Photos IGN · Façades stylisées':'Noms OSM · Façades stylisées'}</p>
    {status.campus&&!walking&&onCampusVisit&&<label className="photo-choice"><span>Explorer</span><select aria-label="Secteur du campus" value={campusVisit} onChange={e=>onCampusVisit(e.target.value)}>{CAMPUS_VISITS.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}</select></label>}
    {status.campus&&<details className="facade-evidence"><summary>Campus Portes du Jura · {status.campusReferenceBuildings||0} volumes détaillés</summary><p>UFR STGI et IUT Mesures physiques : béton, parois peintes, vitrages et éléments colorés ; bibliothèque : bandeaux maçonnés et verrières ; UTBM : écran de bois et lettrage ; restaurant CROUS : baies vitrées, parois blanches et éléments bleus et rouges. Modélisation d’après photographies institutionnelles et Wikimedia Commons sur emprises IGN. Dimensions et correspondances de façades estimées. Les ailes d’enseignement sont prolongées par des fenêtres estimées ; joints de béton, couvertines et descentes d’eau sont des détails de restitution, non relevés sur place. Les photos peuvent être anciennes ; seules les dates connues sont indiquées.</p><p>{status.campusFacades||0} faces d’après photos · {status.campusEstimatedFacades||0} faces à fenêtres estimées · {status.campusFinishedWalls||0} murs avec finitions.</p><p>Sources consultées : {campusReferences.sources.map((s,i)=><span key={s.id}>{i>0?' · ':''}<a href={s.url} target="_blank" rel="noreferrer">{s.author?`${s.id.startsWith('crous')?'CROUS':'STGI'} · ${s.author}`:s.id==='utbm'?'UTBM':s.id==='library'?'Bibliothèque':s.id.includes('plan')?'Plan':`STGI ${i+1}`}</a>{s.captureDate&&` (${s.captureDate} · ${s.license})`}</span>)}. Observations : novembre 2026. Photos originales non redistribuées.</p></details>}
    {!!status.referenceBuildings&&<details className="facade-evidence"><summary>{status.referenceBuildings} bâtiments · Panoramax</summary><p>Tour photographiée ; immeuble gris : front reconstruit et côté photographié ; commerce bleu modélisé d’après les vues. Parties cachées non documentées ; autres bâtiments stylisés.</p><p>Photos du 21 août 2026 · <a href={facadeReferences.source.url} target="_blank" rel="noreferrer">Panorama principal</a>{facadeReferences.additionalSources.map((source,i)=><span key={source.id}> · <a href={source.url} target="_blank" rel="noreferrer">Vue {i+2}</a></span>)}</p></details>}
    {!!status.referenceBuildings&&<p className="architecture-credit"><a href={facadeReferences.source.url} target="_blank" rel="noreferrer">Panoramax © {facadeReferences.source.author}</a> · <a href={facadeReferences.source.licenseUrl} target="_blank" rel="noreferrer">CC-BY-SA-4.0</a> · façades adaptées</p>}
    {status.facadePhotoFailed&&<p role="status">Textures de façade indisponibles ; volumes simplifiés affichés.</p>}
    {photoError&&<p role="status">Photos indisponibles. La carte reste utilisable.</p>}
    {open&&<div id="city-businesses" className="city-businesses"><strong>Autour de vous <span>{status.pois.length}</span></strong><label><Search size={14}/><input aria-label="Filtrer les commerces visibles" placeholder="Café, boutique, musée…" value={query} onChange={e=>setQuery(e.target.value)}/></label><ul>{list.slice(0,30).map(p=><li key={p.id}><button onClick={()=>focus(p)}><i style={{background:p.color}}/><span><strong>{p.name}</strong><small>{p.category} · {p.distance} m</small></span><MapPin size={13}/></button></li>)}</ul>{!list.length&&<p>{query?'Aucun lieu ne correspond.':'Zoomez sur les rues pour charger les lieux cartographiés.'}</p>}<small>{walking?'Choisissez un lieu pour regarder dans sa direction.':'Choisissez un lieu pour le voir sur la carte.'} Données OpenStreetMap, disponibilité non vérifiée.</small></div>}
    </div>
  </section>;
}
