import {BoxGeometry,Color,Float32BufferAttribute,Group,Mesh,MeshLambertMaterial,SphereGeometry,type BufferGeometry} from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// Z is up in the campus scene and the front of the jacket faces +Y.
export function campusDirector(){
 const parts:BufferGeometry[]=[];
 function part(shape:BufferGeometry,color:string,x:number,y:number,z:number){
  shape.translate(x,y,z);
  const tint=new Color(color),colors:number[]=[];
  for(let i=0;i<shape.attributes.position.count;i++)colors.push(tint.r,tint.g,tint.b);
  shape.setAttribute('color',new Float32BufferAttribute(colors,3));parts.push(shape);
 }
 function box(w:number,d:number,h:number,color:string,x:number,y:number,z:number){
  part(new BoxGeometry(w,d,h),color,x,y,z);
 }
 const root=new Group(),material=new MeshLambertMaterial({vertexColors:true});
 const meshes:Mesh[]=[];
 function assemble(){
  const mesh=new Mesh(mergeGeometries(parts)!,material);
  for(const shape of parts.splice(0))shape.dispose();
  meshes.push(mesh);root.add(mesh);return mesh;
 }
 const legs=[-1,1].map(side=>{
  box(.15,.19,.75,'#424954',0,0,-.35);
  box(.16,.27,.095,'#282b2f',0,.035,-.74);
  const leg=assemble();leg.position.set(side*.105,0,.80);return leg;
 });
 const navy='#304459',skin='#b47d5e';
 for(const side of [-1,1]){
  box(.105,.16,.47,navy,side*.244,0,1.12);
  part(new SphereGeometry(.064,8,6),skin,side*.244,0,.875);
 }
 box(.39,.23,.60,navy,0,0,1.1);
 box(.10,.015,.22,'#eee6d6',0,.119,1.28);
 box(.03,.017,.15,'#923d43',0,.131,1.27);
 box(.072,.012,.047,'#f3ead7',-.12,.12,1.23);
 part(new SphereGeometry(.144,12,10).scale(.86,.88,1.15),skin,0,0,1.55);
 part(new SphereGeometry(.14,12,8).scale(.88,.9,.68),'#524843',0,-.012,1.65);
 for(const side of [-1,1]){
  box(.058,.01,.011,'#443630',side*.049,.114,1.588);
  box(.018,.011,.015,'#302a27',side*.047,.122,1.565);
 }
 box(.029,.028,.039,skin,0,.128,1.538);
 box(.043,.008,.007,'#8c594c',0,.116,1.498);
 assemble();root.name='Directeur du campus';
 let stride=0,lastX:number|undefined,lastY=0;
 return {root,place(x:number,y:number,z:number,heading:number){
  const step=lastX===undefined?0:Math.hypot(x-lastX,y-lastY);
  stride=step>3?0:stride+step*4.8;
  legs[0].rotation.x=.32*Math.sin(stride);legs[1].rotation.x=-legs[0].rotation.x;
  lastX=x;lastY=y;root.position.set(x,y,z);root.rotation.z=heading;
 },dispose(){
  for(const mesh of meshes)mesh.geometry.dispose();
  material.dispose();
 }};
}
