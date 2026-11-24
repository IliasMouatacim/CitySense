import {CanvasTexture,PlaneGeometry,MeshBasicMaterial,SRGBColorSpace,Group,Mesh} from 'three';
import {loadWalkPlayer} from './walk-player';
import {WALK_SPEED} from './walk-settings';
import type {Position} from './walk-geometry';

type Target={coordinates:Position;x:number;y:number;ground:number;playerX:number;playerY:number;speaking:boolean;bubbleHeading:number;night:boolean};

export async function campusDirector(){
 const actor=await loadWalkPlayer('director');
 const root=new Group();root.name='Directeur du campus';root.add(actor.root);
 const canvas=document.createElement('canvas');
 canvas.width=512;canvas.height=160;
 const ctx=canvas.getContext('2d')!;
 ctx.fillStyle='#fff';ctx.strokeStyle='#263141';ctx.lineWidth=6;
 ctx.beginPath();ctx.roundRect(5,5,502,118,28);ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(226,119);ctx.lineTo(246,149);ctx.lineTo(271,119);ctx.fill();ctx.stroke();
 ctx.fillStyle='#172536';ctx.font='bold 62px sans-serif';ctx.textAlign='center';ctx.fillText('MOUATACIM',256,85);
 const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;
 const bubble=new Mesh(new PlaneGeometry(1.35,.422),new MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,toneMapped:false}));
 bubble.rotation.set(Math.PI/2,0,0,'ZXY');bubble.visible=false;root.add(bubble);
 // Trail targets arrive irregularly (every frame while the player walks, 10 Hz
 // otherwise). The body glides after them each render frame, faces where it is
 // going, and drives its stride from the distance it actually covered so the
 // feet stay planted instead of sliding.
 let target:Target|undefined,shown:{x:number;y:number;ground:number;lng:number;lat:number}|undefined;
 let heading=0,meters=0,strength=0,speed=0,clock=0;
 const turnTo=(goal:number,rate:number)=>{heading+=(((goal-heading)%(2*Math.PI)+3*Math.PI)%(2*Math.PI)-Math.PI)*rate;};
 function update(now=performance.now()){
  if(!target)return false;
  const elapsed=clock?Math.min(.1,Math.max(0,(now-clock)/1000)):0;clock=now;
  const gap=shown?Math.hypot(target.x-shown.x,target.y-shown.y):Infinity;
  if(!shown||gap>4){
   // First placement or a trail reset: appear in place, facing the player.
   shown={x:target.x,y:target.y,ground:target.ground,lng:target.coordinates[0],lat:target.coordinates[1]};
   heading=Math.atan2(target.x-target.playerX,target.playerY-target.y);speed=strength=0;
  }else if(elapsed>0){
   const follow=1-Math.exp(-7*elapsed);
   const dx=(target.x-shown.x)*follow,dy=(target.y-shown.y)*follow,step=Math.hypot(dx,dy);
   shown.x+=dx;shown.y+=dy;
   shown.ground+=(target.ground-shown.ground)*follow;
   shown.lng+=(target.coordinates[0]-shown.lng)*follow;shown.lat+=(target.coordinates[1]-shown.lat)*follow;
   meters+=step;
   speed+=(step/elapsed-speed)*(1-Math.exp(-10*elapsed));
   const walking=speed>.35&&step>1e-5;
   // Same heading convention as the player: atan2(-lookX, lookY).
   turnTo(walking?Math.atan2(-dx,dy):Math.atan2(shown.x-target.playerX,target.playerY-shown.y),1-Math.exp(-(walking?9:5)*elapsed));
   const goal=walking?Math.min(1.3,speed/WALK_SPEED):0;
   strength+=(goal-strength)*(1-Math.exp(-8*elapsed));
  }
  actor.pose({coordinates:[shown.lng,shown.lat],ground:shown.ground,facing:-heading*180/Math.PI,meters,stride:strength,arm:1},shown.x,shown.y,target.night);
  bubble.position.set(shown.x,shown.y,shown.ground+2.04);
  bubble.visible=target.speaking;bubble.rotation.z=target.bubbleHeading;
  // Keep rendering until the body has caught up and the legs have settled.
  return gap>.01||strength>.01||speed>.01;
 }
 return {root,update,place(coordinates:Position,x:number,y:number,ground:number,playerX:number,playerY:number,speaking:boolean,bubbleHeading:number,night:boolean){
  target={coordinates,x,y,ground,playerX,playerY,speaking,bubbleHeading,night};
  if(!shown)update();
 },dispose(){
  root.removeFromParent();
  actor.dispose();bubble.geometry.dispose();bubble.material.dispose();texture.dispose();
 }};
}
