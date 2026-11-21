import {CanvasTexture,DoubleSide,Group,Mesh,MeshBasicMaterial,PlaneGeometry,SkinnedMesh,type Bone} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {offset} from './walk-geometry';
import {walkingGroundHeight} from './walking-ground';
import type {PlayerPose} from './follow-camera';

/** Local, single-material skinned character. Only joint transforms change during a walk. */
export async function loadWalkPlayer(){
 const {scene}=await new GLTFLoader().loadAsync('/city/player.glb');
 const body=scene.getObjectByName('Player') as SkinnedMesh;
 const bones=new Map(body.skeleton.bones.map(bone=>[bone.name,bone]));
 const bone=(name:string)=>bones.get(name) as Bone;
 const hips=bone('hips'),spine=bone('spine'),head=bone('head'),restHeight=hips.position.y;
 const legs=['R','L'].map(side=>({
  thigh:bone('thigh'+side),shin:bone('shin'+side),foot:bone('foot'+side),
  arm:bone('arm'+side),fore:bone('fore'+side),
 }));
 // A small contact shadow grounds the shoes without refreshing the campus shadow map.
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
 const ctx=canvas.getContext('2d')!;
 const falloff=ctx.createRadialGradient(32,32,0,32,32,32);
 falloff.addColorStop(0,'rgba(25,22,20,.42)');falloff.addColorStop(.52,'rgba(25,22,20,.24)');falloff.addColorStop(1,'rgba(25,22,20,0)');
 ctx.fillStyle=falloff;ctx.fillRect(0,0,64,64);
 const shadowMap=new CanvasTexture(canvas);
 const shadow=new Mesh(new PlaneGeometry(.81,.55),new MeshBasicMaterial({map:shadowMap,transparent:true,depthWrite:false,side:DoubleSide,toneMapped:false}));
 let sampleX=Infinity,sampleY=Infinity,slopeEast=0,slopeNorth=0;
 const root=new Group();root.name='CitySense player';
 scene.rotation.x=Math.PI/2;root.add(scene,shadow);
 // The actor is always the orbit target. Its bind-pose bounds need no per-frame skin scan.
 body.frustumCulled=false;
 const material=body.material as MeshBasicMaterial;material.toneMapped=false;
 return {root,
  pose(pose:PlayerPose,x:number,y:number,night:boolean){
   root.visible=pose.arm>.42;
   root.position.set(x,y,pose.ground+.012);
   root.rotation.z=-pose.facing*Math.PI/180;
   if(Math.hypot(x-sampleX,y-sampleY)>.25){
    const slope=(east:number,north:number)=>Math.max(-.5,Math.min(.5,(walkingGroundHeight(offset(pose.coordinates,east,north))-pose.ground)/.25));
    slopeEast=slope(.25,0);slopeNorth=slope(0,.25);sampleX=x;sampleY=y;
   }
   const sin=Math.sin(root.rotation.z),cos=Math.cos(root.rotation.z);
   shadow.rotation.set(Math.atan(-slopeEast*sin+slopeNorth*cos),-Math.atan(slopeEast*cos+slopeNorth*sin),0);
   shadow.position.z=.013;
   const phase=pose.meters*Math.PI*2/1.6,strength=pose.stride;
   hips.position.y=restHeight+Math.abs(Math.cos(phase))*.018*strength;
   spine.rotation.y=Math.cos(phase)*.065*strength;
   spine.rotation.x=-.052*strength;head.rotation.y=-spine.rotation.y*.65;
   material.color.setScalar(night?.61:1);
   for(let i=0;i<legs.length;i++){
    const limb=legs[i],swing=Math.sin(phase+i*Math.PI)*strength;
    const fold=Math.max(0,-Math.cos(phase+i*Math.PI))*strength;
    limb.thigh.rotation.x=swing*.48;
    limb.shin.rotation.x=-fold*.72;
    limb.foot.rotation.x=-swing*.24+fold*.25;
    limb.arm.rotation.x=-swing*.32;
    limb.fore.rotation.x=.085+Math.max(0,-swing)*.30;
   }
  },
  dispose(){
   root.removeFromParent();
   scene.traverse(object=>{if(object instanceof Mesh)object.geometry.dispose();});
   shadow.geometry.dispose();shadow.material.dispose();shadowMap.dispose();
   body.skeleton.dispose();material.map?.dispose();material.dispose();
  }
 };
}
