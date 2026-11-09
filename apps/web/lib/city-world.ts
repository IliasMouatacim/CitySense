import type {Map,GeoJSONSource} from 'maplibre-gl';
import {facadeProfile} from './facade-references';
import {insidePolygon} from './walk-geometry';
import {campusProfile} from './campus-references';
type Polygon={type:'Polygon';coordinates:number[][][]};
type MultiPolygon={type:'MultiPolygon';coordinates:number[][][][]};
export type StreetWay={id:number;coordinates:[number,number][];tags:Record<string,string>};
export type TerrainTile={bounds:number[];size:number;datum:number;heights:number[]};
export type CampusData={bounds:number[];roads:StreetWay[];objects:{id:number;coordinates:[number,number];tags:Record<string,string>}[];areas:StreetWay[];buildings:StreetWay[];pois:{id:string;coordinates:[number,number];tags:Record<string,string>}[];attribution:string};
export type CityWorld=TerrainTile&{version:number;terrainPatches?:TerrainTile[];campus?:CampusData;buildings:{type:'FeatureCollection';features:{type:'Feature';id:number;properties:Record<string,unknown>;geometry:MultiPolygon|Polygon}[]};attribution:string;terrainResource:string;streets?:{roads:StreetWay[];objects:{id:number;coordinates:[number,number];tags:Record<string,string>}[]};model?:{url:string|null;origin:{lat:number;lon:number}}};
let world:CityWorld|undefined;
let pending:Promise<CityWorld>|undefined;
export const CITY_BUILDINGS='citysense-ign-buildings';
export function getCityWorld(){return world;}
export function terrainHeight(lon:number,lat:number,data=world):number|null{
 if(!data)return null;
 const tile=[data,...data.terrainPatches||[]].find(t=>lon>=t.bounds[0]&&lon<=t.bounds[2]&&lat>=t.bounds[1]&&lat<=t.bounds[3]);
 if(!tile)return null;const [w,s,e,n]=tile.bounds;
 const x=(lon-w)/(e-w)*(tile.size-1),y=(lat-s)/(n-s)*(tile.size-1),ix=Math.min(tile.size-2,Math.floor(x)),iy=Math.min(tile.size-2,Math.floor(y)),fx=x-ix,fy=y-iy;
 const at=(dx:number,dy:number)=>tile.heights[(iy+dy)*tile.size+ix+dx];
 // Match the exact diagonal used by the render mesh and Rapier collider.
 // Bilinear interpolation can put a capsule below a triangular cell surface.
 return (fx+fy<=1?at(0,0)+(at(1,0)-at(0,0))*fx+(at(0,1)-at(0,0))*fy:at(1,1)+(at(0,1)-at(1,1))*(1-fx)+(at(1,0)-at(1,1))*(1-fy))-data.datum;
}
export function loadCityWorld(){
 return pending??=(async()=>{
  const response=await fetch('/city/montbeliard.json');if(!response.ok)throw Error('Données IGN indisponibles.');
  const data=await response.json() as CityWorld;
  const streets=await fetch('/city/osm-streets.json');if(streets.ok)data.streets=await streets.json();
  const model=await fetch('/city/osm2world-manifest.json');if(model.ok)data.model=await model.json();
  const [campusTerrain,campusMap]=await Promise.all([fetch('/city/campus-portes-du-jura.json'),fetch('/city/campus-osm.json')]);
  if(campusTerrain.ok&&campusMap.ok){
   const patch=await campusTerrain.json() as CityWorld,campus=await campusMap.json() as CampusData;
   if(patch.size<2||patch.heights.length!==patch.size*patch.size)throw Error('Terrain du campus invalide.');
   data.terrainPatches=[patch];data.campus=campus;
   data.streets??={roads:[],objects:[]};data.streets.roads.push(...campus.roads);data.streets.objects.push(...campus.objects);
   for(const feature of patch.buildings.features){
    const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;
    // Match footprint interiors rather than a shared boundary corner, which can
    // otherwise attach the neighbouring department's name to an IGN volume.
    const candidates=campus.buildings.filter(b=>b.tags.name&&b.tags['building:part']!=='roof').map(b=>{
     const points=b.coordinates.slice(0,-1),mid=points.reduce((v,p)=>[v[0]+p[0]/points.length,v[1]+p[1]/points.length],[0,0]) as [number,number];
     const score=polygons.reduce((best,p)=>{
      const ring=p[0].slice(0,-1),center=ring.reduce((v,p)=>[v[0]+p[0]/ring.length,v[1]+p[1]/ring.length],[0,0]) as [number,number];
      return Math.max(best,Number(insidePolygon(center,[b.coordinates]))+Number(insidePolygon(mid,p)));
     },0);
     return {b,score};
    }).filter(c=>c.score>0).sort((a,b)=>b.score-a.score);
    const mapped=candidates[0]?.b;
    feature.id+=100000;feature.properties={...feature.properties,region:'campus',...(mapped?{campusName:mapped.tags.name,campusOsmId:mapped.id}:{} )};
   }
   data.buildings.features.push(...patch.buildings.features);
  }
  if(data.size<2||data.heights.length!==data.size*data.size||!data.buildings.features.length)throw Error('Données IGN invalides.');
  for(const feature of data.buildings.features){
   const rings=feature.geometry.type==='Polygon'?feature.geometry.coordinates:feature.geometry.coordinates.flat();
   const p=rings[0][0];const height=Number(feature.properties?.render_height)||8;
   const ground=terrainHeight(p[0],p[1],data)??0;
   const profile=facadeProfile(feature.properties?.sourceId);
   const university=campusProfile(feature.properties?.sourceId);
   feature.properties={...feature.properties,...(feature.properties.region==='campus'?{colour:university?.wallColor||'#c2c6c3'}:{}),...(profile?{colour:profile.wallColor}:{}),render_min_height:ground,render_height:ground+height};
  }
  world=data;return data;
 })().catch(error=>{pending=undefined;throw error;});
}
export async function installCityWorld(map:Map){
 const data=await loadCityWorld();
 if(map.getSource(CITY_BUILDINGS))return;
 map.addSource(CITY_BUILDINGS,{type:'geojson',data:data.buildings,attribution:'© IGN BD TOPO / RGE ALTI'});
 const [w,s,e,n]=data.bounds;
 const area:Polygon={type:'Polygon',coordinates:[[[w,s],[e,s],[e,n],[w,n],[w,s]]]};
 const native=map.getLayer('building-3d');
 // MVT groups can contain footprints both inside and outside the IGN area.
 // Split them per polygon, otherwise whole groups survive a `within` filter
 // and leave duplicate low buildings across the detailed streets.
 if(native){map.setFilter('building-3d',['==',['literal',true],false]);}
 const outside=()=>({type:'FeatureCollection' as const,features:cityBuildingFeatures(map).filter(f=>!f.properties?.sourceId)});
 map.addSource('citysense-outside-buildings',{type:'geojson',data:outside()});
 const layers=map.getStyle().layers,last=layers.findLastIndex(l=>l.type==='fill-extrusion');
 map.addLayer({id:'citysense-ign-solid',type:'fill-extrusion',source:CITY_BUILDINGS,paint:{'fill-extrusion-height':['get','render_height'],'fill-extrusion-base':['get','render_min_height'],'fill-extrusion-color':'#cfc1aa','fill-extrusion-opacity':1}},layers.slice(last+1).find(l=>l.type==='symbol')?.id);
 map.addLayer({id:'citysense-outside-solid',type:'fill-extrusion',source:'citysense-outside-buildings',paint:{'fill-extrusion-height':['get','render_height'],'fill-extrusion-base':['get','render_min_height'],'fill-extrusion-color':'#cfc1aa','fill-extrusion-opacity':1}},'citysense-ign-solid');
 let timer:ReturnType<typeof setTimeout>|undefined,disposed=false;
 const refresh=(event:{sourceId?:string;isSourceLoaded?:boolean})=>{if(event.sourceId!=='openmaptiles'||!event.isSourceLoaded||timer||disposed)return;timer=setTimeout(()=>{timer=undefined;if(!disposed)(map.getSource('citysense-outside-buildings') as GeoJSONSource)?.setData(outside());},300);};
 map.on('sourcedata',refresh);map.once('remove',()=>{disposed=true;if(timer)clearTimeout(timer);map.off('sourcedata',refresh);});
}
export function cityBuildingFeatures(map:Map){
 const data=world;
 const native=map.querySourceFeatures('openmaptiles',{sourceLayer:'building'});
 if(!data)return native;
 const outside=native.flatMap(f=>{
  const g=f.geometry,polygons:number[][][][]=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
  return polygons.filter(p=>p[0]?.every(point=>terrainHeight(point[0],point[1],data)===null)).map(p=>({type:'Feature' as const,id:f.id,properties:f.properties||{},geometry:{type:'Polygon' as const,coordinates:p}}));
 });
 return [...data.buildings.features,...outside];
}
