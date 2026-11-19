import type {CampusDrawing} from './campus-architecture';
import {campusProfile} from './campus-references';
import type {CityWorld} from './city-world';
import type {Position} from './walk-geometry';

export const auditoriumId='BATIMENT0000000223563413';
export const galleryId='BATIMENT0000000223563414';
const count=18,tread=.31,landing=1.15,stairWidth=3.4;
const stairCenter=2.15;
const run=count*tread+landing;
const rise=(height:number)=>height*.48;

export function drawAmphitheatreFront(length:number,height:number,draw:CampusDrawing){
 const {box,panel}=draw,top=rise(height),concrete='#d2d1c8',frame='#344b4c';
 // The upper entry is reached by the flight on the viewer's right.
 for(let i=0;i<count;i++){
  const outer=run-i*tread,inner=outer-tread,z=top*(i+1)/count;
  box(stairCenter,stairWidth,.015,z,'#64645f',outer,inner);
  for(const side of [-1,1])box(stairCenter+side*(stairWidth/2+.11),.22,.015,z+.48,concrete,outer,inner);
 }
 box(stairCenter,stairWidth,.015,top,'#64645f',landing,.02);
 for(const side of [-1,1])box(stairCenter+side*(stairWidth/2+.11),.22,.015,top+.48,concrete,landing,.02);
 const panes=(at:number,width:number,bottom:number,head:number)=>{
  const n=Math.ceil(width/1.15),pitch=width/n;
  panel(at,width,bottom,head,frame,.14);
  for(let i=0;i<n;i++){
   const x=at-width/2+(i+.5)*pitch;
   if(draw.glazing)draw.glazing(x,pitch-.08,bottom+.07,head-.07,.16,'fixed');
   else panel(x,pitch-.08,bottom+.07,head-.07,'#53676a',.16);
  }
  return n;
 };
 let windows=panes(length*.52,length*.91,.10,top-.12);
 for(const fraction of [.22,.44,.68,.94])box(length*fraction,.24,.03,top,concrete,.72,.05);
 box(length/2,length,top-.12,top+.12,concrete,.75,.04);
 windows+=panes(length*.20,length*.36,top+.15,height*.83);
 for(const at of [.57,.79])windows+=panes(length*at,1.35,height*.59,height*.75);
 box(length/2,length,height*.86,height-.03,concrete,.80,.04);
 return windows;
}

// Use the same registered wall, run and rise as the rendered flight. Its bearing
// is west to east, with the stairs projecting north into the courtyard.
const front=campusProfile(galleryId)?.faces.find(f=>f.layout==='amphi-front');
const stairCache=new WeakMap<CityWorld,{base:number;height:number}>();
export function amphitheatreStairHeight(point:Position,world:CityWorld){
 if(!front||Math.abs(point[0]-front.a[0])>.00015||Math.abs(point[1]-front.a[1])>.00012)return;
 const east=111319.49*Math.cos(front.a[1]*Math.PI/180),north=111319.49;
 const dx=(front.b[0]-front.a[0])*east,dy=(front.b[1]-front.a[1])*north,len=Math.hypot(dx,dy);
 const x=(point[0]-front.a[0])*east,y=(point[1]-front.a[1])*north;
 const along=(dx*x+dy*y)/len,depth=(-dy*x+dx*y)/len;
 if(Math.abs(along-stairCenter)>stairWidth/2||depth<0||depth>run)return;
 let elevation=stairCache.get(world);
 if(!elevation){
  const props=world.buildings.features.find(f=>f.properties.sourceId===galleryId)?.properties;
  if(!props)return;
  const base=Number(props.render_min_height);
  elevation={base,height:Number(props.render_height)-base};stairCache.set(world,elevation);
 }
 const step=Math.min(count,Math.floor((run-depth)/tread)+1);
 return elevation.base+rise(elevation.height)*step/count;
}
