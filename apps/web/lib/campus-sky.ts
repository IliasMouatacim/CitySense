import {SphereGeometry} from 'three';

/** A Z-up sky cap, excluding the generic HDR's photographed ground/treeline. */
export function campusSkyGeometry(){
 const geometry=new SphereGeometry(700,48,20,0,Math.PI*2,0,Math.PI/2);
 geometry.rotateX(Math.PI/2);
 // A partial SphereGeometry still spans 0..1 vertically. Map its pole to the
 // HDR zenith and its rim above the image horizon, rather than stretching land.
 const uv=geometry.getAttribute('uv');
 for(let i=0;i<uv.count;i++)uv.setY(i,.56+uv.getY(i)*.44);
 return geometry;
}
