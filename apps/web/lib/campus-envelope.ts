import type {CampusDrawing} from './campus-architecture';
import {drawLibraryMasonryJoints} from './campus-architecture';
import type {CampusFace,CampusProfile} from './campus-references';
import {campusProfile} from './campus-references';

// IGN splits the photographed wings into strips, taller cores and connectors.
// These associations follow the campus plan/contiguous footprints. Their window
// layouts are inferred from the neighbouring wing, never counted as photo faces.
const wingCores:Record<string,string>={
 BATIMENT0000000223563541:'BATIMENT0000000223563543',
 BATIMENT0000000223563540:'BATIMENT0000000223563543',
 BATIMENT0000000223563539:'BATIMENT0000000223563537',
 BATIMENT0000000223563542:'BATIMENT0000000223563537',
 BATIMENT0000000223563367:'BATIMENT0000000223563368',
 BATIMENT0000000223563365:'BATIMENT0000000223563366',
 BATIMENT0000000223563704:'BATIMENT0000000223563705',
};
// The north return/core volumes beside the STGI gallery share its concrete
// envelope. The plan establishes association, not the openings on these sides.
const solidWingCores:Record<string,string>={
 BATIMENT0000000223563708:'BATIMENT0000000223563705',
};
export const campusCompletionProfile=(id:unknown)=>{
 if(typeof id!=='string')return;
 const solid=campusProfile(solidWingCores[id]);
 // An empty face list permits construction finishing without classroom windows.
 return solid?{...solid,faces:[]}:campusProfile(wingCores[id]);
};

/** Estimated construction details, separate from the photo-observed openings.
 * No entrances, signage or equipment are invented on undocumented walls.
 * All relief stays inside the walking capsule's 30 cm clearance.
 */
export function drawCampusEnvelope(length:number,height:number,draw:CampusDrawing,close:boolean,library=false,roofEdge=true,drainage=true){
 if(length<.5||height<.8)return;
 const {panel,box}=draw;
 if(roofEdge)box(length/2,length,height-.12,height+.06,'#637268',.16,.028);
 box(length/2,length,.035,.26,'#929a90',.07,.028);
 panel(length/2,length,height-.20,height-.14,'#767e77',.038);
 const columns=Math.min(40,Math.max(1,Math.ceil(length/2.8))),pitch=length/columns;
 // Cast-concrete shuttering joints and slightly lighter lower joint lips.
 for(let column=1;column<columns;column++){
  panel(column*pitch,.018,.28,height-.22,'#939990',.036);
  if(close)panel(column*pitch+.012,.008,.28,height-.22,'#c2c6ba',.038);
 }
 const rows=Math.min(30,Math.max(1,Math.ceil((height-.5)/1.35))),step=(height-.5)/rows;
 for(let row=1;row<rows;row++){
  const z=.28+row*step;
  panel(length/2,length,z,z+.014,'#939990',.036);
  if(close)panel(length/2,length,z+.014,z+.024,'#c2c6ba',.038);
 }
 if(library){
  // Continue the library's characteristic brick courses round its solid returns.
  for(let z=1;z<height-.3;z+=1.5){
   panel(length/2,length,z,Math.min(z+.24,height-.22),'#947a70',.043);
   if(close)drawLibraryMasonryJoints(length,z,Math.min(z+.24,height-.22),draw,.046);
  }
 }
 if(!close)return;
 // Formwork tie holes, inset visually using a light rim and dark centre.
 for(let column=0;column<columns;column++)for(let row=0;row<rows;row++){
  const at=(column+.5)*pitch,z=.28+(row+.5)*step;
  panel(at,.035,z,z+.035,'#aeb2a7',.039);
  panel(at,.018,z+.008,z+.026,'#747d75',.041);
 }
 // One modest rainwater pipe at a wall end, never a repeated mid-wall prop.
 if(drainage&&length>7&&height>3){
  const at=length-.32;
  box(at,.085,.28,height-.14,'#7e8a83',.18,.085);
  box(at,.13,.28,.65,'#64716b',.20,.07);
  for(let z=.8;z<height-.25;z+=1.8)box(at,.13,z,z+.045,'#a4ada4',.205,.07);
  box(at,.18,height-.38,height-.16,'#7e8a83',.18,.04);
 }
}

/** A continuation of a known classroom wing, explicitly NOT a new observation.
 * Small returns, library walls and UTBM's undocumented rear remain solid.
 */
export function estimatedCampusFace(profile:CampusProfile|undefined,use:unknown,length:number,height:number):CampusFace|undefined{
 if(length<8||height<5)return;
 if(profile&&!profile.faces.some(f=>f.kind==='ribbon'||f.kind==='frame'))return;
 if(!profile&&!['university','college'].includes(String(use)))return;
 const template=profile?.faces.find(f=>f.kind==='ribbon');
 return {a:[],b:[],kind:'ribbon',floors:template?.floors||Math.max(1,Math.min(5,Math.round(height/3.5))),
  ...(template?.glazingBands?{glazingBands:template.glazingBands}:{})};
}
