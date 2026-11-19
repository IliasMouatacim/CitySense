import {drawAmphitheatreFront} from './amphitheatre';
import type {CampusFace} from './campus-references';
import {drawStgiFacade,drawStgiPaint} from './stgi-architecture';
import {drawCrousFacade} from './crous-architecture';

export type CampusDrawing={
 panel:(at:number,width:number,bottom:number,top:number,color:string,depth?:number)=>void;
 box:(at:number,width:number,bottom:number,top:number,color:string,front:number,back?:number)=>void;
 lettering:(text:string,at:number,width:number,bottom:number,top:number,outline?:boolean,depth?:number,ink?:string)=>void;
 glazing?:(at:number,width:number,bottom:number,top:number,depth:number,kind?:'fixed'|'classroom')=>void;
};

/** Estimated masonry joints inside the library's photo-observed red bands. */
export function drawLibraryMasonryJoints(length:number,bottom:number,top:number,draw:CampusDrawing,depth=.078){
 for(let z=bottom+.12;z<top-.006;z+=.12)draw.panel(length/2,length,z-.006,z+.006,'#b9a69a',depth);
 for(let row=0;bottom+row*.12<top-.001;row++){
  const z0=bottom+row*.12,z1=Math.min(top,z0+.12);
  for(let x=.24+(row%2)*.24;x<length-.012;x+=.48)draw.panel(x,.014,z0,z1,'#b9a69a',depth+.001);
 }
}

/** Batched solid architecture observed in institutional photographs.
 * Positions/relief are estimates on IGN envelopes. Inferred continuations are
 * selected separately by campus-envelope and counted separately in the UI.
 */
export function drawCampusFacade(face:CampusFace,length:number,height:number,draw:CampusDrawing){
 if(face.layout==='amphi-front')return drawAmphitheatreFront(length,height,draw);
 const {panel,box,lettering}=draw;let windows=0;
 const multimedia=face.layout==='stgi-return'||face.layout==='stgi-north-openings';
 const joint='#a5a69c',concrete='#d2d1c8',frame='#344b4c',glass='#49636a';
 function pane(at:number,width:number,bottom:number,top:number,depth=.12){
  // The library's small punched openings have shallow frames. Reusing the
  // deep STGI concrete-grid relief made these read as projecting window boxes.
  // UTBM's fittings also need to sit behind the timber screen (rear at .27 m),
  // rather than protruding through its slats.
  const relief=face.kind==='timber'?.45:face.kind==='libraryStone'||face.painted||face.layout?.startsWith('stgi-')||face.layout?.startsWith('crous-')?.5:1;
  const offset=face.layout?.startsWith('stgi-')&&depth>.3?depth-.09:0;
  const trim=(x:number,w:number,z0:number,z1:number,color:string,front:number,back:number)=>box(x,w,z0,z1,color,front*relief+offset,back*relief+offset);
  panel(at,width+.12,bottom-.08,top+.08,frame,draw.glazing?Math.max(.04,offset+.04):depth);
  // Dark reveal at the back, with substantial solid jambs and a projecting sill.
  if(draw.glazing)draw.glazing(at,width,bottom,top,Math.max(depth>.3?depth+.015:0,face.kind==='timber'?.19:face.kind==='libraryGlass'?.16:.09),multimedia||face.layout?.startsWith('crous-')?'fixed':undefined);
  else{panel(at,width,bottom,top,glass,depth+.015);panel(at-width*.22,width*.42,bottom+.04,top-.04,'#708a8e',depth+.025);}
  for(const x of [-1,1])trim(at+x*(width/2+.025),.085,bottom-.06,top+.06,frame,.34,.07);
  trim(at,width+.13,bottom-.12,bottom-.055,'#aeb2a9',.48,.06);
  trim(at,width+.13,top+.045,top+.10,'#879087',.30,.06);windows++;
  trim(at,width+.11,bottom-.115,bottom-.085,'#8c968e',.53,.43);
  // Separate opening light, rubber seals and a small aluminium latch.
  // The institutional images show fine divisions inside the larger ribbon bays.
  if(width>.85){
   const split=at+width*.18,z=bottom+(top-bottom)*.72;
   const connected=multimedia;
   trim(split,.045,connected?bottom-.06:bottom+.035,connected?top+.06:top-.035,'#263b3c',.24,.10);
   trim(at,connected?width+.035:width-.07,z,z+.035,'#2d4141',.245,.10);
   if(!multimedia)trim(split-.065,.025,bottom+(top-bottom)*.38,bottom+(top-bottom)*.38+.13,'#a8b3ac',.285,.24);
  }
 }
 if(drawCrousFacade(face,length,height,draw,pane,()=>{windows++;})||drawStgiFacade(face,length,height,draw,pane)){
  // The specialised STGI layouts share the pane/material implementation.
 }else if(face.layout==='stgi-west'){
  drawStgiPaint(length,height,draw);
  // The west photograph shows narrow paired upper lights, two taller lower
  // bands, a glazed stair bay and a solid concrete pier. Do not repeat three
  // identical window rows through those distinct parts of the elevation.
  const exclusions=[...(face.solidBays||[]),...(face.stairBay?[face.stairBay]:[])].sort((a,b)=>a[0]-b[0]);
  const spans:number[][]=[];let start=.02;
  for(const [a,b] of exclusions){if(a>start)spans.push([start,a]);start=Math.max(start,b);}
  if(start<.98)spans.push([start,.98]);
  for(const [row,band] of (face.glazingBands||[]).entries()){
   const bottom=band[0]*height,top=band[1]*height;
   for(const [left,right] of spans){
    const width=(right-left)*length,bays=Math.max(1,Math.round(width/1.7)),pitch=width/bays;
    for(let bay=0;bay<bays;bay++)pane(left*length+(bay+.5)*pitch,pitch-.12,bottom,top,.10);
    const at=(left+right)*length/2;
    if(row<2){
     // Outside guard rails visible across the broad lower window bands.
     for(const z of [bottom+.28,bottom+.65,bottom+1.02])if(z<top-.1)box(at,width,z,z+.045,frame,.25,.19);
     box(at,width,top-.21,top-.17,'#884b42',.24,.18);
     for(let bay=1;bay<bays;bay+=2){
      const x=left*length+bay*pitch;
      box(x,.055,bottom+.12,top-.16,'#884b42',.28,.18);
      for(const z of [bottom+.28,top-.22])box(x,.09,z,z+.06,frame,.30,.12);
     }
    }else{
     const split=bottom+(top-bottom)*.48;
     box(at,width,split-.075,split+.075,concrete,.25,.06);
     panel(at,width,bottom+.035,bottom+.085,'#367460',.16);
     panel(at,width,top-.08,top-.03,'#3e647b',.16);
     for(let bay=1;bay<bays;bay+=2){
      const x=left*length+bay*pitch;
      box(x,.12,bottom-.06,split-.075,'#884b42',.29,.06);
      box(x,.12,split+.075,top+.06,'#367460',.23,.06);
     }
    }
    box(at,width,bottom-.18,bottom-.08,concrete,.27,.035);
   }
  }
  if(face.stairBay){
   const [left,right]=face.stairBay,at=(left+right)*length/2,width=(right-left)*length;
   const bottom=height*.06,top=height*.89;
   const columns=Math.max(2,Math.round(width/1.15)),rows=Math.max(3,Math.round((top-bottom)/1.05));
   const pitch=(width-.14)/columns,rise=(top-bottom)/rows;
   // Fixed stairwell lights in the west reference: reflections and framing
   // stop at each light instead of stretching one classroom pane over floors.
   panel(at,width,bottom-.04,top+.04,frame,.06);
   for(let col=0;col<columns;col++)for(let row=0;row<rows;row++){
    const x=at-(width-.14)/2+(col+.5)*pitch,z0=bottom+row*rise+.03,z1=bottom+(row+1)*rise-.03;
    if(draw.glazing)draw.glazing(x,pitch-.06,z0,z1,.10,'fixed');
    else panel(x,pitch-.06,z0,z1,glass,.10);
    windows++;
   }
   for(let col=0;col<=columns;col++)box(at-(width-.14)/2+col*pitch,.06,bottom,top,frame,.20,.06);
   for(let row=0;row<=rows;row++)box(at,width,bottom+row*rise-.03,bottom+row*rise+.03,frame,.21,.06);
   for(const z of [.32,.62])box(at,width,height*z,height*z+.16,concrete,.30,.035);
   box(at,width*.9,height*.60,height*.72,'#278773',.28,.035);
   panel(at+width*.2,width*.27,height*.735,height*.83,'#94483e',.15);
   box(left*length-.06,.09,.15,height*.95,'#975d50',.24,.03);
  }
  for(const [left,right] of face.solidBays||[]){
   const at=(left+right)*length/2,width=(right-left)*length;
   box(at,width,.02,height,concrete,.20,.03);
   for(let z=height/5;z<height-.2;z+=height/5)panel(at,width,z,z+.016,joint,.212);
   box(at,width,height-.07,height+.06,'#637268',.25,.03);
  }
  box(length/2,length,height-.12,height+.06,'#aeb3a8',.15,.03);
  if(face.label)lettering(face.label,length*.34,length*.59,height*.405,height*.565,true,.30);
 }else if(face.kind==='ribbon'||face.kind==='frame'){
  if(face.painted)drawStgiPaint(length,height,draw);
  const floors=face.floors||3,step=height/floors,bays=Math.max(1,Math.round((length-.5)/(face.kind==='frame'?3.1:2.05))),pitch=(length-.5)/bays;
  panel(length/2,length,.08,.45,'#adafa4',.06);
  for(let floor=0;floor<floors;floor++){
   const band=face.glazingBands?.[floor];
   const bottom=band?height*band[0]:floor*step+.55,top=band?height*band[1]:Math.min(height-.65,bottom+step*.62);
   if(top<=bottom)continue;
   panel(length/2,length-.5,bottom-.12,top+.12,frame,.07);
   for(let bay=0;bay<bays;bay++){
    const at=.25+(bay+.5)*pitch,w=Math.max(.25,pitch-(face.kind==='frame'?.4:.09));
    pane(at,w,bottom,top,face.kind==='frame'?.09:.14);
    panel(at,w,top-.25,top-.205,['#75483c','#436b58','#a89d57'][floor%3],.25);
    box(at,w,(bottom+top)/2,(bottom+top)/2+.045,frame,.26,.15);
   }
   if(face.kind==='frame'){
    box(length/2,length,bottom-.55,bottom-.3,concrete,.62,.03);
    for(let bay=0;bay<=bays;bay++)box(.25+bay*pitch,.32,Math.max(0,floor*step),Math.min(height,(floor+1)*step),concrete,.6,.03);
   }else box(length/2,length-.15,bottom-.23,bottom-.1,'#b3b6aa',.3,.03);
  }
  // Concrete pour joints are shallow, not decorative masonry courses.
  for(let z=1.1;z<height-.3;z+=1.1)panel(length/2,length,z,z+.014,joint,.032);
  box(length/2,length,height-.22,height+.06,'#aeb3a8',.15,.03);
  if(face.accent&&length>8){
   const at=length*.57,w=Math.min(3.7,length*.22);
   box(at,w,height*.12,height-.35,'#328e83',.34,.03);
   for(let z=height*.15;z<height-.35;z+=.45)panel(at,w,z,z+.018,'#277d74',.35);
   pane(at+w*.32,.35,height*.24,height*.86,.38);
   panel(at+w*.38,.09,height*.23,height*.87,'#b5a74b',.44);
   // Glazed entry below the photographed turquoise stair projection.
   const doorWidth=Math.min(1.7,w*.7);
   for(const side of [-1,1]){
    const x=at+side*doorWidth*.25;
    pane(x,doorWidth*.5-.045,.18,Math.min(2.35,height*.28),.38);
    box(x,doorWidth*.5-.09,.2,.43,'#687b76',.425,.40);
    for(const z of [.52,1.15,1.9])box(at+side*(doorWidth*.5+.025),.045,z,z+.11,'#94a49d',.39,.34);
    box(at+side*.09,.028,.9,1.3,'#b5bcb1',.54,.47);
   }
   box(at,doorWidth+.22,.13,.18,'#8a9188',.7,.03);
  }
  if(face.label)lettering(face.label,length*.46,Math.min(14,length*.72),height*.42,height*.59,false,.32);
 }else if(face.kind==='libraryGlass'){
  const bottom=height*.22,top=height-.4;
  panel(length/2,length-.5,bottom,top,'#39575c',.12);
  const bays=Math.max(2,Math.round(length/1.5)),pitch=(length-.5)/bays;
  const rows=Math.max(2,Math.round((top-bottom)/.95)),rise=(top-bottom)/rows;
  // The institutional photo shows fixed curtain-wall lights. Avoid applying
  // classroom handles/sills and one stretched reflection to each tall strip.
  for(let b=0;b<bays;b++)for(let row=0;row<rows;row++){
   const at=.25+(b+.5)*pitch,z0=bottom+row*rise+.04,z1=bottom+(row+1)*rise-.04;
   panel(at,pitch-.045,z0-.015,z1+.015,'#263b3c',.145);
   if(draw.glazing)draw.glazing(at,pitch-.085,z0,z1,.16,'fixed');
   else panel(at,pitch-.085,z0,z1,glass,.16);
   windows++;
  }
  for(let b=0;b<=bays;b++)box(.25+b*pitch,.065,bottom,top,'#4a5956',.28,.10);
  for(let row=0;row<=rows;row++){
   const z=bottom+row*rise;
   box(length/2,length-.35,z-.035,z+.035,'#4a5956',.30,.10);
  }
  for(const fraction of [1/3,2/3]){
   const z=bottom+(top-bottom)*fraction;
   box(length/2,length-.35,z-.09,z+.09,'#aeb2a9',.34,.10);
  }
  for(const at of [.13,length-.13])box(at,.26,.15,height,'#a3a497',.55,.03);
  box(length/2,length+.12,bottom-.3,bottom-.05,'#a9ac9f',.65,.03);
 }else if(face.kind==='libraryStone'){
  panel(length/2,length,.1,height,'#a9a79a',.05);
  for(let z=1;z<height-.3;z+=1.5){
   panel(length/2,length,z,z+.24,'#947a70',.065);
   // Two staggered masonry courses within the photographed reddish bands.
   // These shallow joints add close-range detail without projecting blocks.
   drawLibraryMasonryJoints(length,z,z+.24,draw);
  }
  if(face.openings){
   // Uneven openings observed in the courtyard photograph, measured as
   // approximate fractions along this particular IGN wall (from a to b).
   for(const opening of face.openings){
    const at=length*opening.at,width=length*opening.width,bottom=height*opening.bottom,top=height*opening.top;
    const bays=Math.max(1,Math.round(width/1.4));
    for(let b=0;b<bays;b++)pane(at-width/2+(b+.5)*width/bays,width/bays-.065,bottom,top,.12);
    if(opening.accent){
     for(const side of [-1,1])box(at+side*(width/2+.06),.1,bottom-.12,top+.12,opening.accent,.20,.06);
     box(at,width+.2,bottom-.14,bottom-.05,opening.accent,.24,.06);
     box(at,width+.2,top+.05,top+.14,opening.accent,.17,.06);
    }
   }
  }else for(const [fraction,span] of [[.1,.7],[.39,.43],[.63,.62],[.82,.52]]){
   const bottom=height*fraction,top=bottom+(fraction<.2?1.7:.65),width=length*span;
   if(top>=height-.3)continue;
   const bays=Math.max(2,Math.round(width/1.4));
   for(let b=0;b<bays;b++)pane(length/2-width/2+(b+.5)*width/bays,width/bays-.065,bottom,top,.12);
  }
  box(length/2,length,height-.18,height+.04,'#8c938b',.16,.04);
 }else if(face.kind==='timber'){
  const plinth=3.05;
  panel(length/2,length,.1,plinth,'#b8b6a8',.06);
  // The reference has a mostly solid west plinth, a small slit and grouped
  // glazing. The previous repeated windows invented openings across its length.
  for(const opening of face.openings||[]){
   const left=(opening.at-opening.width/2)*length,right=(opening.at+opening.width/2)*length;
   const cuts=[left,...(face.entrances||[]).flatMap(e=>[e.at*length-e.width/2-.12,e.at*length+e.width/2+.12]).filter(x=>x>left&&x<right),right].sort((a,b)=>a-b);
   for(let i=1;i<cuts.length;i++){
    const l=cuts[i-1],r=cuts[i],mid=(l+r)/2;
    if((face.entrances||[]).some(e=>Math.abs(mid-e.at*length)<e.width/2+.12))continue;
    const bays=Math.max(1,Math.round((r-l)/1.25));
    for(let b=0;b<bays;b++)pane(l+(b+.5)*(r-l)/bays,(r-l)/bays-.07,opening.bottom*height,opening.top*height,.10);
   }
  }
  // OSM supplies entrance positions; the door hardware is an estimated design.
  for(const entrance of face.entrances||[]){
   const at=entrance.at*length,width=entrance.width;
   for(const side of [-1,1]){
    pane(at+side*width/4,width/2-.08,.18,2.55,.10);
    panel(at+side*width/4,width/2-.13,.20,.40,'#8b9992',.245);
    box(at+side*.08,.025,.9,1.25,'#c0c5bb',.28,.22);
    for(const z of [.48,1.20,2.15])box(at+side*(width/2-.045),.03,z,z+.10,'#94a49d',.25,.20);
   }
   box(at,width+.12,.10,.16,'#8c968e',.28,.03);
  }
  panel(length/2,length,plinth,height-.1,'#805c3d',.1);
  const step=(height-plinth)/3;
  for(let row=0;row<3;row++){
   const bottom=plinth+row*step+.5,top=Math.min(height-.6,bottom+step*.62);
   const bays=Math.max(2,Math.round(length/2.5));
   for(let b=0;b<bays;b++)pane((b+.5)*length/bays,length/bays-.08,bottom,top,.16);
  }
  let rail=0;
  for(let z=plinth+.12;z<height-.2;z+=.18){
   box(length/2,length,z,z+.095,['#9a7049','#aa8056','#88603f','#ad8259'][rail++%4],.38,.27);
   // Estimated board ends at the existing screen supports, with staggered
   // joints. Shallow dark cuts preserve the observed horizontal screen.
   for(let x=1.85+(rail%2)*1.85;x<length-.03;x+=3.7)panel(x,.012,z,z+.095,'#594634',.384);
  }
  for(let at=.1;at<=length;at+=3.7)box(at,.065,plinth,height-.1,'#bfc1b1',.46,.25);
  box(length/2,length,plinth-.1,plinth+.05,'#9b9f93',.52,.02);
  box(length/2,length,height-.08,height+.06,'#c3c5b7',.46,.02);
  lettering(face.label||'UTBM',length*.24,length*.43,height*.45,height*.95,true,.5);
 }else{
  panel(length/2,length,.1,height,'#cac8bb',.06);
  for(let z=1;z<height;z+=2)panel(length/2,length,z,z+.018,'#acafa2',.075);
  for(let x=1;x<length;x+=3)panel(x,.018,.3,height-.2,'#acafa2',.075);
  pane(length*.27,Math.min(1.1,length*.1),.55,1.55,.1);
 }
 // These landmarks occur once on their photographed courtyard elevations.
 if(face.courtyardFeature==='library-bay'){
  const width=Math.min(15,length*.40),at=length*.26;
  const bottom=height*.28,top=height*.82,rise=top-bottom;
  box(at,width,bottom,top,'#ecebe4',.82,.04);
  box(at,.38,.03,bottom,concrete,.78,.40);
  for(const [offset,span] of [[.22,.42],[-.29,.21]]){
   const x=at+offset*width,w=span*width;
   const sill=bottom+rise*.24,head=top-rise*.20;
   panel(x,w,sill,head,frame,.84);
   const count=Math.max(2,Math.round(w/1.3)),pitch=w/count;
   for(let i=0;i<count;i++){
    const center=x-w/2+(i+.5)*pitch;
    if(draw.glazing)draw.glazing(center,pitch-.06,sill+.05,head-.05,.86,'fixed');
    else panel(center,pitch-.06,sill+.05,head-.05,glass,.86);
    windows++;
   }
   for(const level of [1/3,2/3]){
    const z=sill+(head-sill)*level;
    box(x,w+.05,z,z+.065,'#843e40',.96,.84);
   }
  }
  panel(at-width*.085,.34,bottom+rise*.60,bottom+rise*.60+.34,'#36594b',.85);
 }else if(face.courtyardFeature){
  const stgi=face.courtyardFeature==='stgi-entry';
  const width=Math.min(stgi?5.6:4.7,length*.40),at=length*(stgi?.25:.55);
  const top=Math.min(stgi?4.6:6.2,height*.68),color=stgi?'#168348':'#a3323a';
  box(at,width,.035,top,color,.90,.04);
  const door=at+width*.12;
  panel(door,width*.35,.06,2.14,stgi?'#7b8384':'#39474a',.915);
  panel(door-width*.085,width*.13,.11,1.99,'#35464a',.925);
  if(stgi){
   panel(at,width*.96,top-.77,top-.40,glass,.92);
   for(const side of [-1,1])box(at+side*width*.43,.15,top-.78,top-.39,'#953842',.95,.91);
   panel(at-width*.37,.26,1.22,1.53,'#dda631',.925);
  }
  const z=top*(stgi?.62:.57),signWidth=width*.76;
  panel(at,signWidth,z-.29,z+.29,'#efeee7',.926);
  lettering(stgi?'UFR STGI':'MESURES PHYSIQUES',at,signWidth*.91,z-.18,z+.18,false,.94,frame);
 }
 return windows;
}
