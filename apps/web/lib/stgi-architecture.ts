import type {CampusDrawing} from './campus-architecture';
import type {CampusFace} from './campus-references';
type Pane=(at:number,width:number,bottom:number,top:number,depth?:number)=>void;

export const GARDEN_C_MURAL={center:.41,span:.32,bottom:.30,top:.215,depth:.194};

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
 if(face.layout==='stgi-east-wing'){
  // Photographed STGI east garden classroom wings flanking the breezeway bridge:
  // two broad dark-framed lower glazing bands with projecting red horizontal rails,
  // a white 1st-floor spandrel band, a tall white 2nd-floor panel with narrow green
  // and blue clerestory ribbons + corbel blocks, and a dark grey concrete parapet.
  const wall='#eceae2',darkFrame='#20292b',redRail='#a13b35',parapet='#7e8079';
  const g0=.08,g1=height*.248,s1=height*.318,f1=height*.546,wTop=height*.845;
  // Ground & 1st floor dark window bands
  const bays=Math.max(2,Math.round(length/1.85)),pitch=(length-.16)/bays;
  for(const [bottom,top,railZ] of [[g0,g1,height*.190],[s1,f1,height*.490]] as const){
   draw.panel(length/2,length-.08,bottom,top,darkFrame,.07);
   for(let b=0;b<bays;b++){
    const at=.08+(b+.5)*pitch,w=pitch-.07;
    if(draw.glazing)draw.glazing(at,w,bottom+.04,top-.04,.10,'fixed');
    else draw.panel(at,w,bottom+.04,top-.04,'#384e52',.10);
    // Occasional dark solid casement panel observed inside the ribbon
    if((b+Math.round(bottom))%3===1)draw.panel(at+w*.26,w*.36,bottom+.32,top-.30,'#182022',.115);
   }
   for(let b=0;b<=bays;b++)draw.box(.08+b*pitch,.055,bottom,top,darkFrame,.17,.06);
   for(const frac of [.34,.76]){
    const z=bottom+(top-bottom)*frac;
    draw.box(length/2,length-.10,z-.022,z+.022,darkFrame,.175,.07);
   }
   // Continuous red horizontal guardrail bar in front of the dark glazing
   draw.box(length/2,length-.04,railZ-.024,railZ+.024,redRail,.24,.15);
  }
  // White painted spandrel band between ground and 1st floor
  draw.box(length/2,length,g1,s1,wall,.16,.03);
  draw.box(length/2,length,g1-.03,g1+.02,'#6e716a',.165,.04);
  draw.box(length/2,length,s1-.035,s1+.01,'#b5b7af',.18,.04);
  // Tall white 2nd-floor painted panel
  const greenBot=height*.734,greenTop=height*.768,blueBot=height*.796;
  draw.box(length/2,length,f1,greenBot,wall,.15,.03);
  draw.box(length/2,length,f1-.03,f1+.02,'#6e716a',.16,.04);
  // Subtle vertical panel seams in the white spandrel
  for(let b=1;b<bays;b++)draw.panel(.08+b*pitch,.016,f1+.04,greenBot-.04,'#d2d0c7',.155);
  // Narrow green-framed lower clerestory strip + projecting corbel blocks
  draw.panel(length/2,length-.12,greenBot,greenTop,'#2d5e4c',.08);
  for(let b=0;b<bays;b++){
   const at=.08+(b+.5)*pitch,w=pitch-.07;
   if(draw.glazing)draw.glazing(at,w,greenBot+.03,greenTop-.03,.105,'fixed');
   else draw.panel(at,w,greenBot+.03,greenTop-.03,'#466a5e',.105);
  }
  draw.box(length/2,length-.08,greenBot-.035,greenBot+.01,'#386d59',.20,.06);
  for(const frac of length>7?[.24,.76]:[.45]){
   draw.box(length*frac,.22,greenBot-.04,greenTop+.05,'#875e54',.28,.05);
  }
  // Thin white divider between green and blue clerestory ribbons
  draw.box(length/2,length,greenTop,blueBot,wall,.15,.03);
  // Upper blue-framed clerestory ribbon under the parapet
  draw.panel(length/2,length-.12,blueBot,wTop,'#355f78',.08);
  for(let b=0;b<bays;b++){
   const at=.08+(b+.5)*pitch,w=pitch-.07;
   if(draw.glazing)draw.glazing(at,w,blueBot+.03,wTop-.03,.105,'fixed');
   else draw.panel(at,w,blueBot+.03,wTop-.03,'#4a6c80',.105);
  }
  // Top weathered dark-grey exposed concrete parapet
  draw.box(length/2,length,wTop,height,parapet,.17,.03);
  for(let b=1;b<bays;b++)draw.panel(.08+b*pitch,.02,wTop+.03,height-.04,'#64665f',.176);
  draw.box(length/2,length,height-.06,height+.04,'#555c5a',.21,.03);
  return true;
 }
 if(face.layout==='stgi-bridge'||face.layout==='stgi-bridge-west'){
  // Elevated 2-storey glazed bridge over the open breezeway between STGI wings.
  const east=face.layout==='stgi-bridge',frame='#717c7f',slab='#b0b2aa';
  const f1Bot=.22,f1Top=height*.455,f2Bot=height*.515,f2Top=height*.90;
  draw.box(length/2,length,0,f1Bot,slab,.14,.03);
  draw.box(length/2,length,f1Top,f2Bot,slab,.14,.03);
  draw.box(length/2,length,f2Top,height,'#989a92',.15,.03);
  // Rooftop safety handrail visible above the bridge in the photographs
  for(const z of [height+.28,height+.58])draw.box(length/2,length-.3,z,z+.03,'#8d9496',.12,.06);
  for(const frac of [.12,.38,.62,.88])draw.box(length*frac,.035,height,height+.60,'#8d9496',.12,.06);
  const bays=3,pitch=(length-.28)/bays;
  for(const [bottom,top] of [[f1Bot,f1Top],[f2Bot,f2Top]] as const){
   draw.panel(length/2,length-.20,bottom,top,frame,.07);
   for(let b=0;b<bays;b++){
    const at=.14+(b+.5)*pitch,w=pitch-.07;
    if(draw.glazing)draw.glazing(at,w,bottom+.04,top-.04,.10,'fixed');
    else draw.panel(at,w,bottom+.04,top-.04,'#687d82',.10);
   }
   for(let b=0;b<=bays;b++)draw.box(.14+b*pitch,.055,bottom,top,frame,.16,.06);
   for(const frac of [.38,.74]){
    const z=bottom+(top-bottom)*frac;
    draw.box(length/2,length-.20,z-.022,z+.022,frame,.165,.06);
   }
   // Three horizontal metallic guardrail tubes across the lower glass
   for(const r of [.13,.24,.35]){
    const z=bottom+(top-bottom)*r;
    draw.box(length/2,length-.22,z-.016,z+.016,'#869093',.185,.12);
   }
  }
  if(east){
   // Projecting mint-turquoise balcony box and red square panel with white centre
   const cx=length*.50;
   draw.box(cx,.94,f1Top-.18,f2Bot+.72,'#3a9a78',.34,.08);
   draw.box(cx,.94,f1Top-.22,f1Top-.18,'#255d49',.34,.08);
   draw.box(cx,.72,f2Bot+.74,f2Bot+1.46,'#b83836',.22,.08);
   draw.panel(cx,.24,f2Bot+.98,f2Bot+1.22,'#f2f0e8',.235);
   // Full-height vertical concrete rainwater column at the left junction
   draw.box(.15,.24,-2.95,height,'#88867d',.23,.03);
  }
  return true;
 }
 if(face.layout==='stgi-white-tower'){
  // Projecting rectangular white shaft rising above the north-wing parapet.
  const top=height+1.15;
  draw.box(length/2,length,.03,top,'#eceae2',.14,.025);
  for(const z of [height*.32,height*.64,height*.92])draw.panel(length/2,length,z,z+.018,'#cfcdc4',.148);
  if(length>2.5)draw.panel(length*.24,.22,height-.15,height+.18,'#3a3d3a',.155);
  draw.box(length/2,length,top-.06,top+.04,'#606663',.18,.03);
  return true;
 }
 if(face.layout==='stgi-stair-flat-left'||face.layout==='stgi-stair-flat-right'){
  // Flat side of the curved board-marked concrete stair towers (wings A-south and A-north).
  const top=height+.85,concrete='#c2bfb4',seam='#8c8a80',dark='#21292b';
  draw.box(length/2,length,.03,top,concrete,.12,.025);
  draw.panel(length/2,length,.03,.38,'#858379',.126);
  for(const z of [height*.315,height*.635,height*.91])draw.panel(length/2,length,z,z+.024,seam,.128);
  for(let x=.45;x<length-.3;x+=.55)draw.panel(x,.014,.38,top-.08,'#b2afa4',.125);
  // Tall vertical dark window/channel near the inner corner turning horizontally at the top
  const slotAt=length-.38;
  draw.panel(slotAt,.26,height*.29,height*.89,dark,.135);
  if(draw.glazing)draw.glazing(slotAt,.18,height*.30,height*.88,.14,'fixed');
  const barWidth=Math.min(2.3,length*.42),barAt=slotAt-barWidth/2+.10;
  draw.panel(barAt,barWidth,height*.865,height*.905,dark,.135);
  draw.box(barAt-barWidth/2+.12,.22,height*.855,height*.915,'#6b453c',.20,.08);
  // Small golden-yellow framed square peep window below the upper dark bar
  const peepAt=length-1.45,peepZ=height*.75;
  draw.box(peepAt,.46,peepZ-.23,peepZ+.23,'#d8ab34',.17,.08);
  if(draw.glazing)draw.glazing(peepAt,.34,peepZ-.17,peepZ+.17,.145,'fixed');
  else draw.panel(peepAt,.34,peepZ-.17,peepZ+.17,dark,.145);
  // Medium teal-green framed square window at mid-height toward the curved end
  const midAt=Math.min(1.65,length*.32),midZ=height*.39;
  draw.box(midAt,1.12,midZ-.60,midZ+.60,'#2c6555',.18,.08);
  if(draw.glazing)draw.glazing(midAt,.96,midZ-.52,midZ+.52,.145,'fixed');
  else draw.panel(midAt,.96,midZ-.52,midZ+.52,'#293a3c',.145);
  draw.box(midAt,1.16,midZ-.64,midZ-.57,'#858880',.21,.08);
  // Ground-floor dark service door and small dark-framed square window beside it
  const doorAt=length-.95;
  draw.box(doorAt,.96,.04,2.14,'#232f34',.15,.06);
  const lowAt=length-2.10;
  draw.box(lowAt,.54,1.42,2.08,dark,.16,.07);
  if(draw.glazing)draw.glazing(lowAt,.42,1.48,2.02,.14,'fixed');
  draw.box(length/2,length,top-.06,top+.04,'#72756e',.16,.03);
  return true;
 }
 if(face.layout==='stgi-stair-curve'||face.layout==='stgi-stair-slit'){
  // Curved eastern nose of the board-marked concrete stair towers.
  const top=height+.85,concrete='#c2bfb4',seam='#8c8a80';
  draw.box(length/2,length,.03,top,concrete,.12,.025);
  draw.panel(length/2,length,.03,.42,'#7d7b72',.126);
  for(const z of [height*.315,height*.635,height*.91])draw.panel(length/2,length,z,z+.024,seam,.128);
  for(let x=.22;x<length-.15;x+=.36)draw.panel(x,.014,.42,top-.08,'#b2afa4',.125);
  if(face.layout==='stgi-stair-slit'){
   // Full-height vertical stair window slit with green jambs and 5 bright yellow horizontal bars
   const at=length/2,w=Math.min(.54,length*.56),bot=1.40,slitTop=height*.91;
   draw.panel(at,w,bot,slitTop,'#21322e',.135);
   if(draw.glazing)draw.glazing(at,w-.08,bot+.05,slitTop-.05,.142,'fixed');
   for(const side of [-1,1])draw.box(at+side*(w/2+.035),.07,bot-.04,slitTop+.04,'#2f755e',.20,.08);
   draw.box(at,w+.14,bot-.06,bot+.02,'#e0b832',.22,.08);
   for(const frac of [.27,.41,.55,.69,.82]){
    const z=height*frac;
    draw.box(at,w+.04,z-.08,z+.08,'#e0b832',.21,.10);
   }
  }
  draw.box(length/2,length,top-.06,top+.04,'#72756e',.16,.03);
  return true;
 }
 if(face.layout==='library-east-striped'){
  // South-facing concrete-and-red-brick striped return of the library east wing (Image 4 background).
  draw.panel(length/2,length,.04,height,'#9c9b92',.06);
  for(const at of [.35,length-.35])draw.box(at,.70,.04,height,'#8d8c84',.14,.03);
  for(let row=0;row<6;row++){
   const z=1.15+row*2.05;
   if(z+.95<height-.4)draw.panel(length/2,length-1.4,z,z+.95,'#a66d5f',.075);
  }
  // Small red-framed square window on the lower right of this face
  const wx=length*.82,wz=4.1;
  draw.box(wx,.68,wz-.34,wz+.34,'#7d3935',.16,.06);
  if(draw.glazing)draw.glazing(wx,.52,wz-.26,wz+.26,.12,'fixed');
  draw.box(length/2,length,height-.16,height+.04,'#686b65',.18,.03);
  return true;
 }
 if(face.layout==='library-east-white'){
  // East-facing white wall of the library east wing with small punched square windows (Image 4 far right).
  draw.panel(length/2,length,.04,height-1.35,'#eceae2',.07);
  draw.box(length/2,length,height-1.35,height,'#7e8079',.14,.03);
  const punched:[number,number,number,number,string][]=[
   [.30,1.05,10.2,.95,'#c89c42'],
   [.68,.55,10.35,.55,'#354244'],
   [.30,1.05,7.1,.95,'#354244'],
   [.68,.48,7.2,.48,'#7c433b'],
   [.35,1.65,4.2,.55,'#354244'],
   [.24,.75,2.1,1.25,'#354244'],
  ];
  for(const [frac,w,z,h,accent] of punched){
   if(z+h/2>height-1.4)continue;
   const at=length*frac;
   draw.box(at,w+.12,z-h/2-.06,z+h/2+.06,accent,.15,.06);
   if(draw.glazing)draw.glazing(at,w,z-h/2,z+h/2,.10,'fixed');
  }
  draw.box(length/2,length,height-.10,height+.04,'#5a605d',.18,.03);
  return true;
 }
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
   // B faces the exhibition windows of C. The oblique view shows a yellow
   // infill behind charcoal posts and a broad red soffit. Depths are estimates.
   const bay=span/3,rail=ceiling*.37,upperRail=ceiling*.79;
   draw.panel(at,span,.055,ceiling,frame,.14);
   for(let i=0;i<3;i++){
    const x=at+bay*(i-1),w=bay-.09;
    if(draw.glazing)draw.glazing(x,w,.14,ceiling-.10,.165,'fixed');
    else draw.panel(x,w,.14,ceiling-.10,'#57696b',.165);
    draw.box(x,w,upperRail,upperRail+.065,frame,.21,.15);
    draw.box(x,w,rail,rail+.115,'#4a5956',.23,.15);
    draw.box(x,w,.08,.15,'#374143',.22,.15);
    if(i===1){
     const inset=Math.min(.48,w*.27),edge=x+w/2-inset/2;
     draw.panel(edge,inset,rail+.12,ceiling-.10,'#534631',.195);
     draw.panel(edge,inset-.045,rail+.16,ceiling-.145,'#cc9c28',.205);
    }
   }
   const projection=1.78,postDepth=projection-.26;
   draw.box(at,span+.22,ceiling,ceiling+.24,'#b3b6aa',projection,.04);
   draw.box(at,span+.16,ceiling-.065,ceiling,'#743635',projection-.02,.045);
   draw.box(at,span+.25,ceiling+.24,ceiling+.28,'#46504f',projection+.025,.04);
   for(const side of [-1,1]){
    const x=at+side*(span/2-.29),radius=.17;
    if(draw.column)draw.column(x,postDepth,radius,.03,ceiling-.065,'#515a5c');
    else draw.box(x,radius*2,.03,ceiling-.065,'#515a5c',postDepth+radius,postDepth-radius);
    const lamp=x-side*.42;
    draw.box(lamp,.36,ceiling-.106,ceiling-.064,'#343a38',postDepth+.11,postDepth-.11);
    draw.box(lamp,.30,ceiling-.111,ceiling-.104,'#dfdfcd',postDepth+.08,postDepth-.08);
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
 if(face.layout==='garden-c'||face.layout==='garden-c-connector'){
  const connector=face.layout==='garden-c-connector';
  const wall='#eeeee8',frame='#344b4c',soffit=height*.298,upper=height*.844;
  draw.panel(length/2,length,.035,height-.12,wall,.065);
  draw.box(length/2,length,connector?height*.937:height-.19,height+.04,'#aeb3a8',.18,.04);
  const bays=Math.max(3,Math.round(length/2.1)),pitch=(length-.20)/bays;
  for(let i=0;i<bays;i++){
   pane(.10+(i+.5)*pitch,pitch-.06,upper,height*.942,.13);
   if(connector&&Math.abs(i-(bays-1)/2)<.6){
    const mid=(upper+height*.94)/2;
    draw.box(.10+i*pitch,.22,mid,height*.94,'#9e3532',.31,.06);
    draw.box(.10+i*pitch,.22,upper-.025,mid,'#278a5b',.31,.06);
   }else if(i%2===1){
    draw.box(.10+i*pitch,.18,upper-.025,height*.94,'#963f40',.31,.06);
   }
  }

  if(connector){
   // Pair of shallow channels under the top band visible in the photo.
   for(const z of [height*.750,height*.766])draw.panel(length/2,length,z,z+.014,'#bbbdb3',.074);
  }
  const canopyLeft=length*(connector?.055:.23),canopyRight=length*.99;
  const canopyWidth=canopyRight-canopyLeft,canopyCenter=(canopyLeft+canopyRight)/2;
  draw.box(canopyCenter,canopyWidth,soffit,soffit+.20,'#b3b6aa',.98,.035);
  draw.box(canopyCenter,canopyWidth,soffit-.085,soffit,'#7a3738',.975,.04);
  draw.box(canopyCenter,canopyWidth,soffit+.20,soffit+.246,'#394447',.99,.035);
  for(const fraction of connector?[.085,.735]:[.252,.731]){
   const at=length*fraction,depth=.78,radius=.15;
   if(draw.column)draw.column(at,depth,radius,.03,soffit-.085,'#6c797b');
   else draw.box(at,radius*2,.03,soffit-.085,'#6c797b',depth+radius,depth-radius);
  }

  const glass=(at:number,width:number,bottom:number,top:number)=>{
   draw.panel(at,width,bottom,top,frame,.135);
   if(draw.glazing)draw.glazing(at,width-.065,bottom+.045,top-.045,.175,'fixed');
   else draw.panel(at,width-.065,bottom+.045,top-.045,'#587077',.175);
  };
  const art=GARDEN_C_MURAL;
  for(const offset of [-.25,.25])glass(length*(art.center+offset*art.span),length*art.span/2,.12,soffit-.19);
  const door=length*.577,doorWidth=Math.max(1.45,length*.095);
  for(const side of [-1,1]){
   const leaf=door+side*doorWidth/4;
   glass(leaf,doorWidth/2,.06,2.18);
   draw.box(leaf,doorWidth*.5-.075,.07,.21,'#526469',.235,.17);
   draw.box(door+side*.09,.034,.88,1.20,'#a8b3ac',.25,.18);
  }
  glass(door,doorWidth,2.22,soffit-.19);
  const sideDoor=length*.848,sideWidth=length*.097;
  glass(sideDoor,sideWidth,.095,soffit-.19);
  draw.box(sideDoor+sideWidth*.40,sideWidth*.17,.10,2.18,'#28527f',.22,.10);
  draw.panel(sideDoor-sideWidth*.10,sideWidth*.44,.16,.43,'#abb0a0',.189);
  for(const [at,width] of connector?[[.475,.17]]:[[.47,.15],[.835,.22]]){
   glass(length*at,length*width,height*.333,height*.606);
   draw.box(length*at,length*width,height*.437,height*.447,'#718681',.228,.168);
   draw.panel(length*(at+width*(connector?-.30:.30)),length*width*.34,height*.449,height*.601,'#a74944',.198);
  }
  draw.panel(length*.27,.37,height*.429,height*.429+.48,'#b99842',.15);
  draw.box(length*.27,.40,height*.415,height*.429,'#75805c',.25,.09);
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
