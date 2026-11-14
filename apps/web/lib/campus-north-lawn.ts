import {offset,type Position} from './walk-geometry';

/** Lawn visible beside the MULTIMEDIA return in the UFR anniversary aerial.
 * The wall registration is IGN; the 9 m lawn depth is a visual estimate.
 * Existing mapped paths render above this shallow, terrain-draped surface.
 */
const a:Position=[6.804686,47.4957274],b:Position=[6.8043987,47.4956701];
const dx=(b[0]-a[0])*Math.cos(a[1]*Math.PI/180),dy=b[1]-a[1],length=Math.hypot(dx,dy);
const outward=(p:Position,d:number)=>offset(p,dy/length*d,-dx/length*d);
export const CAMPUS_NORTH_LAWN={sourceId:'stgi-history-aerial',lift:.035,
 polygon:[outward(a,.35),outward(b,.35),outward(b,9),outward(a,9)] as Position[],
};
