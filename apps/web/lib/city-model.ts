import {Group,Mesh,BufferGeometry,Material,Texture} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {getCityWorld,terrainHeight} from './city-world';

/** Load an offline-generated, local-only OSM2World street asset. */
export async function loadCityModel(){
 const data=getCityWorld();if(!data?.model?.url)return null;
 if(data.model.url!=='/city/osm2world.glb'||Math.abs(data.model.origin.lat-47.51)>.000001||Math.abs(data.model.origin.lon-6.8)>.000001)throw Error('Invalid city model origin');
 const gltf=await new GLTFLoader().loadAsync(data.model.url),group=new Group();gltf.scene.updateMatrixWorld(true);
 const geometries=new Set<BufferGeometry>(),materials=new Set<Material>(),textures=new Set<Texture>();
 gltf.scene.traverse(node=>{
  if(!(node instanceof Mesh))return;
  const geometry=node.geometry.clone();geometry.applyMatrix4(node.matrixWorld);const positions=geometry.getAttribute('position');
  for(let i=0;i<positions.count;i++){
   const x=positions.getX(i),y=positions.getY(i),z=positions.getZ(i);
   const lon=6.8+x/(111319.4908*Math.cos(47.51*Math.PI/180)),lat=47.51-z/111319.4908;
   const ground=terrainHeight(lon,lat)??0;positions.setXYZ(i,x,-z,y+ground+.07);
  }
  geometry.deleteAttribute('tangent');geometry.computeVertexNormals();geometries.add(geometry);geometries.add(node.geometry);
  const mesh=new Mesh(geometry,node.material);mesh.frustumCulled=false;group.add(mesh);
  for(const material of Array.isArray(node.material)?node.material:[node.material]){materials.add(material);for(const value of Object.values(material))if(value instanceof Texture)textures.add(value);}
 });
 return {group,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
