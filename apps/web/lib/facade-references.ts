import data from '../public/city/panoramax-facades.json';

type Edge={a:number[];b:number[]};
export type PhotoProjection={camera:number[];worldToPhotoRotation:number[][];image?:string;calibrationImageSize?:number[]};
export type PhotoFace=Edge&{projection:string;bottom:number;top:number};
export type FacadeProfile={buildingId:string;label:string;kind:'tower'|'slab'|'retail';wallColor:string;observedWalls:Edge[];storefrontWalls?:Edge[];photoFaces:PhotoFace[];manualFront?:Edge&{floors:number;firstWindowBottom:number;storeyHeight:number;bays:{at:number;width:number;kind:'window'|'shutter'|'balcony';openTop?:boolean}[];shops:{at:number;width:number;label:string}[]};notes:string};
export const facadeReferences=data as unknown as {source:{id:string;image:string;imageSize:number[];author:string;license:string;licenseUrl:string;url:string;capturedAt:string};additionalSources:{id:string;image:string;url:string;author:string;license:string}[];projections:Record<string,PhotoProjection>;buildings:FacadeProfile[]};
export function facadeProfile(id:unknown){return facadeReferences.buildings.find(b=>b.buildingId===id);}
const same=(a:number[],b:number[])=>Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7;
export function matchesFacadeEdge(edge:Edge,a:number[],b:number[]){return same(edge.a,a)&&same(edge.b,b)||same(edge.a,b)&&same(edge.b,a);}

/** Registered ENU geometry -> original equirectangular photograph, with V up. */
export function facadePhotoUv(point:number[],projection:PhotoProjection):[number,number]{
 const p=point.map((v,i)=>v-projection.camera[i]);
 const [x,y,z]=projection.worldToPhotoRotation.map(row=>row.reduce((sum,v,i)=>sum+v*p[i],0));
 return [.5+Math.atan2(x,y)/(2*Math.PI),.5+Math.atan2(z,Math.hypot(x,y))/Math.PI];
}
