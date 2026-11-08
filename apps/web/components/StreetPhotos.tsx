'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map} from 'maplibre-gl';
import {nearbyStreetPhotos,type StreetPhoto} from '../lib/street-photos';
import '@photo-sphere-viewer/core/index.css';

export default function StreetPhotos({map,position,onClose}:{map:Map;position:[number,number];onClose:()=>void}){
 const dialog=useRef<HTMLDialogElement>(null),container=useRef<HTMLDivElement>(null),[photos,setPhotos]=useState<StreetPhoto[]>([]),[index,setIndex]=useState(0),[message,setMessage]=useState('Recherche de photos réelles à proximité…'),[attempt,setAttempt]=useState(0);
 const photo=photos[index];
 useEffect(()=>{dialog.current?.showModal();map.fire('citysense-walk-pause',{paused:true});return()=>{map.fire('citysense-walk-pause',{paused:false});map.getCanvas().focus({preventScroll:true});};},[map]);
 useEffect(()=>{const abort=new AbortController();setMessage('Recherche de photos réelles à proximité…');nearbyStreetPhotos(...position,abort.signal).then(items=>{setPhotos(items);setIndex(0);setMessage(items.length?'':'Aucune photo publiée dans ce rayon. Revenez à la marche pour explorer une autre rue.');}).catch(error=>{if(error.name!=='AbortError')setMessage('Photos indisponibles. Vérifiez votre connexion ou réessayez.');});return()=>abort.abort();},[position,attempt]);
 useEffect(()=>{
  let cancelled=false,viewer:{destroy:()=>void}|undefined;
  if(photo?.panorama&&container.current)import('@photo-sphere-viewer/core').then(({Viewer})=>{if(cancelled||!container.current)return;viewer=new Viewer({container:container.current,panorama:photo.image,navbar:['zoom','move','fullscreen'],caption:'Panoramax'});}).catch(()=>{if(!cancelled)setMessage('Le panorama ne peut pas être affiché.');});
  return()=>{cancelled=true;viewer?.destroy();};
 },[photo]);
 return <dialog className="street-photo-dialog" ref={dialog} aria-label="Photos réelles des rues" onCancel={event=>{event.preventDefault();onClose();}} onKeyDown={event=>{event.stopPropagation();if(event.key==='Escape'){event.preventDefault();onClose();}}}>
  <div className="street-photo-header"><div><strong>Photos réelles · Panoramax</strong><small>La marche est en pause. Photos prises à des positions précises.</small></div><button onClick={onClose}>Reprendre la marche</button></div>
  <p role="status">{message}</p>
  {photo&&<><div className="street-photo-image">{photo.panorama?<div ref={container} className="street-photo-panorama"/>:<img src={photo.image} alt={`Vue de rue Panoramax à environ ${photo.distance} mètres`} referrerPolicy="no-referrer" onError={()=>setMessage('Cette photo ne peut pas être chargée.')}/>}</div><p className="street-photo-credit">{photo.author} · {photo.license} · {photo.date.slice(0,10)} · ≈ {photo.distance} m du point de départ · <a href={`https://explore.panoramax.fr/#focus=pic&pic=${encodeURIComponent(photo.id)}`} target="_blank" rel="noreferrer">Source et métadonnées</a></p><nav aria-label="Parcourir les photos"><button disabled={index===0} onClick={()=>setIndex(index-1)}>Photo précédente</button><span>{index+1} / {photos.length}</span><button disabled={index===photos.length-1} onClick={()=>setIndex(index+1)}>Photo suivante</button></nav></>}
  {!photos.length&&<button onClick={()=>setAttempt(attempt+1)}>Réessayer</button>}
 </dialog>;
}
