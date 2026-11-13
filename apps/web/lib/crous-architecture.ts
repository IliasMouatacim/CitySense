import type {CampusDrawing} from './campus-architecture';
import type {CampusFace} from './campus-references';
type Pane=(at:number,width:number,bottom:number,top:number,depth?:number)=>void;

/** Restaurant elevations observed in Antomoro's 2012 Commons photograph.
 * Dimensions and registration to the IGN volumes are approximate. */
export function drawCrousFacade(face:CampusFace,length:number,height:number,draw:CampusDrawing,pane:Pane,onFixedLight:()=>void=()=>{}){
 if(!face.layout?.startsWith('crous-'))return false;
 const {panel,box,lettering}=draw,white='#eeeae0',concrete='#d2d1c8',frame='#344b4c';
 function curtain(at:number,width:number,bottom:number,top:number){
  const columns=Math.max(2,Math.ceil(width/1.6)),rows=Math.max(2,Math.round((top-bottom)/1.15));
  const pitch=width/columns,rise=(top-bottom)/rows;
  panel(at,width,bottom,top,'#263b3c',.06);
  for(let col=0;col<columns;col++)for(let row=0;row<rows;row++){
   const x=at-width/2+(col+.5)*pitch,z0=bottom+row*rise+.035,z1=bottom+(row+1)*rise-.035;
   if(draw.glazing)draw.glazing(x,pitch-.07,z0,z1,.10,'fixed');
   else panel(x,pitch-.07,z0,z1,'#49636a',.10);
   onFixedLight();
  }
  for(let col=0;col<=columns;col++)box(at-width/2+col*pitch,.065,bottom,top,frame,.22,.07);
  for(let row=0;row<=rows;row++)box(at,width,bottom+row*rise-.035,bottom+row*rise+.035,frame,.23,.07);
 }
 function wallLight(at:number,z:number){
  // Small wall-mounted fittings visible above the restaurant glazing.
  // Shape and spacing are approximate; no additional realtime light sources.
  box(at,.20,z-.12,z+.12,'#637268',.24,.04);
  box(at,.055,z-.04,z+.02,frame,.42,.20);
  box(at,.15,z-.06,z+.04,frame,.48,.34);
  panel(at,.11,z-.045,z-.015,'#c5cbbf',.485);
 }
 function greenDoor(at:number){
  // Keep the photographed green panel positions. Hardware is illustrative;
  // these doors do not provide access to an invented interior.
  panel(at,.65,.18,2.2,'#287560',.25);
  for(const side of [-1,1])box(at+side*.35,.045,.16,2.24,frame,.30,.23);
  box(at,.74,2.2,2.25,frame,.30,.23);
  panel(at,.57,.20,.39,'#8b9992',.265);
  box(at-.22,.025,.95,1.23,'#b8c3bb',.32,.27);
  for(const z of [.48,1.05,1.85])box(at+.32,.035,z,z+.09,'#8b9992',.30,.25);
 }
 if(face.layout==='crous-front'){
  const bays=Math.max(2,Math.round(length/8)),pitch=length/bays;
  for(let i=0;i<bays;i++){
   const at=(i+.5)*pitch,w=pitch-1.10;
   // Broad structural bays contain multiple glass panels. Dividing the glazing
   // also avoids stretching a single reflection texture across an entire bay.
   curtain(at,w,.15,height*.76);
   panel(at+w*.30,Math.min(.65,w*.25),height*.66,height*.755,'#42658c',.25);
   box(at,pitch-.85,height*.78,height-.12,i%2?white:concrete,.20,.03);
   if(i%2===1)wallLight(at,height*.89);
   if(i%2===0)greenDoor(at+w*.28);
  }
  for(let i=0;i<=bays;i++)box(Math.max(.45,Math.min(length-.45,i*pitch)),.90,.03,height-.1,concrete,.46,.03);
  // Photo-observed entrance shelter; closed glazing, no invented interior.
  const at=length*.72,w=Math.min(5.5,length*.23);
  box(at,w,2.65,2.96,white,.88,.03);
  box(at,w+.06,2.96,3.02,'#637268',.91,.03);
  for(const side of [-1,1])box(at+side*(w/2-.18),.28,.04,2.65,concrete,.86,.58);
  lettering('RESTAURANT CAFETERIA CROUS',at,w*.94,2.69,2.91,false,.90);
 }else if(face.layout==='crous-corner'){
  panel(length/2,length,.05,height-.15,white,.045);
  const bays=Math.max(2,Math.round(length/2.1)),pitch=(length-.4)/bays;
  for(let i=0;i<bays;i++){
   const at=.2+(i+.5)*pitch;
   pane(at,pitch-.08,height*.67,height*.81,.10);
   if(i%2===0){panel(at-pitch*.25,.42,height*.68,height*.80,'#42658c',.25);box(at-pitch*.48,.13,height*.66,height*.82,'#934e45',.35,.06);}
  }
  for(const at of [.25,.66])pane(length*at,.60,height*.18,height*.35,.10);
 }else if(face.layout==='crous-glass'){
  curtain(length/2,length-.12,.18,height*.79);
  panel(length/2,length,height*.81,height-.15,white,.05);
 }else{
  // The photographed east wing has tall narrow upper lights, not three
  // repeated classroom ribbons; its lower service wall stays mostly solid.
  panel(length/2,length,height*.35,height-.15,white,.05);
  const bays=Math.max(2,Math.round(length/2.7)),pitch=length/bays;
  for(let i=0;i<bays;i++){
   const at=(i+.5)*pitch;
   pane(at,Math.min(.65,pitch*.30),height*.40,height*.84,.10);
   panel(at,.38,height*.53,height*.60,'#42658c',.25);
   if(i%2===0)pane(at,.48,.6,1.1,.10);
  }
 }
 box(length/2,length,height-.10,height+.06,'#637268',.19,.03);
 return true;
}
