import RAPIER from '@dimforge/rapier3d-compat';
import {terrainHeight,loadCityWorld} from './city-world';
import {metersBetween} from './city-details-data';
import type {Position} from './walk-geometry';
const anchor:Position=[6.8,47.51],meters=111319.4908,cos=Math.cos(anchor[1]*Math.PI/180);
const local=(p:Position)=>({x:(p[0]-anchor[0])*meters*cos,z:-(p[1]-anchor[1])*meters});
let initialized:Promise<void>|undefined;
export async function createCityPhysics(){
 initialized??=RAPIER.init();await initialized;
 const data=await loadCityWorld(),world=new RAPIER.World({x:0,y:-9.81,z:0});
 const vertices:number[]=[],indices:number[]=[];const [w,s,e,n]=data.bounds;
 for(let y=0;y<data.size;y++)for(let x=0;x<data.size;x++){
  const lon=w+x/(data.size-1)*(e-w),lat=s+y/(data.size-1)*(n-s),p=local([lon,lat]);vertices.push(p.x,terrainHeight(lon,lat)!,p.z);
 }
 for(let y=0;y<data.size-1;y++)for(let x=0;x<data.size-1;x++){const a=y*data.size+x,b=a+1,c=a+data.size,d=c+1;indices.push(a,b,c,b,d,c);}
 world.createCollider(RAPIER.ColliderDesc.trimesh(new Float32Array(vertices),new Uint32Array(indices)));
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
 for(const object of data.streets?.objects||[]){
  const ground=terrainHeight(...object.coordinates);if(ground===null)continue;const p=local(object.coordinates);
  if(object.tags.amenity==='bench')world.createCollider(RAPIER.ColliderDesc.cuboid(.8,.45,.25).setTranslation(p.x,ground+.45,p.z));
  else world.createCollider(RAPIER.ColliderDesc.capsule(2.2,object.tags.natural==='tree'?.2:.08).setTranslation(p.x,ground+2.4,p.z));
 }
 const body=world.createRigidBody(RAPIER.RigidBodyDesc.kinematicPositionBased()),collider=world.createCollider(RAPIER.ColliderDesc.capsule(.55,.3),body);
 const character=world.createCharacterController(.025);character.enableAutostep(.3,.2,true);character.enableSnapToGround(.5);character.setMaxSlopeClimbAngle(Math.PI/4);character.setMinSlopeSlideAngle(Math.PI/3);
 world.step();let disposed=false;
 return {
  height:(p:Position)=>terrainHeight(...p),
  move(from:Position,to:Position):Position{
   if(disposed||terrainHeight(...to)===null)return from;
   const a=local(from),b=local(to),ground=terrainHeight(...from)??0,target=terrainHeight(...to)!;
   body.setTranslation({x:a.x,y:ground+.9,z:a.z},true);world.step();
   character.computeColliderMovement(collider,{x:b.x-a.x,y:target-ground-.05,z:b.z-a.z});
   const d=character.computedMovement(),next:Position=[from[0]+d.x/(meters*cos),from[1]-d.z/meters];
   return metersBetween(from,next)<2?next:from;
  },
  dispose(){if(disposed)return;disposed=true;world.free();}
 };
}
