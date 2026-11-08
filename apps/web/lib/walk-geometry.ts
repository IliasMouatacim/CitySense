export type Position = [number, number];
export type Polygon = number[][][];
export type Obstacle = {rings:Polygon; bounds:[number,number,number,number]; kind:'building'|'water'};
const METERS_PER_DEGREE=111319.49079327358;
export function offset(position:Position,east:number,north:number):Position {
  return [position[0]+east/(METERS_PER_DEGREE*Math.cos(position[1]*Math.PI/180)),position[1]+north/METERS_PER_DEGREE];
}
export function distance(a:Position,b:Position) {
  return Math.hypot((a[0]-b[0])*METERS_PER_DEGREE*Math.cos((a[1]+b[1])*Math.PI/360),(a[1]-b[1])*METERS_PER_DEGREE);
}
export function advance(position:Position,bearing:number,forward:number,strafe:number,meters:number):Position {
  const length=Math.hypot(forward,strafe);if(!length)return position;
  const angle=bearing*Math.PI/180,f=forward/length,s=strafe/length;
  return offset(position,(f*Math.sin(angle)+s*Math.cos(angle))*meters,(f*Math.cos(angle)-s*Math.sin(angle))*meters);
}
function inRing(point:Position,ring:number[][]) {
  let inside=false;
  for(let i=0,j=ring.length-1;i<ring.length;j=i++){
    const a=ring[i],b=ring[j];
    if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
}
export function insidePolygon(point:Position,rings:Polygon) {
  return rings.length>0&&inRing(point,rings[0])&&!rings.slice(1).some(ring=>inRing(point,ring));
}
export function makeObstacle(rings:Polygon,kind:Obstacle['kind']):Obstacle {
  const points=rings[0]||[];
  return {rings,kind,bounds:[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))]};
}
export function nearestOnLine(point:Position,line:number[][]):Position {
  let best:Position=[line[0][0],line[0][1]],bestDistance=Infinity;
  const cosine=Math.cos(point[1]*Math.PI/180);
  for(let i=1;i<line.length;i++){
    const a=line[i-1],b=line[i],dx=(b[0]-a[0])*cosine,dy=b[1]-a[1];
    const t=Math.max(0,Math.min(1,(((point[0]-a[0])*cosine)*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy||1)));
    const candidate:Position=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
    const d=distance(point,candidate);if(d<bestDistance){best=candidate;bestDistance=d;}
  }
  return best;
}
export function blocked(point:Position,obstacles:Obstacle[],bridges:number[][][]=[]) {
  const probes=[point,offset(point,.35,0),offset(point,-.35,0),offset(point,0,.35),offset(point,0,-.35)];
  for(const obstacle of obstacles){
    const [west,south,east,north]=obstacle.bounds;
    if(!probes.some(p=>p[0]>=west&&p[0]<=east&&p[1]>=south&&p[1]<=north&&insidePolygon(p,obstacle.rings)))continue;
    if(obstacle.kind==='water'&&bridges.some(line=>distance(point,nearestOnLine(point,line))<1.5))continue;
    return true;
  }
  return false;
}
export function withinPilot(point:Position) {return distance(point,[6.8,47.51])<=2500;}
