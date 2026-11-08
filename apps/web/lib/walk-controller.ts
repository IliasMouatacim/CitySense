import {LngLat,type Map} from 'maplibre-gl';
import {advance,blocked,distance,makeObstacle,nearestOnLine,offset,withinPilot,type Obstacle,type Position} from './walk-geometry';
export type WalkAction='forward'|'back'|'left'|'right'|'turnLeft'|'turnRight'|'sprint';
export type WalkStatus={position:Position;bearing:number;pitch:number;meters:number;blocked:boolean;boundary:boolean;locked:boolean};
export function createWalkController(map:Map,origin:Position,onStatus:(status:WalkStatus)=>void,onExit:()=>void) {
  const canvas=map.getCanvas(),saved={center:map.getCenter(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch(),padding:map.getPadding(),elevation:map.getCameraTargetElevation()},maxPitch=map.getMaxPitch(),maxZoom=map.getMaxZoom();
  const handlers=[map.dragPan,map.dragRotate,map.scrollZoom,map.boxZoom,map.doubleClickZoom,map.keyboard,map.touchZoomRotate,map.touchPitch];
  if(!withinPilot(origin))throw new Error('Le mode marche couvre le centre de Montbéliard. Quittez puis choisissez Centre historique.');
  const enabled=handlers.map(h=>h.isEnabled());
  let disposed=false;
  let obstacles:Obstacle[]=[],bridges:number[][][]=[],roads:{line:number[][];priority:number}[]=[];
  function refreshGeometry(){
    if(disposed)return;
    obstacles=[];bridges=[];roads=[];
    for(const sourceLayer of ['building','water']){
      for(const feature of map.querySourceFeatures('openmaptiles',{sourceLayer})){
        const g=feature.geometry;
        if(g.type==='Polygon')obstacles.push(makeObstacle(g.coordinates,sourceLayer==='building'?'building':'water'));
        if(g.type==='MultiPolygon')for(const rings of g.coordinates)obstacles.push(makeObstacle(rings,sourceLayer==='building'?'building':'water'));
      }
    }
    for(const feature of map.querySourceFeatures('openmaptiles',{sourceLayer:'transportation'})){
      const p=feature.properties||{};if(['motorway','trunk','rail','transit'].includes(p.class))continue;
      const g=feature.geometry,lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];
      for(const line of lines){if(line.length<2)continue;roads.push({line,priority:['path','pedestrian','footway'].includes(p.class)?0:8});if(p.brunnel==='bridge')bridges.push(line);}
    }
  }
  refreshGeometry();
  const candidates=roads.map(road=>({point:nearestOnLine(origin,road.line),priority:road.priority,line:road.line})).filter(c=>withinPilot(c.point)&&distance(origin,c.point)<250&&!blocked(c.point,obstacles,bridges)).sort((a,b)=>distance(origin,a.point)+a.priority-distance(origin,b.point)-b.priority);
  if(!candidates.length)throw new Error('Les rues ne sont pas encore chargées. Attendez un instant puis réessayez.');
  const spawn=candidates[0].point;
  let streetBearing=map.getBearing(),segmentDistance=Infinity;
  for(let i=1;i<candidates[0].line.length;i++){
    const a=candidates[0].line[i-1],b=candidates[0].line[i],d=distance(spawn,nearestOnLine(spawn,[a,b]));
    if(d<segmentDistance){segmentDistance=d;streetBearing=Math.atan2((b[0]-a[0])*Math.cos(spawn[1]*Math.PI/180),b[1]-a[1])*180/Math.PI;}
  }
  const angleDifference=(a:number,b:number)=>Math.abs(((a-b+540)%360)-180);
  if(angleDifference(streetBearing+180,map.getBearing())<angleDifference(streetBearing,map.getBearing()))streetBearing+=180;
  let position:Position=[...spawn],bearing=streetBearing,pitch=87,meters=0,locked=false,wasLocked=false,dirty=true,collision=false,boundary=false,last=performance.now(),reported=0,geometryTime=0,frame=0;
  const keys=new Set<string>();let sprintMode=false;
  handlers.forEach(h=>h.disable());map.stop();map.setMaxPitch(110);map.setMaxZoom(24);
  const resized=()=>{dirty=true;};map.on('resize',resized);
  const originalTouchAction=canvas.style.touchAction,originalLabel=canvas.getAttribute('aria-label');canvas.setAttribute('aria-label','Scène de marche : ZQSD ou WASD pour marcher, flèches pour tourner, Échap pour quitter.');canvas.style.touchAction='none';canvas.focus({preventScroll:true});
  function applyCamera(){
    const radians=pitch*Math.PI/180,heading=bearing*Math.PI/180,horizontal=30*Math.sin(radians);
    const target=offset(position,Math.sin(heading)*horizontal,Math.cos(heading)*horizontal);
    map.jumpTo(map.calculateCameraOptionsFromTo(new LngLat(...position),1.8,new LngLat(...target),1.8-30*Math.cos(radians)));
  }
  function focusPlace(event:{coordinates?:Position}){
    const target=event.coordinates;if(!target||!target.every(Number.isFinite))return;
    bearing=Math.atan2((target[0]-position[0])*Math.cos(position[1]*Math.PI/180),target[1]-position[1])*180/Math.PI;pitch=87;dirty=true;
  }
  map.on('citysense-look-at',focusPlace);
  function status(){onStatus({position:[...position],bearing:((bearing%360)+360)%360,pitch,meters,blocked:collision,boundary,locked});map.fire('citysense-walk-position',{coordinates:[...position]});}
  const keyCodes=['KeyW','KeyZ','KeyS','KeyA','KeyQ','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
  const typing=(target:EventTarget|null)=>target instanceof HTMLElement&&Boolean(target.closest('input,textarea,select,[contenteditable=true]'));
  function keyDown(event:KeyboardEvent){
    if(event.code==='Escape'){event.preventDefault();onExit();return;}
    if(typing(event.target)||!keyCodes.includes(event.code))return;
    event.preventDefault();keys.add(event.code);
  }
  function keyUp(event:KeyboardEvent){keys.delete(event.code);}
  function clear(){keys.clear();drag=null;}
  function hidden(){if(document.hidden)clear();}
  function look(dx:number,dy:number){bearing+=dx*.13;pitch=Math.max(60,Math.min(110,pitch-dy*.12));dirty=true;}
  let drag:{id:number;x:number;y:number}|null=null;
  function down(e:PointerEvent){if(e.button!==0||document.pointerLockElement===canvas)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});}
  function move(e:PointerEvent){if(document.pointerLockElement===canvas||!drag||drag.id!==e.pointerId)return;e.preventDefault();look(e.clientX-drag.x,e.clientY-drag.y);drag={id:e.pointerId,x:e.clientX,y:e.clientY};}
  function up(){drag=null;}
  function lockedMove(e:MouseEvent){if(document.pointerLockElement===canvas)look(e.movementX,e.movementY);}
  function lockChange(){locked=document.pointerLockElement===canvas;if(wasLocked&&!locked){onExit();return;}wasLocked=locked;status();}
  let geometryQueued=false;
  function sourceData(event:{sourceId?:string}){if(event.sourceId!=='openmaptiles'||geometryQueued||performance.now()-geometryTime<750)return;geometryQueued=true;queueMicrotask(()=>{if(disposed)return;geometryQueued=false;geometryTime=performance.now();refreshGeometry();});}
  const held=(...codes:string[])=>codes.some(code=>keys.has(code));
  function tick(now:number){
    const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
    const turn=Number(held('ArrowRight','touch:turnRight'))-Number(held('ArrowLeft','touch:turnLeft'));
    if(turn){bearing+=turn*85*dt;dirty=true;}
    const forward=Number(held('KeyW','KeyZ','ArrowUp','touch:forward'))-Number(held('KeyS','ArrowDown','touch:back'));
    const strafe=Number(held('KeyD','touch:right'))-Number(held('KeyA','KeyQ','touch:left'));
    collision=false;boundary=false;
    if(forward||strafe){
      const speed=sprintMode||held('ShiftLeft','ShiftRight')?3.2:1.55;
      const next=advance(position,bearing,forward,strafe,speed*dt);
      if(withinPilot(next)&&!blocked(next,obstacles,bridges)){meters+=distance(position,next);position=next;dirty=true;}else{collision=true;boundary=!withinPilot(next);}
    }
    if(dirty){applyCamera();dirty=false;}
    if(now-reported>150){status();reported=now;}
    frame=requestAnimationFrame(tick);
  }
  window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',hidden);document.addEventListener('mousemove',lockedMove);document.addEventListener('pointerlockchange',lockChange);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move,{passive:false});canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);map.on('sourcedata',sourceData);map.on('idle',refreshGeometry);
  const controller={
    press(action:WalkAction,active:boolean){if(action==='sprint'){sprintMode=active;return;}if(active)keys.add('touch:'+action);else keys.delete('touch:'+action);},
    look,
    async lock(){if(canvas.requestPointerLock)await canvas.requestPointerLock();},
    reset(){clear();sprintMode=false;position=[...spawn];bearing=streetBearing;pitch=87;dirty=true;collision=false;boundary=false;},
    dispose(){
      if(disposed)return;disposed=true;cancelAnimationFrame(frame);clear();map.off('sourcedata',sourceData);map.off('idle',refreshGeometry);map.off('resize',resized);map.off('citysense-look-at',focusPlace);
      window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('mousemove',lockedMove);document.removeEventListener('pointerlockchange',lockChange);
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.style.touchAction=originalTouchAction;if(originalLabel===null)canvas.removeAttribute('aria-label');else canvas.setAttribute('aria-label',originalLabel);
      if(document.pointerLockElement===canvas)document.exitPointerLock();
      try{map.jumpTo(saved);map.setMaxPitch(maxPitch);map.setMaxZoom(maxZoom);handlers.forEach((h,i)=>{if(enabled[i])h.enable();});}catch{/* Map may already be removed during page teardown. */}
    }
  };
  try{applyCamera();status();frame=requestAnimationFrame(tick);}catch(error){controller.dispose();throw error;}
  return controller;
}
