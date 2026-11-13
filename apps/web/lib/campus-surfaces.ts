/** Fixed lights use the quiet half of the atlas; classroom lights may have blinds.
 * Keep a whole curtain wall coherent instead of assigning random bright panes. */
export function campusGlassTile(at:number,bottom:number,variant:number,kind:'fixed'|'classroom'='classroom'){
 const index=kind==='fixed'?Math.floor(variant):Math.round(at*7+bottom*3)+variant;
 return ((index%8)+8)%8+(kind==='fixed'?0:8);
}

/** Original procedural surfaces. These add material character, not surveyed detail. */
export function campusSurface(kind:'concrete'|'paving'|'windows'){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
 const ctx=canvas.getContext('2d')!,pixels=ctx.createImageData(512,512);let seed=kind==='concrete'?17293:kind==='paving'?71237:41719;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 if(kind==='windows'){
  // Sixteen quiet variations prevent every bay reflecting as one flat strip.
  // Interior shading/blinds are illustrative, not reconstructed rooms.
  for(let row=0;row<4;row++)for(let col=0;col<4;col++){
   // Canvas rows run downward; CanvasTexture flips Y, so UV tiles 0..7
   // sample the lower half of this canvas.
   const fixed=row>=2,x=col*128,y=row*128,v=fixed?151+random()*6:145+random()*15;
   const gradient=ctx.createLinearGradient(x,y,x+100,y+128);
   gradient.addColorStop(0,`rgb(${v+12},${v+15},${v+13})`);gradient.addColorStop(.48,`rgb(${v},${v+8},${v+9})`);gradient.addColorStop(1,`rgb(${v-12},${v-5},${v-2})`);
   ctx.fillStyle=gradient;ctx.fillRect(x,y,128,128);
   if(!fixed&&(row+col*3)%5===0){
    const drop=28+random()*48;ctx.fillStyle='#b8b8aa';ctx.fillRect(x+3,y+3,122,drop);
    ctx.strokeStyle='#777f76';ctx.lineWidth=1;for(let h=6;h<drop;h+=4){ctx.beginPath();ctx.moveTo(x+3,y+h);ctx.lineTo(x+125,y+h);ctx.stroke();}
   }
   if(!fixed){ctx.fillStyle='#182d3010';ctx.fillRect(x+5,y+100,118,23);}
   ctx.strokeStyle='#cedbd21a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+9,y+6);ctx.lineTo(x+9,y+122);ctx.stroke();
  }
 }else{
  const shades=Array.from({length:16},()=>random()*10-5);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){
   const slab=Math.floor(x/128)+4*Math.floor(y/128),noise=(random()-.5)*(kind==='concrete'?16:27);
   const joint=kind==='paving'&&(x%128<2||y%128<2),base=kind==='concrete'?218:178;
   const v=joint?108:base+noise+shades[slab]+Math.sin(x*.071)*1.8;
   pixels.data.set([v,v,kind==='concrete'?v-5:v-6,255],(y*512+x)*4);
  }
  ctx.putImageData(pixels,0,0);
  if(kind==='concrete'){
   // Formwork seams, recessed tie holes and rain streaks stay subtle at a distance.
   ctx.fillStyle='#73786c55';for(const p of [0,256]){ctx.fillRect(p,0,1,512);ctx.fillRect(0,p,512,1);}
   for(const x of [25,231,281,487])for(const y of [40,216,296,472]){
    const stain=ctx.createLinearGradient(0,y,0,Math.min(512,y+48));stain.addColorStop(0,'#4b514b26');stain.addColorStop(1,'#4b514b00');ctx.fillStyle=stain;ctx.fillRect(x-1,y,3,48);
    ctx.fillStyle='#6c736e99';ctx.beginPath();ctx.ellipse(x,y,1.5,1.8,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f1eee455';ctx.fillRect(x-1,y+2,3,1);
   }
   for(let i=0;i<85;i++){
    const x=random()*512,w=.5+random()*2.5,h=30+random()*140,y=random()*512;
    const streak=ctx.createLinearGradient(x,y,x,y+h);streak.addColorStop(0,'#57605110');streak.addColorStop(1,'#57605100');ctx.fillStyle=streak;ctx.fillRect(x,y,w,h);
   }
  }else{
   for(let i=0;i<7000;i++){const x=random()*512,y=random()*512;ctx.fillStyle=i%2?'#f5f0d923':'#3b44351c';ctx.fillRect(x,y,.5+random()*1.3,.5+random()*1.3);}
   // Dark joint recess with a light chamfer, rather than thick painted grid lines.
   for(let p=0;p<512;p+=128){ctx.fillStyle='#e5dfce55';ctx.fillRect(p+2,0,1,512);ctx.fillRect(0,p+2,512,1);}
  }
 }
 return canvas;
}
