import {offset,type Position} from './walk-geometry';

const BOOM=3.65;
export type PlayerPose={coordinates:Position;ground:number;facing:number;meters:number;stride:number;camera:Position;eye:number;arm:number};
type Sweep=(position:Position,height:number,east:number,north:number,up:number,length:number)=>number;

/** Orbit the avatar's upper torso. Obstructions shorten the boom immediately;
 * extra room opens up progressively, so clearing a corner doesn't snap the view. */
export function followCamera(position:Position,ground:number,bearing:number,lookPitch:number,previousArm:number,seconds:number,sweep?:Sweep){
 const heading=bearing*Math.PI/180;
 const elevation=Math.max(-14,Math.min(52,103-lookPitch))*Math.PI/180;
 const horizontal=Math.cos(elevation),up=Math.sin(elevation);
 const east=-Math.sin(heading)*horizontal,north=-Math.cos(heading)*horizontal;
 const pivot=ground+1.00;
 const allowed=Math.min(BOOM,Math.max(0,sweep?.(position,pivot,east,north,up,BOOM)??BOOM));
 const arm=allowed<previousArm?allowed:allowed-(allowed-previousArm)*Math.exp(-9*seconds);
 const camera=offset(position,east*arm,north*arm);
 const eye=pivot+arm*up;
 return {camera,eye,arm,settling:allowed-arm>.015,target:offset(camera,-30*east,-30*north),targetElevation:eye-30*up};
}
