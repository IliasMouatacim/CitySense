import type {Map, StyleSpecification, ExpressionSpecification} from 'maplibre-gl';
export type SceneMood = 'day' | 'golden' | 'night';
export const CITY_VIEWS = [
  {id:'centre', name:'Centre historique', center:[6.7982,47.5102] as [number,number], zoom:16.85, pitch:62, bearing:-26},
  {id:'chateau', name:'Le Château', center:[6.8005,47.50925] as [number,number], zoom:17.05, pitch:67, bearing:28},
  {id:'parc', name:'Près-la-Rose', center:[6.8033,47.5061] as [number,number], zoom:16.25, pitch:60, bearing:-40},
  {id:'panoramax', name:'Façades Panoramax', center:[6.7978465,47.511485] as [number,number], zoom:17.2, pitch:62, bearing:20},
  {id:'campus', name:'Campus universitaire', center:[6.80355,47.49518] as [number,number], zoom:16.85, pitch:60, bearing:15},
];
const originals = new WeakMap<Map, StyleSpecification>();
export const buildingHeight:ExpressionSpecification = ['case', ['>', ['to-number',['get','render_height'],0],0], ['to-number',['get','render_height'],8], 8];

export function styleCity(map:Map, mood:SceneMood, scale=1, dimensional=true) {
  if (!originals.has(map)) originals.set(map, map.getStyle());
  const original=originals.get(map)!;
  const night=mood==='night', gold=mood==='golden';
  const water=night?'#214b5e':gold?'#80b6b6':'#80bdcb';
  const green=night?'#213e3b':gold?'#c9d6b3':'#b9d2b6';
  map.setSky({
    'sky-color':night?'#071728':gold?'#eecda6':'#bfdfeb',
    'horizon-color':night?'#34546b':gold?'#fff1d9':'#eff7f3',
    'fog-color':night?'#1c3447':gold?'#f3e5cd':'#e4f0ec',
    'sky-horizon-blend':0.7,'horizon-fog-blend':0.65,'fog-ground-blend':0.4
  });
  map.setLight({anchor:'map',color:night?'#bdd9ff':gold?'#fff0cf':'#fffdf5',intensity:night?0.36:0.48,position:night?[1.5,330,40]:gold?[1.5,230,65]:[1.5,200,35]});
  for (const layer of original.layers) {
    if (!map.getLayer(layer.id)) continue;
    const paint=layer.paint || {};
    if (layer.type==='background') map.setPaintProperty(layer.id,'background-color',night?'#142c34':gold?'#f4efe4':'#edf1e8');
    if (layer.type==='fill') {
      const natural=/park|wood|grass|forest|landcover/.test(layer.id);
      const color=/water/.test(layer.id)?water:natural?green:night?(layer.id.includes('building')?'#3b555c':'#1c353c'):paint['fill-color' as keyof typeof paint];
      if(layer.id.includes('building'))map.setLayerZoomRange(layer.id,layer.minzoom||13,dimensional?(layer.maxzoom||24):24);
      map.setPaintProperty(layer.id,'fill-color',color);
      if ('fill-outline-color' in paint) map.setPaintProperty(layer.id,'fill-outline-color',night?'#304a50':paint['fill-outline-color' as keyof typeof paint]);
    }
    if (layer.type==='line') map.setPaintProperty(layer.id,'line-color',night?(/casing|outline/.test(layer.id)?'#182e37':'#4b646a'):paint['line-color' as keyof typeof paint]);
    if (layer.type==='symbol') {
      if(layer.id.startsWith('poi_')){
        map.setLayoutProperty(layer.id,'text-field',['coalesce',['get','name:fr'],['get','name'],['get','name:latin']]);
        map.setLayoutProperty(layer.id,'text-size',['interpolate',['linear'],['zoom'],15,11,18,14]);
        map.setPaintProperty(layer.id,'text-halo-width',1.6);
      }
      const focusZoom=layer.id.startsWith('poi_')?15.5:layer.id.includes('shield')?18:layer.id==='highway-name-minor'?16:0;
      map.setLayerZoomRange(layer.id,dimensional?Math.max(layer.minzoom||0,focusZoom):(layer.minzoom||0),layer.maxzoom||24);
      map.setPaintProperty(layer.id,'text-color',night?'#d8e8df':paint['text-color' as keyof typeof paint]);
      map.setPaintProperty(layer.id,'text-halo-color',night?'#152b34':paint['text-halo-color' as keyof typeof paint]);
    }
    if (layer.type==='fill-extrusion') {
      map.setLayoutProperty(layer.id,'visibility',dimensional?'visible':'none');
      map.setPaintProperty(layer.id,'fill-extrusion-opacity',1);
      map.setPaintProperty(layer.id,'fill-extrusion-vertical-gradient',true);
      map.setPaintProperty(layer.id,'fill-extrusion-height',['*',buildingHeight,scale]);
      map.setPaintProperty(layer.id,'fill-extrusion-base',['*',['to-number',['get','render_min_height'],0],scale]);
      const palette:ExpressionSpecification=['step',['%', ['to-number',['id'],0],17],'#e1c5a4',2,'#e8d9b8',4,'#c9b4a8',6,'#d6b6a1',8,'#d1d2bb',10,'#d7bc83',12,'#bdd0c6',14,'#d5c8bb'];
      map.setPaintProperty(layer.id,'fill-extrusion-color',night
        ? ['interpolate',['linear'],buildingHeight,0,'#384b55',12,'#52636b',35,'#78888c',70,'#9aafb4']
        : ['to-color',['get','colour'],palette]);
    }
  }
}
