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

// The restaurant-side platform is the long two-bay shelter in the street photos.
export const CROUS_PLATFORM=4876779236;
type ShelterPart=(x:number,y:number,z:number,w:number,d:number,h:number,material:'frame'|'glass'|'wood'|'poster'|'paper',solid?:boolean)=>void;
export function drawCrousShelter(part:ShelterPart){
 part(0,0,2.32,7.25,1.55,.13,'frame');
 for(const x of [-3.5,0,3.5]){
  part(x,.60,0,.10,.10,2.34,'frame',true);
  part(x,-.61,0,.10,.10,2.34,'frame',true);
 }
 for(const x of [-1.75,1.75]){
  part(x,.59,.28,3.38,.035,1.96,'glass',true);
  part(x,.58,.23,3.40,.08,.07,'frame');
  part(x,.12,.44,2.60,.39,.09,'wood',true);
  for(const side of [-1,1])part(x+side*.94,.12,.03,.09,.31,.42,'frame',true);
 }
 // Poster cabinets and the route timetable are on the rear and end panels.
 for(const x of [-.57,3.00]){
  part(x,.49,.29,.83,.085,1.77,'frame',true);
  part(x,.437,.35,.75,.016,1.64,'poster');
  part(x,.422,1.69,.50,.012,.09,'paper');
  part(x+.08,.422,.55,.28,.012,.35,'paper');
 }
 part(-3.50,0,.28,.09,1.16,1.96,'frame',true);
 part(-3.556,0,.34,.012,1.05,1.82,'poster');
 part(.48,.51,.83,.54,.025,.88,'paper');
 part(3.22,.17,.03,.31,.32,.70,'frame',true);
 part(0,-.15,2.30,3.4,.07,.025,'paper');
 part(-2.75,.44,1.92,.90,.09,.26,'frame');
 part(-1.75,-.58,2.19,1.16,.08,.14,'frame');
}
