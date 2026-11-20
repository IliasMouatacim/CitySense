import manifest from '../public/city/campus-facades.json';
import {matchesFacadeEdge} from './facade-references';
export type CampusFace={a:number[];b:number[];kind:'ribbon'|'frame'|'libraryGlass'|'libraryStone'|'timber'|'concrete';floors?:number;painted?:boolean;courtyardFeature?:'stgi-entry'|'mp-entry'|'library-bay';label?:string;accent?:boolean;layout?:'amphi-front'|'garden-b'|'garden-b-return'|'garden-c'|'garden-c-connector'|'stgi-north-openings'|'stgi-return'|'stgi-west'|'stgi-court'|'stgi-colour'|'stgi-ribbon'|'crous-mosaic'|'crous-front'|'crous-corner'|'crous-glass'|'crous-east';accentBay?:number[];solidBays?:number[][];stairBay?:number[];glazingBands?:number[][];openings?:{at:number;width:number;bottom:number;top:number;accent?:string}[];entrances?:{at:number;width:number;sourceNode:number}[]};
export type CampusProfile={buildingId:string;label:string;wallColor:string;sourceIds:string[];faces:CampusFace[];notes:string};
export const campusReferences=manifest as unknown as {version:number;reviewedAt:string;method:string;sourceImagesRedistributed:boolean;sources:{id:string;institution:string;url:string;published:string;captureDate:string|null;author?:string;license?:string}[];buildings:CampusProfile[]};
export const campusProfile=(id:unknown)=>campusReferences.buildings.find(b=>b.buildingId===id);
export function campusFace(profile:CampusProfile,a:number[],b:number[]){return profile.faces.find(face=>matchesFacadeEdge(face,a,b));}

// Apply the user's Bâtiment C reference to the garden-facing wall selected in
// the walkthrough. Keep this customization separate from surveyed faces.
const gardenConnector:CampusFace={
 a:[6.8046698,47.4954062],b:[6.8045233,47.495384],kind:'ribbon',layout:'garden-c-connector',
};
export function gardenConnectorFace(id:unknown,a:number[],b:number[]){
 return id==='BATIMENT0000000223563707'&&matchesFacadeEdge(gardenConnector,a,b)?gardenConnector:undefined;
}
