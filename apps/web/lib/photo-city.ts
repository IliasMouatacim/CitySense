import type {Map} from 'maplibre-gl';

export const PHOTO_SOURCE='citysense-ign-photo';
export const PHOTO_LAYER='citysense-ign-ground';
export const IGN_ATTRIBUTION='© IGN – Géoplateforme';
export const PHOTO_TILES='https://data.geopf.fr/wmts?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&STYLE=normal&FORMAT=image/jpeg&TILEMATRIXSET=PM&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}';

export function setPhotoGround(map:Map,enabled:boolean,night=false){
  if(!map.getSource(PHOTO_SOURCE))map.addSource(PHOTO_SOURCE,{type:'raster',tiles:[PHOTO_TILES],tileSize:256,maxzoom:19,attribution:IGN_ATTRIBUTION});
  if(!map.getLayer(PHOTO_LAYER)){
    const building=map.getStyle().layers.find(l=>l.type==='fill-extrusion')?.id;
    map.addLayer({id:PHOTO_LAYER,type:'raster',source:PHOTO_SOURCE,layout:{visibility:'none'},paint:{'raster-fade-duration':250}},building);
  }
  map.setLayoutProperty(PHOTO_LAYER,'visibility',enabled?'visible':'none');
  map.setPaintProperty(PHOTO_LAYER,'raster-brightness-max',night?.38:1);
  map.setPaintProperty(PHOTO_LAYER,'raster-saturation',-.15);
}

// A bounded on-demand roof image. Coordinates and UVs use the same Mercator
// projection as MapLibre, so photographic roof surfaces stay geographically aligned.
export function roofPhotoRequest(lng:number,lat:number){
  const circumference=40075016.68557849;
  const x=(lng+180)/360,y=(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2;
  const span=1800/circumference,step=span/3;
  const cx=Math.round(x/step)*step,cy=Math.round(y/step)*step;
  const bounds={west:cx-span/2,east:cx+span/2,north:cy-span/2,south:cy+span/2};
  const bbox=[(bounds.west-.5)*circumference,(.5-bounds.south)*circumference,(bounds.east-.5)*circumference,(.5-bounds.north)*circumference].join(',');
  const params=new URLSearchParams({SERVICE:'WMS',VERSION:'1.3.0',REQUEST:'GetMap',LAYERS:'ORTHOIMAGERY.ORTHOPHOTOS',STYLES:'',CRS:'EPSG:3857',BBOX:bbox,WIDTH:'2048',HEIGHT:'2048',FORMAT:'image/jpeg'});
  return {bounds,key:`${cx}:${cy}`,url:`https://data.geopf.fr/wms-r?${params}`};
}
