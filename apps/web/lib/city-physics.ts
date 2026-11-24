import {cycleLockers,directoryPosition,forecourtLamps,forecourtPoint,libraryAxis} from './library-forecourt';
import {amphitheatreStairHeight} from './amphitheatre';
import RAPIER from '@dimforge/rapier3d-compat';
import {terrainHeight,loadCityWorld,inMontbeliard,municipalTerrainVertices} from './city-world';
import {metersBetween} from './city-details-data';
import type {Position} from './walk-geometry';
import {CAMPUS_COURTYARD,STGI_GARDEN_LAWN_LIFT} from './campus-courtyard';
import {campusFacadeSolids} from './campus-facade-solids';
import {shelterAngle,shelterOffset} from './campus-shelter';
import {streetObjectSolids} from './street-object-solids';
const anchor:Position=[6.8,47.51],meters=111319.4908,cos=Math.cos(anchor[1]*Math.PI/180);
const local=(p:Position)=>({x:(p[0]-anchor[0])*meters*cos,z:-(p[1]-anchor[1])*meters});
let initialized:Promise<void>|undefined;
export async function createCityPhysics(){
 initialized??=RAPIER.init();await initialized;
 const data=await loadCityWorld(),world=new RAPIER.World({x:0,y:-9.81,z:0});
 for(const tile of [data,...data.terrainPatches||[]]){
  const vertices:number[]=[],indices:number[]=[],[w,s,e,n]=tile.bounds,mask=municipalTerrainVertices(tile);
  for(let y=0;y<tile.size;y++)for(let x=0;x<tile.size;x++){
   const lon=w+x/(tile.size-1)*(e-w),lat=s+y/(tile.size-1)*(n-s),p=local([lon,lat]);vertices.push(p.x,terrainHeight(lon,lat)!,p.z);
  }
  for(let y=0;y<tile.size-1;y++)for(let x=0;x<tile.size-1;x++){const a=y*tile.size+x,b=a+1,c=a+tile.size,d=c+1;if(mask[a]&&mask[b]&&mask[c])indices.push(a,b,c);if(mask[b]&&mask[d]&&mask[c])indices.push(b,d,c);}
  world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(vertices),new Uint32Array(indices)));
 }
 for(const feature of data.buildings.features){
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  for(const polygon of polygons){const v:number[]=[],idx:number[]=[];
   for(const ring of polygon)for(let i=1;i<ring.length;i++){
    const a=local([ring[i-1][0],ring[i-1][1]]),b=local([ring[i][0],ring[i][1]]),base=Number(feature.properties?.render_min_height)||0,top=Number(feature.properties?.render_height)||8;
    const j=v.length/3;v.push(a.x,base,a.z,b.x,base,b.z,a.x,top,a.z,b.x,top,b.z);idx.push(j,j+1,j+2,j+1,j+3,j+2);
   }
   if(v.length)world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(v),new Uint32Array(idx)));
  }
 }
 for(const solid of campusFacadeSolids(data)){
  const vertices=solid.polygon.flatMap(p=>{const v=local(p);return [v.x,solid.bottom,v.z,v.x,solid.top,v.z];});
  const collider=RAPIER.ColliderDesc.convexHull(new Float32Array(vertices));
  if(collider)world.createCollider(collider);
 }
 const shelterNodes=new Set(data.campus?.objects.filter(o=>o.tags.highway==='bus_stop'&&o.tags.shelter==='yes').map(o=>o.id));
 for(const object of data.streets?.objects||[]){
  const ground=terrainHeight(...object.coordinates);if(ground===null)continue;const p=local(object.coordinates);
  const detailed=shelterNodes.has(object.id);
  const angle=detailed?shelterAngle(object.coordinates,data.campus!.roads):0;
  for(const solid of streetObjectSolids(object.tags,detailed,object.id)){
   const shape=solid.kind==='box'?RAPIER.ColliderDesc.cuboid(solid.width/2,solid.height/2,solid.depth/2):RAPIER.ColliderDesc.cylinder(solid.height/2,solid.radius);
   const [east,north]=shelterOffset(angle,solid.x,solid.y);
   if(angle)shape.setRotation({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)});
   world.createCollider(shape.setTranslation(p.x+east,ground+solid.z+solid.height/2,p.z-north));
  }
 }
 function forecourtCollider(u:number,v:number,width:number,depth:number,height:number,yaw=0){
  const coords=forecourtPoint(u,v),ground=terrainHeight(...coords);
  if(ground===null)return;
  const p=local(coords),angle=Math.atan2(libraryAxis[1],libraryAxis[0])+yaw;
  world.createCollider(RAPIER.ColliderDesc.cuboid(width/2,height/2,depth/2)
   .setRotation({x:0,y:Math.sin(angle/2),z:0,w:Math.cos(angle/2)})
   .setTranslation(p.x,ground+height/2,p.z));
 }
 const sign=directoryPosition;
 forecourtCollider(sign.along+sign.alongSpan/2,sign.out+sign.outSpan/2,Math.hypot(sign.alongSpan,sign.outSpan),.19,2.88,Math.atan2(sign.outSpan,sign.alongSpan));
 const bank=cycleLockers;
 for(let i=0;i<bank.count;i++)forecourtCollider(bank.along+bank.pitch*(i+.5),bank.out+bank.depth/2,1.22,bank.depth,1.52);
 for(const [u,v] of forecourtLamps)forecourtCollider(u,v,.16,.16,7.35);
 for(const fixture of CAMPUS_COURTYARD.fixtures){
  const coordinates:Position=[...fixture.coordinates],ground=terrainHeight(...coordinates);if(ground===null)continue;const p=local(coordinates);
  if(fixture.kind==='tree'||fixture.kind==='lamp')world.createCollider(RAPIER.ColliderDesc.cylinder(fixture.height/2,fixture.kind==='tree'?.14:.07).setTranslation(p.x,ground+fixture.height/2,p.z));
  else {
   const lift=fixture.kind==='garden-bed'?STGI_GARDEN_LAWN_LIFT:0;
   world.createCollider(RAPIER.ColliderDesc.cuboid(fixture.width/2,(fixture.height+lift)/2,fixture.depth/2).setTranslation(p.x,ground+(fixture.height+lift)/2,p.z));
  }
 }
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()),collider=world.createCollider(RAPIER.ColliderDesc.capsule(.55,.3),body);
 const character=world.createCharacterController(.025);character.enableAutostep(.3,.2,true);character.enableSnapToGround(.5);character.setMaxSlopeClimbAngle(Math.PI/4);character.setMinSlopeSlideAngle(Math.PI/3);
 const cameraProbe=new RAPIER.Ball(.16);
 world.step();let disposed=false;
 return {
  height:(p:Position)=>inMontbeliard(p)?terrainHeight(...p):null,
  cameraClearance(position:Position,height:number,east:number,north:number,up:number,length:number){
   const start=local(position);
   const hit=world.castShape({x:start.x,y:height,z:start.z},{x:0,y:0,z:0,w:1},
    {x:east,y:up,z:-north},cameraProbe,.03,length,true,undefined,undefined,collider);
   return hit?Math.max(0,hit.time_of_impact-.025):length;
  },
  move(from:Position,to:Position):Position{
   if(disposed||!inMontbeliard(to))return from;
   const terrain=terrainHeight(...to);
   if(terrain===null)return from;
   const fromStep=amphitheatreStairHeight(from,data),toStep=amphitheatreStairHeight(to,data);
   const ground=Math.max(terrainHeight(...from)??0,fromStep??-Infinity),target=Math.max(terrain,toStep??-Infinity);
   if((fromStep!==undefined||toStep!==undefined)&&Math.abs(target-ground)>.45)return from;
   const a=local(from),b=local(to);
   // Only the walker moves. The initial step indexed all fixed collision geometry.
   body.setTranslation({x:a.x,y:ground+.9,z:a.z},true);
   world.propagateModifiedBodyPositionsToColliders();
   character.computeColliderMovement(collider,{x:b.x-a.x,y:target-ground-.05,z:b.z-a.z});
   const d=character.computedMovement(),next:Position=[from[0]+d.x/(meters*cos),from[1]-d.z/meters];
   return metersBetween(from,next)<2?next:from;
  },
  dispose(){if(disposed)return;disposed=true;world.free();}
 };
}
