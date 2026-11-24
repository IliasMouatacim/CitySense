import {CanvasTexture,PlaneGeometry,MeshBasicMaterial,SRGBColorSpace,Group,Mesh} from 'three';
import {loadWalkPlayer} from './walk-player';
import {WALK_SPEED} from './walk-settings';
import type {Position} from './walk-geometry';

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
 let meters=0,strength=0,last:{x:number;y:number;time:number}|undefined;
 return {root,place(coordinates:Position,x:number,y:number,ground:number,heading:number,speaking:boolean,bubbleHeading:number,night:boolean){
  const now=performance.now();
  const step=last?Math.hypot(x-last.x,y-last.y):0;
  const elapsed=last?Math.max(.016,(now-last.time)/1000):.1;
  const speed=step<3?Math.min(1.35,step/(elapsed*WALK_SPEED)):0;
  strength+=(speed-strength)*(1-Math.exp(-14*elapsed));
  meters=step>3?0:meters+step;
  last={x,y,time:now};
  actor.pose({coordinates,ground,facing:-heading*180/Math.PI,meters,stride:strength,arm:1},x,y,night);
  bubble.position.set(x,y,ground+2.04);
  bubble.visible=speaking;bubble.rotation.z=bubbleHeading;
 },dispose(){
  root.removeFromParent();
  actor.dispose();bubble.geometry.dispose();bubble.material.dispose();texture.dispose();
 }};
}
