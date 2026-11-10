import manifest from '../public/city/campus-facades.json';
import {matchesFacadeEdge} from './facade-references';
export type CampusFace={a:number[];b:number[];kind:'ribbon'|'frame'|'libraryGlass'|'libraryStone'|'timber'|'concrete';floors?:number;label?:string;accent?:boolean;layout?:'stgi-west'|'stgi-court'|'stgi-colour'|'stgi-ribbon';accentBay?:number[];solidBays?:number[][];stairBay?:number[];glazingBands?:number[][];openings?:{at:number;width:number;bottom:number;top:number;accent?:string}[];entrances?:{at:number;width:number;sourceNode:number}[]};
export type CampusProfile={buildingId:string;label:string;wallColor:string;sourceIds:string[];faces:CampusFace[];notes:string};
export const campusReferences=manifest as unknown as {version:number;reviewedAt:string;method:string;sourceImagesRedistributed:boolean;sources:{id:string;institution:string;url:string;published:string;captureDate:string|null;author?:string;license?:string}[];buildings:CampusProfile[]};
export const campusProfile=(id:unknown)=>campusReferences.buildings.find(b=>b.buildingId===id);
export function campusFace(profile:CampusProfile,a:number[],b:number[]){return profile.faces.find(face=>matchesFacadeEdge(face,a,b));}
