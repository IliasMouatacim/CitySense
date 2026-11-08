// Only names present in the vector tiles become signs. No fabricated businesses.
export type CityPoi = {id:string;name:string;category:string;color:string;coordinates:[number,number];distance:number};
type Feature = {id?:string|number;properties?:Record<string,unknown>|null;geometry:{type:string;coordinates:unknown}};

const categories:Record<string,[string,string]> = {
  bakery:['Boulangerie','#9d5338'], cafe:['Café','#815744'], restaurant:['Restaurant','#8c453b'],
  fast_food:['Restauration','#a55932'], bar:['Bar','#684b68'], pub:['Bar','#684b68'],
  pharmacy:['Pharmacie','#246651'], supermarket:['Supermarché','#356857'], convenience:['Épicerie','#54734c'],
  clothes:['Vêtements','#655275'], shoes:['Chaussures','#655275'], hairdresser:['Coiffeur','#755e74'],
  beauty:['Beauté','#755e74'], florist:['Fleuriste','#597348'], books:['Librairie','#3c6678'],
  bank:['Banque','#3c6678'], hotel:['Hôtel','#496d79'], museum:['Musée','#8a6040'],
  theatre:['Théâtre','#8a6040'], cinema:['Cinéma','#8a6040'], shop:['Commerce','#496d79'],
  town_hall:['Mairie','#496d79'], library:['Bibliothèque','#496d79'], school:['École','#496d79'],
  place_of_worship:['Lieu de culte','#8a6040'], hospital:['Santé','#246651'], doctor:['Santé','#246651'],
};
export function metersBetween(a:number[],b:number[]) {
  return Math.hypot((b[0]-a[0])*111319.4908*Math.cos(a[1]*Math.PI/180),(b[1]-a[1])*111319.4908);
}
export function readCityPois(features:Feature[],center:[number,number],radius=450):CityPoi[] {
  const unique=new Map<string,CityPoi>();
  for(const feature of features){
    if(feature.geometry.type!=='Point')continue;
    const coordinates=feature.geometry.coordinates as [number,number],p=feature.properties||{};
    if(!coordinates.every(Number.isFinite))continue;
    const name=String(p['name:fr']||p.name||p['name:latin']||'').trim().slice(0,120);
    if(!name)continue;
    const kind=String(p.subclass||p.class||''),group=String(p.class||'');
    const info=categories[kind]||categories[group];
    if(!info)continue;
    const distance=metersBetween(center,coordinates);if(distance>radius)continue;
    const id=String(feature.id??`${name}:${coordinates.map(n=>n.toFixed(5)).join(',')}`);
    if(!unique.has(id))unique.set(id,{id,name,category:info[0],color:info[1],coordinates,distance:Math.round(distance)});
  }
  return [...unique.values()].sort((a,b)=>a.distance-b.distance||a.name.localeCompare(b.name,'fr')).slice(0,80);
}
export function mappedHeight(properties:Record<string,unknown>) {
  const height=Number(properties.render_height),base=Number(properties.render_min_height);
  return {height:Number.isFinite(height)&&height>0?height:8,base:Number.isFinite(base)&&base>0?base:0};
}
export function nearbyFootprints(features:Feature[],center:[number,number],radius:number) {
  const seen=new Set<string>();
  return features.filter(feature=>!feature.properties?.hide_3d).flatMap(feature=>{
    const g=feature.geometry;
    const polygons=(g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[]) as number[][][][];
    return polygons.map(polygon=>{
      const ring=polygon[0];
      const midpoint=ring?.length?ring.reduce((s,p)=>[s[0]+p[0]/ring.length,s[1]+p[1]/ring.length],[0,0]):[0,0];
      return {feature,polygon,distance:metersBetween(center,midpoint),signature:JSON.stringify(polygon)};
    });
  }).filter(f=>{
    if(f.distance>=radius||seen.has(f.signature))return false;
    seen.add(f.signature);return true;
  }).sort((a,b)=>a.distance-b.distance);
}
// Tile rings can have either winding. Keep lettering readable from the exterior.
export function outwardUv(uv:number[][],dx:number,dy:number,normal:number[]) {
  return dy*normal[0]-dx*normal[1]<0?[uv[1],uv[0],uv[3],uv[2]]:uv;
}
export function stableVariant(id:string|number|undefined,ring:number[][]) {
  let hash=2166136261;const key=id===undefined?ring.map(p=>p.map(n=>n.toFixed(6)).join(',')).join(';'):String(id);
  for(let i=0;i<key.length;i++){hash^=key.charCodeAt(i);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}
