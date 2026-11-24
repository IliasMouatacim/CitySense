import type {CityWorld} from './city-world';

type Building=CityWorld['buildings']['features'][number];
const libraryId='BATIMENT0000000223563364';
const stgiBridgeId='BATIMENT0000000223563367';
const stgiSouthWingId='BATIMENT0000000223563366';

/** Split the measured envelope vertically. The photos show two occupied ends
 * and a through passage on piers. The clear height and pier spacing are estimates. */
export function openLibraryPassage(feature:Building):Building[]{
 if(feature.properties.sourceId===stgiSouthWingId){
  // Both photographed wings flanking the STGI bridge share the same 3-storey parapet height (10.2 m).
  const ground=Number(feature.properties.render_min_height);
  return [{...feature,properties:{...feature.properties,render_height:ground+10.2}}];
 }
 if(feature.properties.sourceId===stgiBridgeId){
  // The connector between STGI wings A-south and A-north is an elevated 2-storey
  // glazed bridge over a walkthrough breezeway (OSM 155113769, layer=1).
  const ground=Number(feature.properties.render_min_height),soffit=ground+2.95,top=ground+9.45;
  const ring=feature.geometry.type==='Polygon'?feature.geometry.coordinates[0]:feature.geometry.coordinates[0][0];
  const parts:Building[]=[{...feature,properties:{...feature.properties,walkUnder:true,render_min_height:soffit,render_height:top}}];
  if(ring&&ring.length>=4){
   const mix=(a:number[],b:number[],t:number)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
   const south=(t:number)=>mix(ring[0],ring[1],t),north=(t:number)=>mix(ring[3],ring[2],t);
   const corner=(t:number,d:number)=>mix(south(t),north(t),d);
   for(const [idx,at] of [.68,.88].entries()){
    const points=[corner(at-.025,.02),corner(at+.025,.02),corner(at+.025,.14),corner(at-.025,.14)];
    parts.push({type:'Feature',id:feature.id*100+idx+1,geometry:{type:'Polygon',coordinates:[[...points,points[0]]]},
     properties:{...feature.properties,sourceId:stgiBridgeId+'-pier-'+idx,colour:'#6e2426',campusName:null,campusUse:null,
      render_min_height:ground,render_height:soffit}});
   }
  }
  return parts;
 }
 if(feature.properties.sourceId!==libraryId||feature.geometry.type!=='MultiPolygon')return [feature];
 const ring=feature.geometry.coordinates[0][0];
 if(ring.length!==13)return [feature];
 const mix=(a:number[],b:number[],t:number)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const front=(t:number)=>mix(ring[0],ring[11],t);
 const rear=(t:number)=>mix(ring[1],ring[2],t);
 const ground=Number(feature.properties.render_min_height),soffit=ground+3.35;
 const parts:Building[]=[{...feature,properties:{...feature.properties,walkUnder:true,render_min_height:soffit}}];
 function part(name:string,points:number[][]){
  const id=feature.id*100+parts.length;
  parts.push({type:'Feature',id,geometry:{type:'Polygon',coordinates:[[...points,points[0]]]},
   properties:{...feature.properties,sourceId:libraryId+'-'+name,libraryPart:name,campusName:null,campusUse:null,
    render_min_height:ground,render_height:soffit}});
 }
 const corner=(t:number,d:number)=>mix(front(t),rear(t),d);
 part('west',[corner(.027,.06),corner(.12,.06),corner(.12,.88),corner(.027,.88)]);
 part('lobby',[front(.78),front(1),...ring.slice(3,11).reverse(),rear(1),rear(.78)]);
 // Continue the projecting bay's central support down past the soffit.
 part('bay-support',[corner(.736,-.092),corner(.744,-.092),corner(.744,-.048),corner(.736,-.048)]);
 for(const at of [.36,.66]){
  for(const depth of [.10,.88]){
   part('pier-'+at+'-'+depth,[corner(at-.006,depth-.055),corner(at+.006,depth-.055),
    corner(at+.006,depth+.055),corner(at-.006,depth+.055)]);
  }
 }
 return parts;
}
