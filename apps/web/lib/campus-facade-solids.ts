import type {CityWorld} from './city-world';
import type {Position} from './walk-geometry';
import {campusProfile} from './campus-references';
import {drawCampusFacade} from './campus-architecture';
import {matchesFacadeEdge} from './facade-references';

export type FacadeSolid={sourceId:string;polygon:Position[];bottom:number;top:number;wallCenter:Position;normal:Position;front:number;width:number};
const meters=111319.4908,cos=Math.cos(47.51*Math.PI/180);

/** Derive substantial ground-level projections from the SAME boxes as rendering.
 * Upper canopies, tiny hardware and the already-collidable building body are
 * excluded. This prevents walking through the courtyard's concrete piers. */
export function campusFacadeSolids(data:CityWorld):FacadeSolid[]{
 const solids:FacadeSolid[]=[];
 for(const feature of data.buildings.features){
  const profile=campusProfile(feature.properties.sourceId);if(!profile)continue;
  const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
  const base=Number(feature.properties.render_min_height)||0,height=Number(feature.properties.render_height)-base;
  for(const polygon of polygons)for(const [ringIndex,ring] of polygon.entries()){
   // Subtract a local origin before the signed-area sum to avoid cancellation.
   const r=ring.map(p=>[(p[0]-ring[0][0])*meters*cos,(p[1]-ring[0][1])*meters]);
   const area=r.slice(1).reduce((sum,b,i)=>sum+r[i][0]*b[1]-b[0]*r[i][1],0);
   for(let i=1;i<ring.length;i++){
    const a=ring[i-1],b=ring[i],face=profile.faces.find(f=>matchesFacadeEdge(f,a,b));if(!face)continue;
    const dx=(b[0]-a[0])*meters*cos,dy=(b[1]-a[1])*meters,length=Math.hypot(dx,dy);if(length<.5)continue;
    const flip=(area>0?1:-1)*(ringIndex===0?1:-1),normal:Position=[dy/length*flip,-dx/length*flip];
    const point=(along:number,depth:number):Position=>[a[0]+(dx/length*along+normal[0]*depth)/(meters*cos),a[1]+(dy/length*along+normal[1]*depth)/meters];
    drawCampusFacade(face,length,height,{
     panel:()=>{},lettering:()=>{},glazing:()=>{},
     box:(at,width,bottom,top,_colour,front,back=.03)=>{
      if(front<.4||width<.25||top-bottom<.25||bottom>2.1||top<.3)return;
      solids.push({sourceId:profile.buildingId,polygon:[point(at-width/2,back),point(at+width/2,back),point(at+width/2,front),point(at-width/2,front)],bottom:base+bottom,top:base+top,wallCenter:point(at,0),normal,front,width});
     },
    });
   }
  }
 }
 return solids;
}
