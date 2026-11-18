import type {CampusData} from './city-world';
import type {Position} from './walk-geometry';

/** Local +x runs along the platform, local -y faces the boarding road. */
export function shelterAngle(position: Position, roads: CampusData['roads']): number {
 const east = 111319.49 * Math.cos(position[1]*Math.PI/180);
 let best = 35, angle = 0;
 for (const road of roads) {
  if (!['service','residential','unclassified','tertiary','secondary','primary','busway','living_street'].includes(road.tags.highway)) continue;
  if (road.tags.tunnel === 'yes' || road.tags.service === 'parking_aisle') continue;
  for (let i=1; i<road.coordinates.length; i++) {
   const a=road.coordinates[i-1], b=road.coordinates[i];
   const x=(a[0]-position[0])*east, y=(a[1]-position[1])*111319.49;
   const dx=(b[0]-a[0])*east, dy=(b[1]-a[1])*111319.49;
   const squared=dx*dx+dy*dy;
   if (squared<.01) continue;
   const t=Math.max(0,Math.min(1,-(x*dx+y*dy)/squared));
   const distance=Math.hypot(x+t*dx,y+t*dy);
   if (distance>=best) continue;
   best=distance;
   angle=Math.atan2(dy,dx)+(dy*x-dx*y<0?Math.PI:0);
  }
 }
 return angle;
}

export function shelterOffset(angle:number, x:number, y:number): Position {
 return [Math.cos(angle)*x-Math.sin(angle)*y, Math.sin(angle)*x+Math.cos(angle)*y];
}
