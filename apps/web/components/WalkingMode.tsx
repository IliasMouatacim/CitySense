'use client';
import {useEffect,useRef,useState} from 'react';
import type {Map} from 'maplibre-gl';
import {ArrowUp,ArrowDown,ArrowLeft,ArrowRight,RotateCcw,RotateCw,Mouse,LogOut,LocateFixed,Footprints} from 'lucide-react';
import {createWalkController,type WalkAction,type WalkStatus} from '../lib/walk-controller';
import type {Position} from '../lib/walk-geometry';
import type {createCityPhysics} from '../lib/city-physics';
import StreetPhotos from './StreetPhotos';
import {WALK_EYE_HEIGHT} from '../lib/walk-settings';

export default function WalkingMode({map,start,lookAt,lookPitch=108,useExactStart=false,locationName,onExit}:{map:Map;start:Position;lookAt?:Position;lookPitch?:number;useExactStart?:boolean;locationName?:string;onExit:()=>void}) {
  const controller=useRef<ReturnType<typeof createWalkController>|null>(null),exit=useRef(onExit),origin=useRef(start),initialLook=useRef(lookAt);
  const initialPitch=useRef(lookPitch);
  exit.current=onExit;
  const [photoPosition,setPhotoPosition]=useState<Position|null>(null);
  const [status,setStatus]=useState<WalkStatus|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[attempt,setAttempt]=useState(0),[sprint,setSprint]=useState(false);
  const [playerFailed,setPlayerFailed]=useState(false);
  useEffect(()=>{
    const failure=()=>setPlayerFailed(true);map.on('citysense-player-error',failure);
    return ()=>{map.off('citysense-player-error',failure);};
  },[map]);
  useEffect(()=>{
    let cancelled=false,physics:Awaited<ReturnType<typeof createCityPhysics>>|undefined;
    import('../lib/city-physics').then(module=>module.createCityPhysics()).then(value=>{
      if(cancelled){value.dispose();return;}physics=value;
      try{controller.current=createWalkController(map,origin.current,setStatus,()=>exit.current(),value,useExactStart,initialLook.current);if(initialLook.current)map.fire('citysense-look-at',{coordinates:initialLook.current,pitch:initialPitch.current});setError('');}
      catch(e){setError(e instanceof Error?e.message:'Le mode piéton est indisponible.');}
    }).catch(()=>{if(!cancelled)setError('Les données du terrain n’ont pas pu être chargées. Réessayez.');});
    return()=>{cancelled=true;controller.current?.dispose();controller.current=null;physics?.dispose();};
  },[map,attempt,useExactStart]);
  function reset(){
    setSprint(false);controller.current?.reset();
    if(initialLook.current)map.fire('citysense-look-at',{coordinates:initialLook.current,pitch:initialPitch.current});
  }
  function direction(action:WalkAction,label:string,Icon:typeof ArrowUp){
    return <button aria-label={label} disabled={!status||!!error} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);controller.current?.press(action,true);}} onPointerUp={()=>controller.current?.press(action,false)} onPointerCancel={()=>controller.current?.press(action,false)} onLostPointerCapture={()=>controller.current?.press(action,false)} onKeyDown={event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();controller.current?.press(action,true);}}} onKeyUp={event=>{if(event.code==='Space'||event.code==='Enter'){event.preventDefault();controller.current?.press(action,false);}}} onBlur={()=>controller.current?.press(action,false)}><Icon size={21} aria-hidden="true"/></button>;
  }
  return <section className="walk-hud" aria-label="Exploration à pied" data-perspective="third-person" data-camera-distance={status?.cameraDistance} data-camera-elevation={status?.cameraElevation} data-player-heading={status?.facing} data-lon={status?.position[0]} data-lat={status?.position[1]} data-heading={status?.bearing} data-meters={status?.meters} data-eye-height={WALK_EYE_HEIGHT} data-eye-elevation={status?.eye} data-pixel-ratio={status?.pixelRatio} data-look-pitch={status?.pitch} data-fov={status?.fov} data-ground-elevation={status?.ground} data-camera-target={status?.cameraTarget}>
    <div className="walk-top"><div className="walk-title"><Footprints size={20}/><div><strong>{locationName||'Dans les rues de Montbéliard'}</strong><span>Le directeur du campus vous accompagne</span></div></div><button onClick={onExit} className="walk-exit"><LogOut size={17}/> Quitter la marche</button></div>
    <button className="walk-photo-open" disabled={!status} onClick={()=>{if(status)setPhotoPosition([...status.position]);}}>Photos des rues</button>
    {photoPosition&&<StreetPhotos map={map} position={photoPosition} onClose={()=>setPhotoPosition(null)}/>}
    {playerFailed&&<div className="walk-error" role="alert">Le personnage n’a pas pu être chargé. <button onClick={()=>{setPlayerFailed(false);map.fire('citysense-player-retry');}}>Réessayer</button></div>}
    {error&&<div role="alert" className="walk-error"><p>{error}</p><button onClick={()=>setAttempt(value=>value+1)}>Réessayer</button></div>}
    <div className="walk-telemetry"><span><Footprints size={14}/>{Math.floor(status?.meters||0)} m parcourus</span><span>{Math.round(status?.bearing||0)}°</span><span>Vue à la troisième personne</span></div>
    <div className="walk-bottom">
      <div className="walk-instructions"><strong className="walk-desktop-guide">ZQSD / WASD · flèches pour tourner</strong><strong className="walk-mobile-guide">Maintenez les flèches pour marcher</strong><span className="walk-desktop-guide">Glissez pour tourner la caméra · Maj pour courir · Échap pour quitter</span><span className="walk-mobile-guide">Glissez pour tourner autour du personnage.</span><div><button disabled={!status} onClick={()=>controller.current?.lock().catch(()=>setNotice('Capture de souris indisponible. Glissez dans la scène pour regarder.'))}><Mouse size={15}/>{status?.locked?'Souris capturée':'Capturer la souris'}</button><button onClick={reset} aria-label="Revenir au point de départ"><LocateFixed size={16}/></button><button aria-pressed={sprint} onClick={()=>{setSprint(!sprint);controller.current?.press('sprint',!sprint);}}>{sprint?'Courir : activé':'Courir'}</button></div></div>
      <div className="walk-touch" aria-label="Commandes de marche"><div className="walk-turn">{direction('turnLeft','Tourner à gauche',RotateCcw)}{direction('turnRight','Tourner à droite',RotateCw)}</div><div className="walk-pad">{direction('forward','Avancer',ArrowUp)}<div>{direction('left','Aller à gauche',ArrowLeft)}{direction('back','Reculer',ArrowDown)}{direction('right','Aller à droite',ArrowRight)}</div></div></div>
    </div>
    <p className="walk-collision" role="status">{status?.blocked?(status.boundary?'Limite de la zone pilote : faites demi-tour.':'Passage bloqué : contournez l’obstacle.'):notice}</p>
  </section>;
}
