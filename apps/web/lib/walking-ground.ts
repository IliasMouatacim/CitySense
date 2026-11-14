import {CAMPUS_NORTH_LAWN} from './campus-north-lawn';
import {getCityWorld,terrainHeight,type CityWorld} from './city-world';
import {insidePolygon,nearestOnLine,distance,offset,type Position} from './walk-geometry';
type Surface={bounds:number[];line:number[][];area:boolean;lift:number;width:number};
const cache=new WeakMap<CityWorld,Surface[]>();
export function walkingGroundHeight(position:Position){
 const world=getCityWorld(),height=terrainHeight(...position);if(!world||height===null)return height??0;
 if(!world.campus)return height;
 let surfaces=cache.get(world);
 if(!surfaces){
  surfaces=[];
  const add=(line:number[][],area:boolean,lift:number,width=0)=>{
   const margin=width/75400;
   surfaces!.push({line,area,lift,width,bounds:[Math.min(...line.map(p=>p[0]))-margin,Math.min(...line.map(p=>p[1]))-margin,Math.max(...line.map(p=>p[0]))+margin,Math.max(...line.map(p=>p[1]))+margin]});
  };
  add(CAMPUS_NORTH_LAWN.polygon,true,CAMPUS_NORTH_LAWN.lift);
  for(const a of world.campus.areas)add(a.coordinates,true,a.tags.highway==='pedestrian'&&a.tags.surface!=='asphalt'?.12:.035);
  for(const road of world.campus.roads){
   const t=road.tags;if(['motorway','motorway_link','trunk','trunk_link','steps','construction','proposed'].includes(t.highway)||t.tunnel==='yes')continue;
   const pedestrian=['footway','pedestrian','path','cycleway','living_street'].includes(t.highway),mapped=Number.parseFloat(t.width||''),lanes=Number(t.lanes);
   const width=Math.max(1,Math.min(20,Number.isFinite(mapped)?mapped:lanes>0?lanes*3:pedestrian?3:t.highway==='service'?4:6));
   add(road.coordinates,false,pedestrian?.075:.065,width/2);
   for(const side of [-1,1]){
    if(!['yes','both',side===1?'left':'right'].includes(t.sidewalk))continue;
    for(let i=1;i<road.coordinates.length;i++){
     const a=road.coordinates[i-1],b=road.coordinates[i],dx=(b[0]-a[0])*Math.cos(a[1]*Math.PI/180),dy=b[1]-a[1],length=Math.hypot(dx,dy);if(!length)continue;
     const shifted=(p:Position,d:number)=>offset(p,-dy/length*d*side,dx/length*d*side);
     add([shifted(a,width/2),shifted(b,width/2),shifted(b,width/2+1.6),shifted(a,width/2+1.6)],true,.19);
    }
   }
  }
  cache.set(world,surfaces);
 }
 let lift=0;
 for(const s of surfaces){
  const [w,south,e,n]=s.bounds;if(s.lift<=lift||position[0]<w||position[0]>e||position[1]<south||position[1]>n)continue;
  if(s.area?insidePolygon(position,[s.line]):distance(position,nearestOnLine(position,s.line))<=s.width)lift=s.lift;
 }
 return height+lift;
}
