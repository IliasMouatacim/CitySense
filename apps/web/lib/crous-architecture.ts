import type {CampusDrawing} from './campus-architecture';
import type {CampusFace} from './campus-references';
type Pane=(at:number,width:number,bottom:number,top:number,depth?:number)=>void;

/** Restaurant elevations observed in Antomoro's 2012 Commons photograph.
 * Dimensions and registration to the IGN volumes are approximate. */
export function drawCrousFacade(face:CampusFace,length:number,height:number,draw:CampusDrawing,pane:Pane,onFixedLight:()=>void=()=>{}){
 if(!face.layout?.startsWith('crous-'))return false;
 const {panel,box,lettering}=draw,white='#eeeae0',concrete='#d2d1c8',frame='#344b4c';
 function curtain(at:number,width:number,bottom:number,top:number,blueInfill=false){
  const columns=Math.max(2,Math.ceil(width/1.6)),rows=Math.max(2,Math.round((top-bottom)/1.15));
  const pitch=width/columns,rise=(top-bottom)/rows;
  panel(at,width,bottom,top,'#263b3c',.06);
  for(let col=0;col<columns;col++)for(let row=0;row<rows;row++){
   const x=at-width/2+(col+.5)*pitch,z0=bottom+row*rise+.035,z1=bottom+(row+1)*rise-.035;
   if(blueInfill&&col===columns-1&&row===rows-1){
    panel(x,pitch-.07,z0,z1,'#42658c',.11);
    continue;
   }
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
  const entryBay=Math.floor(bays*.60);
  const entryCenter=(entryBay+.5)*pitch;
  for(let i=0;i<bays;i++){
   const at=(i+.5)*pitch,w=pitch*.82;
   // The frontal view resolves the glass width between the projecting fins.
   const cheek=(pitch-w)/2;
   for(const side of [-1,1]){
    const center=at+side*(w+cheek)/2;
    const relief=side===1?.62:.34;
    box(center,cheek,.035,height*.76,concrete,relief,.03);
    box(center,cheek,height*.76,height-.12,white,relief,.03);
   }
   if(i===entryBay){
    // Estimated closed entrance beneath the shelter. The doors occupy their own
    // opening so curtain-wall transoms do not run across the handles.
    const doorWidth=2.1,leaf=doorWidth/2,head=2.28,sideWidth=(w-doorWidth)/2;
    for(const side of [-1,1]){
     curtain(at+side*(doorWidth+sideWidth)/2,sideWidth,.15,height*.76,side===1);
     const x=at+side*leaf/2;
     panel(x,leaf,.06,head,frame,.09);
     for(const [bottom,top] of [[.26,1.03],[1.10,head-.07]]){
      if(draw.glazing)draw.glazing(x,leaf-.10,bottom,top,.12,'fixed');
      else panel(x,leaf-.10,bottom,top,'#49636a',.12);
      onFixedLight();
     }
     panel(x,leaf-.10,.08,.24,'#8b9992',.13);
     const handle=at+side*.15;
     for(const z of [.88,1.28])box(handle,.035,z,z+.035,'#879087',.22,.12);
     box(handle,.035,.88,1.315,'#a8b3ac',.25,.21);
    }
    curtain(at,doorWidth,head,height*.76);
    box(at,doorWidth+.10,.02,.06,'#879087',.28,.03);
   }else{
    const door=at+w*.28,doorWidth=.74;
    const left=at-w/2,right=at+w/2;
    const leftJamb=door-doorWidth/2,rightJamb=door+doorWidth/2;
    curtain((left+leftJamb)/2,leftJamb-left,.15,height*.76);
    curtain((rightJamb+right)/2,right-rightJamb,.15,height*.76,true);
    curtain(door,doorWidth,2.25,height*.76);
    greenDoor(door);
   }
   box(at,w+.12,height*.76,height*.78,concrete,.30,.05);
   box(at,w,height*.78,height-.12,white,.24,.03);
   if(i%2===1)wallLight(at,height*.77);
  }
  for(let i=0;i<=bays;i++){
   const x=Math.max(.45,Math.min(length-.45,i*pitch));
   box(x,.90,.03,height-.10,concrete,.83,.03);
   box(x,.92,height-.16,height-.10,'#a9a79a',.86,.04);
  }
  // Photo-observed entrance shelter; closed glazing, no invented interior.
  const at=entryCenter,w=Math.min(5.5,pitch-.85),projection=.95;
  box(at,w,2.68,3.12,white,projection,.03);
  box(at,w+.06,3.12,3.18,'#637268',projection+.03,.03);
  for(const side of [-1,1]){
   const x=at+side*(w/2-.20);
   box(x,.24,2.55,2.68,'#879087',projection-.05,.03);
   box(x,.28,.04,2.55,concrete,projection-.10,projection-.38);
  }
  lettering('ESPACES SPORTIFS',at+w*.26,w*.43,2.79,3.00,false,projection+.016,frame);
  lettering('RESTAURANT ET CAFETERIA',at-w*.23,w*.52,2.79,3.00,false,projection+.016,'#963f46');
 }else if(face.layout==='crous-corner'){
  // The ribbon sits between two projecting courses of the white corner.
  // Leave space for the small lower windows in the backing wall.
  panel(length/2,length,.05,height*.66,white,.045);
  box(length/2,length,height*.61,height*.66,white,.23,.04);
  box(length/2,length,height*.82,height-.10,white,.23,.04);
  const bays=Math.max(2,Math.round(length/2.1)),pitch=(length-.4)/bays;
  for(let i=0;i<bays;i++){
   const at=.2+(i+.5)*pitch;
   pane(at,pitch-.08,height*.67,height*.81,.10);
   if(i%2===0){panel(at-pitch*.25,.42,height*.68,height*.80,'#42658c',.25);box(at-pitch*.48,.13,height*.66,height*.82,'#934e45',.35,.06);}
  }
  for(const at of [.25,.66])pane(length*at,.60,height*.18,height*.35,.10);
 }else if(face.layout==='crous-glass'){
  curtain(length/2,length-.12,.18,height*.79);
  // Continue the pale fascia around the glazed return. Its folded lip and
  // sill give the ends of the curtain wall a visible depth at walking height.
  box(length/2,length,height*.79+.04,height-.10,white,.23,.04);
  box(length/2,length,height*.79+.04,height*.79+.09,'#879087',.26,.21);
  box(length/2,length,.07,.145,concrete,.27,.03);
 }else{
  // The photographed east wing has tall narrow upper lights, not three
  // repeated classroom ribbons; its lower service wall stays mostly solid.
  const bays=Math.max(2,Math.round(length/2.7)),pitch=length/bays;
  const width=Math.min(.65,pitch*.30),bottom=height*.40,top=height*.84;
  const opening=width+.16,cheek=(pitch-opening)/2;
  box(length/2,length,height*.35,bottom-.12,white,.25,.04);
  box(length/2,length,top+.11,height-.10,white,.25,.04);
  for(let i=0;i<bays;i++){
   const at=(i+.5)*pitch;
   // Build the wall around each light so its jambs show in an oblique view.
   for(const side of [-1,1]){
    box(at+side*(opening+cheek)/2,cheek,bottom-.12,top+.11,white,.25,.04);
   }
   pane(at,width,bottom,top,.10);
   box(at,width+.14,bottom-.12,bottom-.07,'#879087',.32,.08);
   box(at,width-.06,height*.53,height*.60,'#42658c',.145,.10);
   if(i%2===0)pane(at,.48,.6,1.1,.10);
  }
 }
 box(length/2,length,height-.10,height+.06,'#637268',.19,.03);
 return true;
}
