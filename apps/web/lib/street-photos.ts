export type StreetPhoto={id:string;coordinates:[number,number];image:string;hd?:string;thumbnail:string;date:string;license:string;author:string;panorama:boolean;distance:number};
const endpoint='https://api.panoramax.xyz/api';
function https(value:unknown){try{const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export async function nearbyStreetPhotos(lon:number,lat:number,signal:AbortSignal):Promise<StreetPhoto[]>{
 const latitudeRadius=.0014,longitudeRadius=latitudeRadius/Math.cos(lat*Math.PI/180);
 const url=new URL(`${endpoint}/search`);url.searchParams.set('bbox',[lon-longitudeRadius,lat-latitudeRadius,lon+longitudeRadius,lat+latitudeRadius].join(','));url.searchParams.set('limit','40');
 const response=await fetch(url,{signal:AbortSignal.any([signal,AbortSignal.timeout(12000)]),credentials:'omit'});if(!response.ok)throw Error('Le service photo est indisponible.');
 const data=await response.json();if(!Array.isArray(data.features))throw Error('Réponse photo invalide.');
 const photos:StreetPhoto[]=[];
 for(const feature of data.features){
  if(feature.geometry?.type!=='Point'||!Array.isArray(feature.geometry.coordinates))continue;
  const [x,y]=feature.geometry.coordinates;if(!Number.isFinite(x)||!Number.isFinite(y))continue;
  const properties=feature.properties||{},assets=Object.values(feature.assets||{}) as {href?:string;type?:string;roles?:string[]}[];
  const visual=assets.filter(a=>a.type==='image/jpeg'&&a.roles?.includes('visual')).sort((a,b)=>Number(b.roles?.includes('data'))-Number(a.roles?.includes('data')))[0];
  const preview=assets.find(a=>a.type==='image/jpeg'&&a.roles?.includes('thumbnail'));
  const original=assets.find(a=>a.type==='image/jpeg'&&a.roles?.includes('data'));
  const image=https(visual?.href),thumbnail=https(preview?.href)||image;if(!image)continue;
  const distance=Math.hypot((x-lon)*111319.49*Math.cos(lat*Math.PI/180),(y-lat)*111319.49);if(distance>220)continue;
  const providers=feature.providers||properties.providers;
  const producerNames=Array.isArray(providers)?providers.filter(p=>Array.isArray(p?.roles)&&p.roles.includes('producer')&&typeof p.name==='string').map(p=>p.name):[];
  const hostNames=Array.isArray(providers)?providers.filter(p=>Array.isArray(p?.roles)&&p.roles.includes('host')&&typeof p.name==='string').map(p=>p.name):[];
  const author=[...new Set(producerNames.length?producerNames:hostNames)].join(', ')||String(properties['photographer']||properties['producer']||properties['geovisio:producer']||'Contributeur Panoramax');
  photos.push({id:String(feature.id),coordinates:[x,y],image,hd:https(original?.href)||undefined,thumbnail,date:String(properties.datetimetz||properties.datetime||''),license:String(properties.license||'Licence non précisée'),author,panorama:Number(properties['pers:interior_orientation']?.field_of_view)===360||properties['view:projection']==='equirectangular'||properties['proj:type']==='equirectangular'||properties.type==='equirectangular',distance:Math.round(distance)});
 }
 return photos.sort((a,b)=>a.distance-b.distance).slice(0,24);
}
