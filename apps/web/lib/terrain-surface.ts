import type {TerrainTile} from './city-world';
type Point=[number,number];
type Vertex=[number,number,number];

/** Clip a convex overlay to the very same cell diagonals used by terrain and
 * physics. Sampling only its corners lets a path cut through a slope between them. */
export function drapeSurface(polygon:number[][],tile:TerrainTile,datum:number,lift:number):Vertex[][]{
 const [w,s,e,n]=tile.bounds,scale=tile.size-1;
 const grid:Point[]=polygon.map(p=>[(p[0]-w)/(e-w)*scale,(p[1]-s)/(n-s)*scale]);
 const triangles:Vertex[][]=[];
 const clip=(points:Point[],value:(p:Point)=>number)=>{
  const out:Point[]=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length],da=value(a),db=value(b);
   if(da>=-1e-10)out.push(a);
   if((da>=0)!==(db>=0)){const t=da/(da-db);out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}
  }
  return out;
 };
 const minX=Math.max(0,Math.floor(Math.min(...grid.map(p=>p[0])))),maxX=Math.min(scale-1,Math.floor(Math.max(...grid.map(p=>p[0]))));
 const minY=Math.max(0,Math.floor(Math.min(...grid.map(p=>p[1])))),maxY=Math.min(scale-1,Math.floor(Math.max(...grid.map(p=>p[1]))));
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
  let cell=grid;
  for(const edge of [(p:Point)=>p[0]-x,(p:Point)=>x+1-p[0],(p:Point)=>p[1]-y,(p:Point)=>y+1-p[1]])cell=clip(cell,edge);
  if(cell.length<3)continue;
  for(const lower of [true,false]){
   const part=clip(cell,p=>lower?1-(p[0]-x)-(p[1]-y):(p[0]-x)+(p[1]-y)-1);
   const at=(dx:number,dy:number)=>tile.heights[(y+dy)*tile.size+x+dx];
   const vertices:Vertex[]=part.map(([gx,gy])=>{
    const fx=gx-x,fy=gy-y,z=lower?at(0,0)+(at(1,0)-at(0,0))*fx+(at(0,1)-at(0,0))*fy:at(1,1)+(at(0,1)-at(1,1))*(1-fx)+(at(1,0)-at(1,1))*(1-fy);
    return [w+gx/scale*(e-w),s+gy/scale*(n-s),z-datum+lift];
   });
   for(let i=1;i<vertices.length-1;i++){
    const a=part[0],b=part[i],c=part[i+1];
    if(Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))>1e-12)triangles.push([vertices[0],vertices[i],vertices[i+1]]);
   }
  }
 }
 return triangles;
}
