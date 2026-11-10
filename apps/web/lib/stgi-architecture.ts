import type {CampusDrawing} from './campus-architecture';
import type {CampusFace} from './campus-references';
type Pane=(at:number,width:number,bottom:number,top:number,depth?:number)=>void;

/** Painted infill below the exposed concrete parapet, visible in both the
 * institutional colour view and Noscium's 2016 photograph. */
export function drawStgiPaint(length:number,height:number,draw:CampusDrawing){
 draw.panel(length/2,length,.04,height*.90,'#eeeae0',.043);
 // Paired shallow horizontal joints in the painted panels, not masonry courses.
 for(const z of [.315,.645])for(const offset of [0,.055])
  draw.panel(length/2,length,height*z+offset,height*z+offset+.012,'#c6c8c0',.051);
}

/** Architectural observations from stgi-court/stgi-colour, registered by the
 * facade manifest. Dimensions and edge registration remain visual estimates. */
export function drawStgiFacade(face:CampusFace,length:number,height:number,draw:CampusDrawing,pane:Pane){
 if(!['stgi-court','stgi-colour','stgi-ribbon'].includes(face.layout||''))return false;
 const {panel,box}=draw,concrete='#d2d1c8',frame='#344b4c';
 const bands=face.glazingBands||[[.055,.255],[.395,.585],[.735,.885]];
 if(face.layout==='stgi-court'){
  const pier=.38,bays=Math.max(1,Math.round((length-pier)/3.05)),pitch=(length-pier)/bays;
  for(const [row,band] of bands.entries()){
   const bottom=height*band[0],top=height*band[1];
   for(let bay=0;bay<bays;bay++){
    const at=pier/2+(bay+.5)*pitch,width=pitch-pier-.10;
    pane(at,width,bottom,top,.10);
    box(at,width,top-.26,top-.22,row===2?'#56715a':'#884b42',.23,.15);
    // Fine opening divisions sit behind the projecting concrete structure.
    box(at,width,bottom+(top-bottom)*.70,bottom+(top-bottom)*.70+.04,frame,.24,.15);
   }
  }
  // Continuous piers, cross beams and a deep roof soffit, rather than separate
  // window-sized decorative frames. These boxes also feed walking collision.
  for(let bay=0;bay<=bays;bay++){
   const at=pier/2+bay*pitch;
   box(at,pier,.025,height,concrete,.85,.03);
   for(let z=.55;z<height-.3;z+=1.25){
    panel(at-.09,.025,z,z+.025,'#969d92',.861);
    panel(at+.09,.025,z,z+.025,'#969d92',.861);
   }
  }
  for(const fraction of [.315,.645])box(length/2,length,height*fraction-.13,height*fraction+.13,concrete,.86,.03);
  box(length/2,length,height-.22,height+.08,concrete,.90,.03);
  box(length/2,length,height+.08,height+.12,'#637268',.91,.03);
  return true;
 }

 drawStgiPaint(length,height,draw);
 const accent=face.layout==='stgi-colour'?face.accentBay:undefined;
 // The coloured stair projection sits ABOVE the ground-floor ribbon. It is
 // not a doorway: the source photo shows windows continuing underneath it.
 for(const [row,band] of bands.entries()){
  const spans=accent&&row>0?[[.02,accent[0]],[accent[1],.98]]:[[.02,.98]];
  for(const [left,right] of spans){
   const width=(right-left)*length,bays=Math.max(1,Math.round(width/1.65)),pitch=width/bays;
   const bottom=band[0]*height,top=band[1]*height,at=(left+right)*length/2;
   for(let bay=0;bay<bays;bay++)pane(left*length+(bay+.5)*pitch,pitch-.10,bottom,top,.10);
   box(at,width,bottom-.16,bottom-.07,concrete,.25,.03);
   box(at,width,top-.22,top-.18,row===2?'#375e75':'#884b42',.23,.16);
   // The red rails stand forward of the glazing; short brackets connect them
   // to the mullions in the institutional and Commons close-up photographs.
   for(let bay=1;bay<bays;bay+=2)box(left*length+bay*pitch,.045,top-.28,top-.16,frame,.30,.14);
   // Red end caps at the upper ribbon are visible in the colour reference.
   if(row===2)for(const edge of [left*length+.10,right*length-.10])box(edge,.16,bottom-.08,top+.10,'#8d493f',.31,.05);
  }
 }
 if(accent){
  const [left,right]=accent,at=(left+right)*length/2,width=(right-left)*length;
  const bottom=height*.27,top=height-.10,accentColour='#328e83';
  box(at,width,bottom,top,accentColour,.34,.03);
  for(let z=bottom+.28;z<top-.1;z+=.62)panel(at,width,z,z+.012,'#277d74',.352);
  box(at,width+.08,bottom-.10,bottom+.01,accentColour,.42,.03);
  box(at,width+.06,top,top+.07,'#456f68',.40,.03);
  // Small horizontal opening, narrow yellow stair slit and red vent in the
  // photographed upper projection. No fabricated entrance below the panel.
  // IGN edge 9 runs right-to-left when viewed from outside. Keep the slit on
  // the photographed right of the projection instead of mirroring the facade.
  const openingAt=at+width*.12,openingWidth=width*.42;
  pane(openingAt,openingWidth,height*.365,height*.455,.38);
  const slit=left*length+width*.13,slitWidth=Math.min(.24,width*.065);
  pane(slit,slitWidth,height*.30,height*.87,.38);
  for(const x of [-1,1])box(slit+x*(slitWidth/2+.04),.065,height*.285,height*.885,'#b8a042',.47,.36);
  box(slit,slitWidth+.14,height*.285,height*.30,'#b8a042',.49,.36);
  for(const fraction of [.43,.59,.75])box(slit,slitWidth+.03,height*fraction,height*fraction+.075,'#b8a042',.46,.39);
  panel(at+width*.06,.12,height*.72,height*.75,'#8d493f',.37);
 }
 box(length/2,length,height-.13,height+.06,'#aeb3a8',.15,.03);
 return true;
}
