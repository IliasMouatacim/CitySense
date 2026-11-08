import {Group,Mesh,BufferGeometry,Material,Texture} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MercatorCoordinate} from 'maplibre-gl';
import {getCityWorld,terrainHeight} from './city-world';

/** Load an offline-generated, local-only OSM2World street asset. */
export async function loadCityModel(){
 const data=getCityWorld();if(!data?.model?.url)return null;
 if(data.model.url!=='/city/osm2world.glb'||Math.abs(data.model.origin.lat-47.51)>.000001||Math.abs(data.model.origin.lon-6.8)>.000001)throw Error('Invalid city model origin');
 const gltf=await new GLTFLoader().loadAsync(data.model.url),group=new Group();gltf.scene.updateMatrixWorld(true);
 const origin=MercatorCoordinate.fromLngLat([6.8,47.51]),unit=origin.meterInMercatorCoordinateUnits();
 const geometries=new Set<BufferGeometry>(),materials=new Set<Material>(),textures=new Set<Texture>();
 const batches=new Map<string,{geometries:BufferGeometry[];material:Material}>();
 gltf.scene.traverse(node=>{
  if(!(node instanceof Mesh))return;
  const geometry:BufferGeometry=node.geometry.clone();geometry.applyMatrix4(node.matrixWorld);const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++){
   const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
   const lon=(origin.x+x*unit)*360-180,lat=Math.atan(Math.sinh(Math.PI*(1-2*(origin.y+z*unit))))*180/Math.PI;
   const ground=terrainHeight(lon,lat)??0;positions.setXYZ(i,x,-z,y+ground+.07);
  }
  geometry.deleteAttribute('tangent');geometry.computeVertexNormals();geometries.add(geometry);
  if(Array.isArray(node.material)){const mesh=new Mesh(geometry,node.material);mesh.frustumCulled=false;group.add(mesh);}
  else{
   const signature=Object.keys(geometry.attributes).map(name=>{const attribute=geometry.getAttribute(name);return `${name}:${attribute.itemSize}:${attribute.normalized}:${attribute.array.constructor.name}`;}).sort().join(',');
   const key=`${node.material.uuid}:${Boolean(geometry.index)}:${signature}`;
   const batch:{geometries:BufferGeometry[];material:Material}=batches.get(key)||{geometries:[],material:node.material};batch.geometries.push(geometry);batches.set(key,batch);
  }
  for(const material of Array.isArray(node.material)?node.material:[node.material]){materials.add(material);for(const value of Object.values(material))if(value instanceof Texture){value.anisotropy=4;textures.add(value);}}
 });
 for(const batch of batches.values()){
  const geometry=batch.geometries.length===1?batch.geometries[0]:mergeGeometries(batch.geometries);
  if(!geometry)throw Error('Incompatible generated mesh attributes');
  if(batch.geometries.length>1){for(const old of batch.geometries){old.dispose();geometries.delete(old);}geometries.add(geometry);}
  const mesh=new Mesh(geometry,batch.material);mesh.frustumCulled=false;group.add(mesh);
 }
 return {group,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
