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

type InfillOpening={left:number;right:number;bottom:number;top:number};
/** Painted wall shell with window voids and solid opening reveals. */
function drawStgiInfill(length:number,top:number,openings:InfillOpening[],draw:CampusDrawing){
 const edges=[...new Set([.04,...openings.flatMap(o=>[o.bottom,o.top]),top])].sort((a,b)=>a-b);
 for(let row=1;row<edges.length;row++){
  const bottom=edges[row-1],upper=edges[row],mid=(bottom+upper)/2;
  const gaps=openings.filter(o=>o.bottom<mid&&o.top>mid).sort((a,b)=>a.left-b.left);
  let left=0;
  for(const gap of [...gaps,{left:length,right:length}]){
   if(gap.left>left)draw.panel((left+gap.left)/2,gap.left-left,bottom,upper,'#eeeae0',.12);
   left=Math.max(left,gap.right);
  }
 }
 // Only the opening boundaries need side faces. Avoid hidden internal faces
 // between adjacent infill strips, which produce self-shadow speckling.
 for(const opening of openings){
  for(const x of [opening.left,opening.right])draw.box(x,.018,opening.bottom,opening.top,'#d8d6cd',.12,.028);
  for(const z of [opening.bottom,opening.top])draw.box((opening.left+opening.right)/2,opening.right-opening.left,z-.009,z+.009,'#d8d6cd',.12,.028);
 }
}

/** Architectural observations from stgi-court/stgi-colour, registered by the
 * facade manifest. Dimensions and edge registration remain visual estimates. */
export function drawStgiFacade(face:CampusFace,length:number,height:number,draw:CampusDrawing,pane:Pane){
 if(face.layout==='garden-b'||face.layout==='garden-b-return'){
  const garden=face.layout==='garden-b',wall='#eeeee8',frame='#344b4c';
  const cornerWidth=garden?length*.39:Math.min(4.2,length*.32);
  const corner=garden?length-cornerWidth/2:cornerWidth/2;
  draw.panel(length/2,length,.035,height-.12,wall,.08);
  // Both surveyed edges meet at the white corner. Align the large fixed
  // lights and their high transom across it at the same elevations.
  const sill=height*.39,head=height*.72,transom=head-(head-sill)*.23;
  draw.panel(corner,cornerWidth,sill,head,frame,.15);
  const panes=garden?1:2;
  for(let i=0;i<panes;i++){
   const x=corner-cornerWidth/2+(i+.5)*cornerWidth/panes,w=cornerWidth/panes-.08;
   if(draw.glazing)draw.glazing(x,w,sill+.055,head-.065,.166,'fixed');
   else draw.panel(x,w,sill+.055,head-.065,'#607778',.166);
  }
  draw.box(corner,cornerWidth,transom,transom+.09,frame,.24,.16);
  draw.box(corner,cornerWidth,sill-.06,sill,frame,.23,.085);
  const upper=height*.845;
  pane(length/2,length-.22,upper,height*.94,.14);
  if(garden){
   for(const t of [.20,.65])draw.box(length*t,.16,upper-.03,height*.94,'#963f40',.30,.09);
   const at=length*.36,span=length*.60,ceiling=height*.30;
   draw.panel(at,span,.06,ceiling,frame,.14);
   for(let i=0;i<3;i++)pane(at+span*((i+.5)/3-.5),span/3-.10,.14,ceiling-.15,.16);
   draw.box(at,span+.22,ceiling,ceiling+.27,'#b3b6aa',.98,.04);
   draw.box(at,span+.16,ceiling-.06,ceiling,'#743635',.975,.045);
   for(const side of [-1,1]){
    const x=at+side*(span/2-.29),depth=.74,radius=.17;
    if(draw.column)draw.column(x,depth,radius,.03,ceiling-.06,frame);
    else draw.box(x,radius*2,.03,ceiling-.06,frame,depth+radius,depth-radius);
   }
  }else{
   // The near end in the garden photo is solid around the plaque and
   // punched window. Continue the mapped classroom bands beyond that bay.
   const z=height*.155;
   const small=cornerWidth*.77;
   draw.panel(small,.93,z-.50,z+.49,frame,.12);
   if(draw.glazing)draw.glazing(small,.82,z-.445,z+.435,.14,'fixed');
   else draw.panel(small,.82,z-.445,z+.435,'#4a6263',.14);
   draw.box(small,.99,z-.55,z-.49,frame,.23,.10);
   const rest=length-cornerWidth-.5,bays=Math.max(1,Math.round(rest/1.85));
   for(const [lo,hi] of [[.055,.255],[.395,.585]])for(let i=0;i<bays;i++){
    pane(cornerWidth+.30+(i+.5)*rest/bays,rest/bays-.09,height*lo,height*hi,.13);
   }
  }
  return true;
 }
 if(face.layout==='garden-c'){
  const wall='#eeeae0',frame='#344b4c';
  const front=height*.30,upper=height*.82;
  draw.panel(length/2,length,.035,height-.12,wall,.055);
  const bays=Math.max(3,Math.round(length/1.55)),pitch=(length-.20)/bays;
  // Slim upper ribbon, punctuated by projecting red brackets.
  for(let i=0;i<bays;i++){
   pane(.10+(i+.5)*pitch,pitch-.08,upper,height*.94,.13);
   if(i%3===0)draw.box(.16+i*pitch,.14,upper-.03,height*.94,'#963f40',.32,.06);
  }
  const entrance=length*.70,span=length*.48;
  draw.panel(entrance,span,.06,front,frame,.15);
  for(let i=0;i<4;i++)pane(entrance+span*((i+.5)/4-.5),span/4-.11,.15,front-.16,.21);
  draw.box(entrance,span+.22,front,front+.18,'#b5b3a9',.95,.035);
  draw.box(entrance,span+.16,front-.07,front,'#7a3738',.94,.04);
  for(const side of [-1,1])draw.box(entrance+side*(span/2-.19),.26,.03,front,frame,.91,.65);
  const windowAt=length*.45,width=length*.22;
  pane(windowAt,width,height*.40,height*.65,.13);
  draw.panel(windowAt+width*.36,width*.24,height*.42,height*.64,'#ab5149',.25);
  const accent=length*.19;
  draw.panel(accent,.46,height*.43,height*.43+.50,'#a88f38',.14);
  const sign=length*.39;
  draw.panel(sign,1.05,1.52,2.52,wall,.26);
  draw.panel(sign,.96,1.77,2.27,'#434951',.28);
  draw.lettering('BÂTIMENT C',sign,.90,1.85,2.18,false,.29,'#ffffff');
  for(const [i,color] of ['#52a356','#287a90','#d04752','#81649b','#d59444'].entries()){
   draw.panel(sign-.38+i*.17,.14,2.30,2.46,color,.28);
  }
  return true;
 }
 if(!['stgi-court','stgi-colour','stgi-ribbon','stgi-return','stgi-north-openings'].includes(face.layout||''))return false;
 const {panel,box}=draw,concrete='#d2d1c8',frame='#344b4c';
 const bands=face.glazingBands||[[.055,.255],[.395,.585],[.735,.885]];
 if(face.layout==='stgi-north-openings'){
  // The anniversary booklet aerial identifies painted panels and grouped
  // north-side openings. Fractions are estimated from the oblique view.
  // Build infill around the openings, leaving the glazing recessed behind it.
  // A continuous thin decal over the IGN envelope flickers in close views.
  drawStgiInfill(length,height*.88,(face.openings||[]).map(o=>({left:length*(o.at-o.width/2),right:length*(o.at+o.width/2),bottom:height*o.bottom,top:height*o.top})),draw);
  for(const opening of face.openings||[])pane(length*opening.at,length*opening.width,height*opening.bottom,height*opening.top,.10);
  box(length/2,length,height*.88,height,concrete,.14,.035);
  box(length/2,length,height-.12,height+.06,'#637268',.20,.028);
  box(length/2,length,.035,.26,'#929a90',.16,.028);
  return true;
 }
 if(face.layout==='stgi-return'){
  // West return visible behind the stair tower in Lionel Vadam's 2023 C view.
  // Registration, bay splits and relief are approximate; other faces stay solid.
  const margin=.45,bays=2,pitch=(length-margin*2)/bays;
  const returnBands=[[.09,.27],[.365,.545],[.64,.80]];
  drawStgiInfill(length,height*.82,returnBands.flatMap(([bottom,top])=>
   Array.from({length:bays},(_,bay)=>{const at=margin+(bay+.5)*pitch,width=pitch-.07;return {left:at-width/2,right:at+width/2,bottom:height*bottom,top:height*top};})),draw);
  for(const [bottom,top] of returnBands){
   for(let bay=0;bay<bays;bay++)pane(margin+(bay+.5)*pitch,pitch-.07,height*bottom,height*top,.10);
   // The partial west view shows projecting shades over each window band.
   box(length/2,length+.12,height*top+.10,height*top+.235,concrete,.65,.035);
   box(length/2,length+.12,height*top+.09,height*top+.115,'#7d8980',.67,.56);
  }
  box(length/2,length,height*.82,height-.20,'#eeeae0',.20,.03);
  box(length/2,length,height-.20,height,concrete,.20,.03);
  box(length/2,length,height-.12,height+.06,'#637268',.26,.028);
  box(length/2,length,.035,.26,'#929a90',.16,.028);
  for(const at of [.12,length-.12])box(at,.24,.03,height*.82,'#eeeae0',.28,.035);
  if(face.label)draw.lettering(face.label,length/2,length*.82,height*.85,height*.94,false,.22,'#6a4442');
  return true;
 }
 if(face.layout==='stgi-court'){
  if(face.courtyardFeature==='stgi-entry')for(const [bottom,top] of [[.005,bands[0][0]],[bands[0][1],bands[1][0]],[bands[1][1],bands[2][0]],[bands[2][1],.98]]){
   panel(length/2,length,height*bottom,height*top,'#eeeae0',.065);
  }
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
