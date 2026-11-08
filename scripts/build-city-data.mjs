import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
const bounds=[6.7935,47.5055,6.8065,47.5135],size=41,heights=[];
function get(url){return JSON.parse(execFileSync('curl',['-fsS','--retry','2','--max-time','60',url],{maxBuffer:20*1024*1024}).toString());}
const coordinates=[];
for(let y=0;y<size;y++)for(let x=0;x<size;x++)coordinates.push([bounds[0]+x/(size-1)*(bounds[2]-bounds[0]),bounds[1]+y/(size-1)*(bounds[3]-bounds[1])]);
for(let start=0;start<coordinates.length;start+=100){
 const points=coordinates.slice(start,start+100),params=new URLSearchParams({lon:points.map(p=>p[0].toFixed(7)).join('|'),lat:points.map(p=>p[1].toFixed(7)).join('|'),resource:'ign_rge_alti_wld',zonly:'true'});
 const data=get(`https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json?${params}`);
 if(data.elevations?.length!==points.length||data.elevations.some(z=>!Number.isFinite(z)||z<-100||z>2000))throw Error('Invalid terrain response');
 heights.push(...data.elevations.map(z=>Math.round(z*100)/100));console.log(`Terrain ${heights.length}/${coordinates.length}`);
}
const params=new URLSearchParams({SERVICE:'WFS',VERSION:'2.0.0',REQUEST:'GetFeature',TYPENAMES:'BDTOPO_V3:batiment',OUTPUTFORMAT:'application/json',SRSNAME:'EPSG:4326',BBOX:`${bounds[1]},${bounds[0]},${bounds[3]},${bounds[2]},urn:ogc:def:crs:EPSG::4326`,COUNT:'3000'});
const buildings=get(`https://data.geopf.fr/wfs/ows?${params}`);
if(buildings.numberMatched>buildings.features.length||buildings.totalFeatures>buildings.features.length)throw Error('Truncated building dataset');
const datum=Math.floor(Math.min(...heights))-1;
function trim(value){return Array.isArray(value[0])?value.map(trim):value.slice(0,2).map(v=>Number(v.toFixed(7)));}
const features=buildings.features.filter(f=>f.properties.etat_de_l_objet==='En service'&&Number(f.properties.hauteur)>0).map((f,i)=>({type:'Feature',id:i,properties:{render_height:Number(f.properties.hauteur),render_min_height:0,ground:Number(f.properties.altitude_minimale_sol),sourceId:f.properties.cleabs,roof:f.properties.materiaux_de_la_toiture},geometry:{type:f.geometry.type,coordinates:trim(f.geometry.coordinates)}}));
mkdirSync('apps/web/public/city',{recursive:true});
writeFileSync('apps/web/public/city/montbeliard.json',JSON.stringify({version:1,generated:new Date().toISOString(),bounds,size,datum,heights,buildings:{type:'FeatureCollection',features},attribution:'© IGN BD TOPO / RGE ALTI — Licence Ouverte 2.0',terrainResource:'ign_rge_alti_wld'}));
console.log(`Saved ${features.length} buildings; terrain datum ${datum} m`);
