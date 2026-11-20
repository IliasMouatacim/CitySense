import {directorTrail} from './director-trail';
import {LngLat,type Map} from 'maplibre-gl';
import {advance,blocked,distance,movementStopped,makeObstacle,nearestOnLine,offset,withinPilot,walkFrame,type Obstacle,type Position} from './walk-geometry';
import {changedBaseTiles,cityBuildingFeatures,getCityWorld} from './city-world';
import type {createCityPhysics} from './city-physics';
import {WALK_EYE_HEIGHT,WALK_SPEED,RUN_SPEED,walkBob} from './walk-settings';
import {walkingGroundHeight} from './walking-ground';
export type WalkAction='forward'|'back'|'left'|'right'|'turnLeft'|'turnRight'|'sprint';
export type WalkStatus={position:Position;bearing:number;pitch:number;fov:number;meters:number;blocked:boolean;boundary:boolean;locked:boolean;ground:number;cameraTarget:number;eye:number;pixelRatio:number};
export function createWalkController(map:Map,origin:Position,onStatus:(status:WalkStatus)=>void,onExit:()=>void,physics?:Awaited<ReturnType<typeof createCityPhysics>>,useExactStart=false,lookAt?:Position) {
  const canvas=map.getCanvas(),saved={center:map.getCenter(),zoom:map.getZoom(),bearing:map.getBearing(),pitch:map.getPitch(),padding:map.getPadding(),elevation:map.getCameraTargetElevation()},maxPitch=map.getMaxPitch(),maxZoom=map.getMaxZoom();
  const handlers=[map.dragPan,map.dragRotate,map.scrollZoom,map.boxZoom,map.doubleClickZoom,map.keyboard,map.touchZoomRotate,map.touchPitch];
  if(!withinPilot(origin))throw new Error('Le mode marche couvre le centre de Montbéliard. Quittez puis choisissez Centre historique.');
  if(physics&&physics.height(origin)===null)throw new Error('La marche détaillée couvre le centre de Montbéliard. Revenez au point de vue Centre historique.');
  const enabled=handlers.map(h=>h.isEnabled());
  const centerClamped=map.getCenterClampedToGround();
  const verticalFov=map.getVerticalFieldOfView();
  const pixelRatio=map.getPixelRatio(),reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const symbolLayers=map.getStyle().layers.filter(layer=>layer.type==='symbol').map(layer=>({id:layer.id,visibility:map.getLayoutProperty(layer.id,'visibility')||'visible'}));
  let disposed=false;
  let paused=false;
  let obstacles:Obstacle[]=[],bridges:number[][][]=[],roads:{line:number[][];priority:number}[]=[];
  const obstacleCache=new WeakMap<number[][][],Obstacle>();
  let neighborhood:Position|undefined,nearbyObstacles:Obstacle[]=[];
  function blockedWhileWalking(point:Position){
    if(!neighborhood||distance(point,neighborhood)>20){
      neighborhood=point;
      // The 25 m square includes the avatar probes throughout the 20 m reuse radius.
      const southwest=offset(point,-25,-25),northeast=offset(point,25,25);
      nearbyObstacles=obstacles.filter(({bounds:[w,s,e,n]})=>e>=southwest[0]&&w<=northeast[0]&&n>=southwest[1]&&s<=northeast[1]);
    }
    return blocked(point,nearbyObstacles,bridges);
  }
  function refreshGeometry(collectSpawnRoads=false){
    if(disposed)return;
    obstacles=[];bridges=[];neighborhood=undefined;
    for(const sourceLayer of ['building','water']){
      for(const feature of sourceLayer==='building'?cityBuildingFeatures(map):map.querySourceFeatures('openmaptiles',{sourceLayer})){
        if(sourceLayer==='building'&&feature.properties?.walkUnder===true)continue;
        const g=feature.geometry;
        const polygons=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
        for(const rings of polygons){
          let obstacle=obstacleCache.get(rings);
          if(!obstacle){obstacle=makeObstacle(rings,sourceLayer==='building'?'building':'water');obstacleCache.set(rings,obstacle);}
          obstacles.push(obstacle);
        }
      }
    }
    for(const feature of map.querySourceFeatures('openmaptiles',{sourceLayer:'transportation'})){
      const p=feature.properties||{};if(['motorway','trunk','rail','transit'].includes(p.class))continue;
      const g=feature.geometry,lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];
      for(const line of lines){if(line.length<2)continue;if(collectSpawnRoads)roads.push({line,priority:['path','pedestrian','footway'].includes(p.class)?0:8});if(p.brunnel==='bridge')bridges.push(line);}
    }
    const streets=getCityWorld()?.streets;
    if(streets){
      if(collectSpawnRoads)roads=streets.roads.filter(r=>!['motorway','trunk','steps','construction','proposed'].includes(r.tags.highway)&&r.tags.access!=='private').map(r=>({line:r.coordinates,priority:['path','pedestrian','footway'].includes(r.tags.highway)?0:8}));
      for(const road of streets.roads)if(road.tags.bridge==='yes')bridges.push(road.coordinates);
    }
  }
  refreshGeometry(true);
  const candidates=roads.map(road=>({point:nearestOnLine(origin,road.line),priority:road.priority,line:road.line})).filter(c=>withinPilot(c.point)&&(!physics||physics.height(c.point)!==null)&&distance(origin,c.point)<250&&!blocked(c.point,obstacles,bridges)).sort((a,b)=>distance(origin,a.point)+a.priority-distance(origin,b.point)-b.priority);
  const angleDifference=(a:number,b:number)=>Math.abs(((a-b+540)%360)-180);
  function hasClearStart(start:Position,direction:number){
    let point=start,travelled=0;
    for(let step=0;step<6;step++){
      const next=advance(point,direction,1,0,.5);
      if(blocked(next,obstacles,bridges)||physics&&physics.height(next)===null)return false;
      const resolved=physics?physics.move(point,next):next;
      travelled+=distance(point,resolved);point=resolved;
    }
    return travelled>2.7;
  }
  let chosen:{point:Position;heading:number}|undefined;
  if(useExactStart&&!blocked(origin,obstacles,bridges)){
    // The saved camera can be beside a mapped footway, as long as the spawn
    // has terrain and enough clearance to begin walking.
    const heading=[map.getBearing(),map.getBearing()+90,map.getBearing()+180,map.getBearing()+270]
      .find(direction=>hasClearStart(origin,direction));
    if(heading!==undefined)chosen={point:origin,heading};
  }
  if(!chosen&&!candidates.length)throw new Error('Les rues ne sont pas encore chargées. Attendez un instant puis réessayez.');
  for(const candidate of candidates){
    if(chosen)break;
    let heading=map.getBearing(),nearest=Infinity;
    for(let i=1;i<candidate.line.length;i++){const a=candidate.line[i-1],b=candidate.line[i],d=distance(candidate.point,nearestOnLine(candidate.point,[a,b]));if(d<nearest){nearest=d;heading=Math.atan2((b[0]-a[0])*Math.cos(candidate.point[1]*Math.PI/180),b[1]-a[1])*180/Math.PI;}}
    const headings=[heading,heading+180].sort((a,b)=>angleDifference(a,map.getBearing())-angleDifference(b,map.getBearing()));
    const direction=headings.find(value=>hasClearStart(candidate.point,value));
    if(direction!==undefined)chosen={point:candidate.point,heading:direction};
  }
  if(!chosen)throw new Error('Aucun départ dégagé trouvé dans ces rues. Essayez le point de vue Centre historique.');
  const spawn=chosen.point,streetBearing=chosen.heading;
  let position:Position=[...spawn],bearing=streetBearing,pitch=87,meters=0,locked=false,wasLocked=false,dirty=true,collision=false,boundary=false,last=performance.now(),reported=0,frame=0,bob=0,eye=walkingGroundHeight(spawn)+WALK_EYE_HEIGHT,slowTime=0;
  const facing=lookAt?Math.atan2((lookAt[0]-spawn[0])*Math.cos(spawn[1]*Math.PI/180),lookAt[1]-spawn[1])*180/Math.PI:streetBearing;
  const directorBearing=[facing+18,facing-18,facing].find(angle=>hasClearStart(spawn,angle))??streetBearing;
  const directorStart=advance(spawn,directorBearing,1,0,2);
  let follow=directorTrail(directorStart,spawn);
  function reportDirector(){
    const point=follow(position);
    map.fire('citysense-director',{coordinates:point,ground:walkingGroundHeight(point),player:position});
  }
  map.on('citysense-request-director',reportDirector);
  const keys=new Set<string>();let sprintMode=false;
  handlers.forEach(h=>h.disable());map.stop();map.setCenterClampedToGround(false);map.setMaxPitch(135);map.setMaxZoom(24);map.setVerticalFieldOfView(72);
  map.setPixelRatio(Math.min(pixelRatio,1.25));
  for(const layer of symbolLayers)map.setLayoutProperty(layer.id,'visibility','none');
  const resized=()=>{dirty=true;wake();};map.on('resize',resized);
  const originalTouchAction=canvas.style.touchAction,originalLabel=canvas.getAttribute('aria-label');canvas.setAttribute('aria-label','Scène de marche : ZQSD ou WASD pour marcher, flèches pour tourner, Échap pour quitter.');canvas.style.touchAction='none';canvas.focus({preventScroll:true});
  function applyCamera(){
    const radians=pitch*Math.PI/180,heading=bearing*Math.PI/180,horizontal=30*Math.sin(radians);
    const target=offset(position,Math.sin(heading)*horizontal,Math.cos(heading)*horizontal);
    eye=walkingGroundHeight(position)+WALK_EYE_HEIGHT+bob;
    map.jumpTo(map.calculateCameraOptionsFromTo(new LngLat(...position),eye,new LngLat(...target),eye-30*Math.cos(radians)));
    map.fire('citysense-walk-position',{coordinates:[...position],eye});
    reportDirector();
  }
  function focusPlace(event:{coordinates?:Position;pitch?:number}){
    const target=event.coordinates;if(!target||!target.every(Number.isFinite))return;
    bearing=Math.atan2((target[0]-position[0])*Math.cos(position[1]*Math.PI/180),target[1]-position[1])*180/Math.PI;pitch=Number.isFinite(event.pitch)?Math.max(60,Math.min(135,event.pitch!)):87;dirty=true;wake();
  }
  map.on('citysense-look-at',focusPlace);
  function status(){onStatus({position:[...position],bearing:((bearing%360)+360)%360,pitch,fov:map.getVerticalFieldOfView(),meters,blocked:collision,boundary,locked,ground:walkingGroundHeight(position),cameraTarget:map.getCameraTargetElevation(),eye,pixelRatio:map.getPixelRatio()});}
  const keyCodes=['KeyW','KeyZ','KeyS','KeyA','KeyQ','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
  const typing=(target:EventTarget|null)=>target instanceof HTMLElement&&Boolean(target.closest('input,textarea,select,[contenteditable=true]'));
  function keyDown(event:KeyboardEvent){
    if(paused||event.defaultPrevented)return;
    if(typing(event.target)){clear();return;}
    if(event.code==='Escape'){event.preventDefault();onExit();return;}
    if(!keyCodes.includes(event.code))return;
    event.preventDefault();keys.add(event.code);wake();
  }
  function keyUp(event:KeyboardEvent){keys.delete(event.code);}
  function focusIn(event:FocusEvent){if(typing(event.target))clear();}
  function clear(){keys.clear();drag=null;last=performance.now();}
  function pause(event:{paused?:boolean}){paused=Boolean(event.paused);clear();}
  map.on('citysense-walk-pause',pause);
  function hidden(){if(document.hidden)clear();}
  function look(dx:number,dy:number){bearing+=dx*.13;pitch=Math.max(60,Math.min(135,pitch-dy*.12));dirty=true;wake();}
  let drag:{id:number;x:number;y:number}|null=null;
  function down(e:PointerEvent){if(e.button!==0||document.pointerLockElement===canvas)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});}
  function move(e:PointerEvent){if(document.pointerLockElement===canvas||!drag||drag.id!==e.pointerId)return;e.preventDefault();look(e.clientX-drag.x,e.clientY-drag.y);drag={id:e.pointerId,x:e.clientX,y:e.clientY};}
  function up(){drag=null;}
  function lockedMove(e:MouseEvent){if(document.pointerLockElement===canvas)look(e.movementX,e.movementY);}
  function lockChange(){locked=document.pointerLockElement===canvas;if(wasLocked&&!locked){onExit();return;}wasLocked=locked;status();}
  let geometryTimer:ReturnType<typeof setTimeout>|undefined;
  function sourceData(event:Parameters<typeof changedBaseTiles>[0]){
    if(!changedBaseTiles(event)||geometryTimer!==undefined)return;
    geometryTimer=setTimeout(()=>{geometryTimer=undefined;refreshGeometry();},200);
  }
  const held=(...codes:string[])=>codes.some(code=>keys.has(code));
  function wake(){
    if(disposed||frame)return;
    last=performance.now();
    frame=requestAnimationFrame(tick);
  }
  function tick(now:number){
    frame=0;
    const seconds=(now-last)/1000,timing=walkFrame(seconds);last=now;
    const turn=Number(held('ArrowRight','touch:turnRight'))-Number(held('ArrowLeft','touch:turnLeft'));
    const forward=Number(held('KeyW','KeyZ','ArrowUp','touch:forward'))-Number(held('KeyS','ArrowDown','touch:back'));
    const strafe=Number(held('KeyD','touch:right'))-Number(held('KeyA','KeyQ','touch:left'));
    const active=!paused&&Boolean(turn||forward||strafe);
    // Bound GPU fill cost on high-DPI displays and struggling devices. Geometry
    // and camera coordinates remain unchanged; restore the user's ratio on exit.
    slowTime=active&&seconds>1/28?slowTime+Math.min(seconds,1):Math.max(0,slowTime-seconds);
    if(slowTime>2&&map.getPixelRatio()>.75){map.setPixelRatio(Math.max(.75,map.getPixelRatio()-.25));slowTime=0;dirty=true;}
    const before=meters;
    if(turn&&!paused){bearing+=turn*85*timing.elapsed;dirty=true;}
    collision=false;boundary=false;
    if(!paused&&(forward||strafe)){
      const speed=sprintMode||held('ShiftLeft','ShiftRight')?RUN_SPEED:WALK_SPEED;
      for(let step=0;step<timing.steps;step++){
        const next=advance(position,bearing,forward,strafe,speed*timing.step);
        if(withinPilot(next)&&(!physics||physics.height(next)!==null)&&!blockedWhileWalking(next)){
          const resolved=physics?physics.move(position,next):next;
          collision=movementStopped(position,next,resolved);
          if(resolved[0]!==position[0]||resolved[1]!==position[1]){
            meters+=distance(position,resolved);position=resolved;follow(position);dirty=true;
          }
        }else{collision=true;boundary=!withinPilot(next)||Boolean(physics&&physics.height(next)===null);break;}
      }
    }
    const nextBob=!reducedMotion.matches&&meters>before?walkBob(meters):bob*Math.exp(-timing.elapsed*12);
    const settledBob=Math.abs(nextBob)<.0001?0:nextBob;
    if(settledBob!==bob){bob=settledBob;dirty=true;}
    if(dirty){applyCamera();dirty=false;}
    const animating=active||bob!==0;
    if(!animating||now-reported>150){status();reported=now;}
    if(animating&&!frame&&!disposed)frame=requestAnimationFrame(tick);
  }
  window.addEventListener('focusin',focusIn);window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',hidden);document.addEventListener('mousemove',lockedMove);document.addEventListener('pointerlockchange',lockChange);
  canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move,{passive:false});canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);map.on('sourcedata',sourceData);
  const controller={
    press(action:WalkAction,active:boolean){if(action==='sprint'){sprintMode=active;return;}if(active){keys.add('touch:'+action);wake();}else keys.delete('touch:'+action);},
    look,
    async lock(){if(canvas.requestPointerLock)await canvas.requestPointerLock();},
    reset(){clear();sprintMode=false;bob=0;position=[...spawn];follow=directorTrail(directorStart,spawn);bearing=streetBearing;pitch=87;dirty=true;collision=false;boundary=false;wake();},
    dispose(){
      if(disposed)return;disposed=true;map.off('citysense-request-director',reportDirector);cancelAnimationFrame(frame);clear();map.off('sourcedata',sourceData);clearTimeout(geometryTimer);map.off('resize',resized);map.off('citysense-look-at',focusPlace);map.off('citysense-walk-pause',pause);
      window.removeEventListener('focusin',focusIn);window.removeEventListener('keydown',keyDown);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',hidden);document.removeEventListener('mousemove',lockedMove);document.removeEventListener('pointerlockchange',lockChange);
      canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',up);canvas.removeEventListener('lostpointercapture',up);canvas.style.touchAction=originalTouchAction;if(originalLabel===null)canvas.removeAttribute('aria-label');else canvas.setAttribute('aria-label',originalLabel);
      if(document.pointerLockElement===canvas)document.exitPointerLock();
      try{for(const layer of symbolLayers)if(map.getLayer(layer.id))map.setLayoutProperty(layer.id,'visibility',layer.visibility);map.setCenterClampedToGround(centerClamped);map.setVerticalFieldOfView(verticalFov);map.setPixelRatio(pixelRatio);map.jumpTo(saved);map.setMaxPitch(maxPitch);map.setMaxZoom(maxZoom);handlers.forEach((h,i)=>{if(enabled[i])h.enable();});}catch{/* Map may already be removed during page teardown. */}
    }
  };
  try{applyCamera();dirty=false;status();}catch(error){controller.dispose();throw error;}
  return controller;
}
