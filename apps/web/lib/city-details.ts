import {MercatorCoordinate,type Map as CityMap,type CustomLayerInterface} from 'maplibre-gl';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,MeshStandardMaterial,MeshPhysicalMaterial,AmbientLight,DirectionalLight,TextureLoader,type Texture,Scene,Camera,WebGLRenderer,WebGLRenderTarget,Matrix4,Color,Vector3,DoubleSide,CanvasTexture,SRGBColorSpace,RepeatWrapping,ShapeUtils,Vector2,PMREMGenerator,PCFShadowMap,ACESFilmicToneMapping,NoToneMapping} from 'three';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {readCityPois,mappedHeight,stableVariant,metersBetween,nearbyFootprints,outwardUv,type CityPoi} from './city-details-data';
import type {SceneMood} from './city-scene';
import {roofPhotoRequest} from './photo-city';
import {cityBuildingFeatures,getCityWorld,terrainHeight} from './city-world';
import {loadCityModel} from './city-model';
import {facadeProfile,facadeReferences,matchesFacadeEdge,facadePhotoUv} from './facade-references';
import {campusProfile,campusFace} from './campus-references';
import {drawCampusFacade,type CampusDrawing} from './campus-architecture';
import {drawCampusEnvelope,estimatedCampusFace,campusCompletionProfile} from './campus-envelope';
import {insidePolygon} from './walk-geometry';
import {CAMPUS_COURTYARD} from './campus-courtyard';
import {campusSurface,campusGlassTile} from './campus-surfaces';
import {withShadowDepthRange} from './render-depth';
import {HemisphereLight,type SphereGeometry} from 'three';
import {campusSkyGeometry} from './campus-sky';
import {drawCampusBench,drawCampusCycleStand,type FurnitureDrawing} from './campus-furniture';
import {drapeSurface} from './terrain-surface';
import {WALK_EYE_HEIGHT} from './walk-settings';

export type DetailOptions={mood:SceneMood;scale:number;enabled:boolean;dimensional:boolean;walking:boolean;photo:boolean;routeCoordinates?:number[][]};
export type DetailStatus={buildings:number;windows:number;signs:number;pois:CityPoi[];street:string;photoRoofTriangles?:number;photoGroundTriangles?:number;campusGroundTriangles?:number;routeSegments?:number;modelMeshes?:number;referenceBuildings?:number;facadePhotoFaces?:number;facadePhotoFailed?:boolean;campusBuildings?:number;campus?:boolean;campusFacades?:number;campusFinishedWalls?:number;campusEstimatedFacades?:number;campusReferenceBuildings?:number;campusEnvironment?:boolean;campusFixtures?:number;campusShadowResolution?:number};
type Point=[number,number];
type Wall={a:Point;b:Point;normal:Point;length:number;height:number;base:number;variant:number};
type Batch={positions:number[];colors:number[];uvs:number[]};
type SharedFramebufferRenderer=WebGLRenderer&{setRenderTargetFramebuffer:(target:WebGLRenderTarget,framebuffer:WebGLFramebuffer|null)=>void};
const ID='citysense-architecture';
const origin=MercatorCoordinate.fromLngLat([6.8,47.51]);
const unit=origin.meterInMercatorCoordinateUnits();
const local=(p:number[]):Point=>{const c=MercatorCoordinate.fromLngLat([p[0],p[1]]);return [(c.x-origin.x)/unit,(origin.y-c.y)/unit];};
const batch=():Batch=>({positions:[],colors:[],uvs:[]});
const roofColors=['#ae6d50','#8f5848','#7c5550','#687880','#b57c5e'];
const shutterColors=['#52695c','#526b7a','#80574a','#64756f','#6c6575'];
const campusConcreteTones=new Set(['#d2d1c8','#b3b6aa','#a9ac9f','#a3a497','#a9a79a','#8c938b','#adafa4','#cac8bb','#b8b6a8']);
const campusFrameTones=new Set(['#344b4c','#263b3c','#2d4141','#4a5956','#879087','#8c968e','#a8b3ac']);

/** A bounded, shared-depth mesh layer; no per-frame tile decoding or geometry allocation. */
export function createCityDetails(map:CityMap,initial:DetailOptions,onStatus:(value:DetailStatus)=>void) {
  let options=initial,disposed=false,timer:ReturnType<typeof setTimeout>|undefined;
  let lastCenter:[number,number]|undefined,walkPosition:[number,number]|undefined,lastKey='',force=true;
  let walkEye:number|undefined;
  function locate(event:{coordinates?:[number,number];eye?:number}){if(event.coordinates?.every(Number.isFinite))walkPosition=event.coordinates;if(Number.isFinite(event.eye))walkEye=event.eye;}
  let renderer:WebGLRenderer|undefined;
  let environment:WebGLRenderTarget|undefined,pendingHDR:Texture|undefined,skyHDR:Texture|undefined,sky:Mesh<SphereGeometry,MeshBasicMaterial>|undefined,campusLighting=false;
  const sharedTarget=new WebGLRenderTarget(1,1);Object.assign(sharedTarget,{isXRRenderTarget:true});sharedTarget.texture.colorSpace=SRGBColorSpace;
  let cityModel:Awaited<ReturnType<typeof loadCityModel>>;
  const scene=new Scene(),camera=new Camera();
  const transform=new Matrix4().makeTranslation(origin.x,origin.y,0).scale(new Vector3(unit,-unit,unit));
  const color=new Color();
  const resources:{dispose:()=>void}[]=[];
  const materials=new Map<string,Texture>();
  const facadeImages=new Map<string,HTMLImageElement>(),facadeTextures=new Map<string,CanvasTexture>(),failedFacadeImages=new Set<string>();
  function requestFacadeTexture(path:string){
    if(facadeImages.has(path)||facadeTextures.has(path)||failedFacadeImages.has(path)||!renderer)return;
    const image=new Image();facadeImages.set(path,image);
    image.onload=()=>{
      if(disposed)return;
      const limit=Math.min(path===facadeReferences.source.image?4096:2048,renderer!.capabilities.maxTextureSize),canvas=document.createElement('canvas');
      canvas.width=Math.min(limit,image.naturalWidth);canvas.height=Math.round(canvas.width*image.naturalHeight/image.naturalWidth);
      const ctx=canvas.getContext('2d');if(!ctx){failedFacadeImages.add(path);force=true;schedule();return;}
      ctx.drawImage(image,0,0,canvas.width,canvas.height);const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;
      texture.anisotropy=Math.min(8,renderer!.capabilities.getMaxAnisotropy());facadeTextures.set(path,texture);facadeImages.delete(path);force=true;schedule();
    };
    image.onerror=()=>{if(!disposed){failedFacadeImages.add(path);facadeImages.delete(path);force=true;schedule();}};
    image.src=path;
  }
  function materialTexture(name:string,data=false){
    const key=name+(data?':data':'');if(materials.has(key))return materials.get(key)!;
    const texture=new TextureLoader().load(`/materials/${name}.jpg`,()=>{if(disposed){texture.dispose();return;}force=true;schedule();});
    texture.wrapS=texture.wrapT=RepeatWrapping;if(!data)texture.colorSpace=SRGBColorSpace;texture.anisotropy=renderer?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;materials.set(key,texture);return texture;
  }
  let photoImage:HTMLImageElement|undefined,photoBounds:ReturnType<typeof roofPhotoRequest>['bounds']|undefined,photoKey='',pendingImage:HTMLImageElement|undefined;
  let roofImageTexture:CanvasTexture|undefined;
  function requestPhoto(center:[number,number]){
    if(!options.photo)return;
    // Keep the current image while it still covers the nearby scene. This
    // prevents repeated downloads when walking back and forth across a grid edge.
    if(photoImage&&photoBounds){const p=MercatorCoordinate.fromLngLat(center);const margin=(photoBounds.east-photoBounds.west)*.25;if(p.x>photoBounds.west+margin&&p.x<photoBounds.east-margin&&p.y>photoBounds.north+margin&&p.y<photoBounds.south-margin)return;}
    const request=roofPhotoRequest(...center);if(request.key===photoKey)return;
    photoKey=request.key;
    if(pendingImage){pendingImage.onload=null;pendingImage.onerror=null;pendingImage.src='';}
    const image=new Image();pendingImage=image;image.crossOrigin='anonymous';
    image.onload=()=>{if(disposed||pendingImage!==image)return;photoImage=image;photoBounds=request.bounds;pendingImage=undefined;force=true;schedule();};
    image.onerror=()=>{if(pendingImage===image)pendingImage=undefined;};
    image.src=request.url;
  }
  function clear(){scene.clear();resources.splice(0).forEach(r=>r.dispose());}
  function tint(hex:string,shade=1){color.set(hex);color.multiplyScalar(shade*(options.mood==='night'?.46:options.mood==='golden'?.94:1));return [color.r,color.g,color.b];}
  function triangle(target:Batch,a:number[],b:number[],c:number[],rgb:number[],uv?:number[][]){
    for(const [i,p] of [a,b,c].entries()){target.positions.push(p[0],p[1],p[2]*options.scale);target.colors.push(...rgb);if(uv)target.uvs.push(...uv[i]);}
  }
  function quad(target:Batch,a:number[],b:number[],c:number[],d:number[],hex:string,shade=1,uv?:number[][]){
    const rgb=tint(hex,shade);triangle(target,a,b,c,rgb,uv?.slice(0,3));triangle(target,a,c,d,rgb,uv&&[uv[0],uv[2],uv[3]]);
  }
  function panel(target:Batch,wall:Wall,along:number,width:number,bottom:number,top:number,hex:string,depth=.085,uv?:number[][]){
    const dx=(wall.b[0]-wall.a[0])/wall.length,dy=(wall.b[1]-wall.a[1])/wall.length;
    const x=wall.a[0]+dx*along+wall.normal[0]*depth,y=wall.a[1]+dy*along+wall.normal[1]*depth;
    const a=[x-dx*width/2,y-dy*width/2,bottom],b=[x+dx*width/2,y+dy*width/2,bottom];
    quad(target,a,b,[b[0],b[1],top],[a[0],a[1],top],hex,.83+Math.max(0,wall.normal[0]*-.6+wall.normal[1]*-.8)*.17,uv&&outwardUv(uv,dx,dy,wall.normal));
  }
  // Actual solid trim near the camera: side and underside faces make sills,
  // frames and cornices read as architecture rather than decals on a box.
  function wallBox(target:Batch,wall:Wall,along:number,width:number,bottom:number,top:number,hex:string,front:number,back=.03,textured=false,textureSpan:Point=[3,.25]){
    const dx=(wall.b[0]-wall.a[0])/wall.length,dy=(wall.b[1]-wall.a[1])/wall.length;
    const point=(at:number,z:number,depth:number)=>[wall.a[0]+dx*at+wall.normal[0]*depth,wall.a[1]+dy*at+wall.normal[1]*depth,z];
    const l=along-width/2,r=along+width/2;
    const a=point(l,bottom,front),b=point(r,bottom,front),c=point(r,top,front),d=point(l,top,front);
    const e=point(l,bottom,back),f=point(r,bottom,back),g=point(r,top,back),h=point(l,top,back);
    const faceUv=(w:number,h:number)=>textured?[[0,0],[w/textureSpan[0],0],[w/textureSpan[0],h/textureSpan[1]],[0,h/textureSpan[1]]]:undefined;
    const uv=faceUv(width,top-bottom),sideUv=faceUv(front-back,top-bottom),topUv=faceUv(width,front-back);
    quad(target,a,b,c,d,hex,.92,uv);quad(target,e,a,d,h,hex,.64,sideUv);quad(target,b,f,g,c,hex,.72,sideUv);
    quad(target,d,c,g,h,hex,1,topUv);quad(target,e,f,b,a,hex,.5,topUv);
  }
  function mesh(data:Batch,texture?:Texture,physical=false,cutout=false){
    if(!data.positions.length)return;
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(data.positions,3));geometry.setAttribute('color',new Float32BufferAttribute(data.colors,3));
    if(texture)geometry.setAttribute('uv',new Float32BufferAttribute(data.uvs,2));
    geometry.computeVertexNormals();
    const material=physical?new MeshStandardMaterial({vertexColors:true,side:DoubleSide,map:texture||null,roughness:.88,metalness:0,envMapIntensity:.35}):new MeshBasicMaterial({vertexColors:true,side:DoubleSide,map:texture||null,transparent:cutout,depthWrite:!cutout,toneMapped:false});
    if(physical)orientPhysicalMaterial(material as MeshStandardMaterial);
    const object=new Mesh(geometry,material);object.castShadow=physical&&campusLighting;object.receiveShadow=physical&&campusLighting;object.frustumCulled=false;scene.add(object);resources.push(geometry,material);
    return object;
  }
  function orientPhysicalMaterial(material:MeshStandardMaterial){
    // MapLibre's Mercator projection includes a handedness flip. Face the
    // physical normal towards the actual ENU eye rather than GL winding.
    material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nif (dot(normal, vViewPosition) < 0.0) normal = -normal;');};
    material.customProgramCacheKey=()=> 'citysense-enu-normal-v1';
  }
  function concreteTexture(){
    return materialTexture('campus-concrete-color');
  }
  function surfaceTexture(kind:'concrete'|'paving'|'windows'){
    const key='campus-surface:'+kind;if(materials.has(key))return materials.get(key)!;
    const texture=new CanvasTexture(campusSurface(kind));texture.colorSpace=SRGBColorSpace;texture.wrapS=texture.wrapT=RepeatWrapping;texture.anisotropy=Math.min(8,renderer?.capabilities.getMaxAnisotropy()||1);materials.set(key,texture);return texture;
  }
  function leafTexture(){
    const key='campus-leaf-clusters';if(materials.has(key))return materials.get(key)!;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=512;const ctx=canvas.getContext('2d')!;let seed=57123;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(let i=0;i<600;i++){
      const angle=random()*Math.PI*2,r=Math.sqrt(random()),x=256+Math.cos(angle)*r*222,y=256+Math.sin(angle)*r*205;
      ctx.strokeStyle='#625e3c';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(256+(x-256)*.72,256+(y-256)*.72);ctx.lineTo(x,y);ctx.stroke();
      ctx.save();ctx.translate(x,y);ctx.rotate(angle+random());const size=6+random()*12;
      const gradient=ctx.createLinearGradient(-size,0,size,0);gradient.addColorStop(0,['#456336','#536d3c','#3d5b30'][i%3]);gradient.addColorStop(.5,'#8ba35c');gradient.addColorStop(1,'#607d41');ctx.fillStyle=gradient;
      ctx.beginPath();ctx.moveTo(-size,0);ctx.quadraticCurveTo(0,-size*.72,size,0);ctx.quadraticCurveTo(0,size*.64,-size,0);ctx.fill();
      ctx.strokeStyle='#c0c68d66';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-size*.8,0);ctx.lineTo(size*.9,0);ctx.stroke();ctx.restore();
    }
    const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.anisotropy=Math.min(8,renderer?.capabilities.getMaxAnisotropy()||1);materials.set(key,texture);return texture;
  }
  function roofTexture(){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#00000032';ctx.lineWidth=2;
    for(let y=0;y<=128;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();for(let x=(y%64?16:0);x<=128;x+=32){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+32);ctx.stroke();}}
    const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.wrapS=texture.wrapT=RepeatWrapping;resources.push(texture);return texture;
  }
  function campusSlabTexture(){
    return materialTexture('campus-paving-color');
  }
  function physicalSurface(object:Mesh|undefined,name:string,relief:number){
    if(!object)return;const material=object.material as MeshStandardMaterial;
    material.bumpMap=materialTexture(name+'-height',true);material.bumpScale=relief;
    material.roughnessMap=materialTexture(name+'-roughness',true);material.roughness=1;
  }
  function referenceSign(wall:Wall,at:number,width:number,text:string){
    const key='reference-sign:'+text;let texture=materials.get(key);
    if(!texture){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#e7e3d7';ctx.fillRect(0,0,512,96);ctx.fillStyle='#242633';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='600 33px sans-serif';ctx.fillText(text,256,48,490);texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;materials.set(key,texture);}
    const sign=batch();panel(sign,wall,at,width,wall.base+3.05,wall.base+3.55,'#ffffff',.5,[[0,0],[1,0],[1,1],[0,1]]);mesh(sign,texture);
  }
  function campusLettering(wall:Wall,text:string,at:number,width:number,bottom:number,top:number,outline=false,depth=.4){
    const key=`campus-lettering:${text}:${outline}`;let texture=materials.get(key);
    if(!texture){
      const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=512;const ctx=canvas.getContext('2d')!;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`${outline?'200':'400'} 320px sans-serif`;
      if(outline){ctx.strokeStyle='#e5e8dc';ctx.lineWidth=5;ctx.strokeText(text,1024,260,1980);}else{ctx.fillStyle='#e2e6d8';ctx.fillText(text,1024,260,1980);}
      texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;materials.set(key,texture);
    }
    const letters=batch();panel(letters,wall,at,width,wall.base+bottom,wall.base+top,'#ffffff',depth,[[0,0],[1,0],[1,1],[0,1]]);mesh(letters,texture,false,true);
  }
  function rebuild(){
    timer=undefined;if(disposed||!renderer)return;
    const center:[number,number]=options.walking&&walkPosition?walkPosition:[map.getCenter().lng,map.getCenter().lat];
    if(options.dimensional&&map.getZoom()>=15.5)requestPhoto(center);
    const city=getCityWorld(),campus=!!city?.campus&&center[0]>=city.campus.bounds[0]&&center[0]<=city.campus.bounds[2]&&center[1]>=city.campus.bounds[1]&&center[1]<=city.campus.bounds[3];
    campusLighting=campus;scene.environment=campus&&environment?environment.texture:null;scene.environmentIntensity=options.mood==='night'?.12:.35;scene.environmentRotation.set(Math.PI/2,0,0);
    const campusPois=(city?.campus?.pois||[]).map(p=>({id:'campus:'+p.id,geometry:{type:'Point',coordinates:p.coordinates},properties:{...p.tags,class:p.tags.amenity||p.tags.building||p.tags.office}}));
    const pois=readCityPois([...campusPois,...map.querySourceFeatures('openmaptiles',{sourceLayer:'poi'})],center).filter((p,i,all)=>!all.slice(0,i).some(q=>q.name===p.name&&metersBetween(q.coordinates,p.coordinates)<60));
    if(!options.dimensional||map.getZoom()<15.5){if(scene.children.length)clear();lastCenter=undefined;onStatus({buildings:0,windows:0,signs:0,pois,street:''});return;}
    const features=cityBuildingFeatures(map);
    const key=features.map(f=>f.id).join(',')+'|'+pois.map(p=>p.id).sort().join(',');
    if(!force&&lastCenter&&metersBetween(center,lastCenter)<30&&key===lastKey)return;
    force=false;lastCenter=center;lastKey=key;clear();
    const walls:Wall[]=[],details=batch(),timber=batch(),metal=batch(),foliage=batch(),groundAreas=batch(),facades=batch(),referenceFacades=batch(),campusConcrete=batch(),campusGlazing=batch(),campusFrames=batch(),campusRoofs=batch(),campusGround=batch(),photoFacades=new Map<string,Batch>(),asphalt=batch(),paving=batch(),campusPaving=batch(),roofs=batch(),photoRoofs=batch(),photoTerrain=batch(),terrain=batch(),signs=batch();let count=0,windows=0,referenceBuildings=0,facadePhotoFaces=0,campusBuildings=0,campusFacades=0,campusFinishedWalls=0,campusEstimatedFacades=0,campusReferenceBuildings=0;
    function groundSurface(target:Batch,polygon:number[][],hex:string,lift:number,repeat=2){
      for(const tile of city?[city,...city.terrainPatches||[]]:[])for(const face of drapeSurface(polygon,tile,city!.datum,lift)){
        const points=face.map(p=>[...local(p),p[2]]);
        triangle(target,points[0],points[1],points[2],tint(hex),points.map(p=>[p[0]/repeat,p[1]/repeat]));
      }
    }
    function localGroundSurface(target:Batch,points:number[][],hex:string,lift:number){
      groundSurface(target,points.map(p=>{const q=new MercatorCoordinate(origin.x+p[0]*unit,origin.y-p[1]*unit).toLngLat();return [q.lng,q.lat];}),hex,lift);
    }
    function solidBox(p:number[],w:number,d:number,h:number,hex:string,target=details){
      const a=[p[0]-w/2,p[1]-d/2,p[2]],b=[p[0]+w/2,p[1]-d/2,p[2]],c=[p[0]+w/2,p[1]+d/2,p[2]],e=[p[0]-w/2,p[1]+d/2,p[2]],top=(q:number[])=>[q[0],q[1],q[2]+h];
      const vertical=[[0,0],[w/2,0],[w/2,h/.25],[0,h/.25]],horizontal=[[0,0],[w/2,0],[w/2,d/.25],[0,d/.25]];
      quad(target,a,b,top(b),top(a),hex,1,vertical);quad(target,b,c,top(c),top(b),hex,.85,vertical);quad(target,c,e,top(e),top(c),hex,.9,vertical);quad(target,e,a,top(a),top(e),hex,.85,vertical);quad(target,top(a),top(b),top(c),top(e),hex,1,horizontal);
    }
    function branch(a:number[],b:number[],radius:number,hex='#776449',target=details,endScale=.6){
      const direction=new Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize(),u=new Vector3().crossVectors(direction,Math.abs(direction.y)>.9?new Vector3(0,0,1):new Vector3(0,1,0)).normalize(),v=new Vector3().crossVectors(direction,u).normalize();
      for(let i=0;i<8;i++){
        const point=(p:number[],angle:number,r:number)=>[p[0]+(u.x*Math.cos(angle)+v.x*Math.sin(angle))*r,p[1]+(u.y*Math.cos(angle)+v.y*Math.sin(angle))*r,p[2]+(u.z*Math.cos(angle)+v.z*Math.sin(angle))*r];
        quad(target,point(a,i*Math.PI/4,radius),point(a,(i+1)*Math.PI/4,radius),point(b,(i+1)*Math.PI/4,radius*endScale),point(b,i*Math.PI/4,radius*endScale),hex,.75+Math.sin(i)*.16);
      }
    }
    function leaves(p:number[],radius:number,seed:number){
      for(let plane=0;plane<3;plane++){
        const angle=plane*Math.PI/3+seed*.7,dx=Math.cos(angle)*radius,dy=Math.sin(angle)*radius;
        quad(foliage,[p[0]-dx,p[1]-dy,p[2]-radius*.85],[p[0]+dx,p[1]+dy,p[2]-radius*.85],[p[0]+dx,p[1]+dy,p[2]+radius*.85],[p[0]-dx,p[1]-dy,p[2]+radius*.85],'#ffffff',.9+seed%3*.05,[[0,0],[1,0],[1,1],[0,1]]);
      }
    }
    function furnitureAt(p:number[],ground:number):FurnitureDrawing{
      return {
        box:(x,y,z,w,d,h,color,wood)=>solidBox([p[0]+x,p[1]+y,ground+z],w,d,h,color,wood?timber:metal),
        tube:(a,b,r,color)=>branch([p[0]+a[0],p[1]+a[1],ground+a[2]],[p[0]+b[0],p[1]+b[1],ground+b[2]],r,color,metal,1),
      };
    }
    function tree(p:number[],height:number,seed:number,simple=false){
      if(simple){branch(p,[p[0],p[1],p[2]+height*.75],.12);leaves([p[0],p[1],p[2]+height*.7],height*.34,seed);return;}
      for(let root=0;root<5;root++){
        const angle=root*Math.PI*.4+seed;branch([p[0]+Math.cos(angle)*.38,p[1]+Math.sin(angle)*.38,p[2]+.03],[p[0],p[1],p[2]+.5],.055,'#736b55');
      }
      branch(p,[p[0]+.08,p[1]-.05,p[2]+height*.8],.12);
      for(let i=0;i<8;i++){
        const angle=i*2.399+seed,spread=height*(i===7?.06:.20),z=p[2]+height*(.59+(i%3)*.12),q=[p[0]+Math.cos(angle)*spread,p[1]+Math.sin(angle)*spread,z];
        branch([p[0],p[1],p[2]+height*.43],q,.045);leaves(q,height*.23,i+seed);
      }
    }
    scene.add(new AmbientLight(options.mood==='night'?'#9db5d0':'#fff4ed',campus?.18:1.05));const sun=new DirectionalLight(campus?(options.mood==='night'?'#a5bdde':options.mood==='golden'?'#ffdfac':'#fff9f0'):'#fff1d8',campus?(options.mood==='night'?.16:1.8):1.5);
    if(campus){
      const hemisphere=new HemisphereLight('#dce9f4','#7a7a67',options.mood==='night'?.2:1.05);hemisphere.position.set(0,0,1);scene.add(hemisphere);
      if(sky&&options.mood!=='night'){sky.material.color.set(options.mood==='golden'?'#ffe3bd':'#ffffff');scene.add(sky);}
      const p=local(center),ground=terrainHeight(...center)||0,radius=options.walking?95:180;
      sun.position.set(p[0]-90,p[1]-70,ground+260);sun.target.position.set(p[0],p[1],ground);sun.castShadow=options.mood!=='night';
      const resolution=map.getCanvas().clientWidth>=1000?2048:1024;sun.shadow.mapSize.set(resolution,resolution);
      Object.assign(sun.shadow.camera,{left:-radius,right:radius,top:radius,bottom:-radius,near:1,far:600});sun.shadow.camera.up.set(0,0,1);sun.shadow.camera.updateProjectionMatrix();sun.shadow.normalBias=.035;sun.shadow.bias=-.0006;resources.push(sun.shadow);
    }else sun.position.set(-100,-100,300);
    scene.add(sun,sun.target);
    if(city?.streets){
      for(const road of city.streets.roads){
        if(cityModel&&!campus)continue;
        const tags=road.tags,kind=tags.highway;if(['motorway','motorway_link','trunk','trunk_link','steps','construction','proposed'].includes(kind)||tags.tunnel==='yes')continue;
        if(!road.coordinates.some(p=>metersBetween(center,p)<300))continue;
        const pedestrian=['footway','pedestrian','path','cycleway','living_street'].includes(kind),lanes=Number(tags.lanes),mappedWidth=Number.parseFloat(tags.width||'');
        const width=Math.max(1,Math.min(20,Number.isFinite(mappedWidth)?mappedWidth:lanes>0?lanes*3:pedestrian?3:kind==='service'?4:6));
        const coordinates=road.coordinates.flatMap((a,i)=>{const b=road.coordinates[i+1];if(!b)return [a];const parts=Math.max(1,Math.ceil(metersBetween(a,b)/6));return Array.from({length:parts},(_,k)=>[a[0]+(b[0]-a[0])*k/parts,a[1]+(b[1]-a[1])*k/parts] as [number,number]);});
        let along=0;
        for(let i=1;i<coordinates.length;i++){
          const pa=coordinates[i-1],pb=coordinates[i],a=local(pa),b=local(pb),length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.2)continue;
          const dx=(b[0]-a[0])/length,dy=(b[1]-a[1])/length;
          function strip(target:Batch,offset:number,span:number,color:string,bottom=.065){
            const points=[[a[0]-dy*(offset-span/2),a[1]+dx*(offset-span/2)],[b[0]-dy*(offset-span/2),b[1]+dx*(offset-span/2)],[b[0]-dy*(offset+span/2),b[1]+dx*(offset+span/2)],[a[0]-dy*(offset+span/2),a[1]+dx*(offset+span/2)]];
            const za=terrainHeight(...pa),zb=terrainHeight(...pb);if(za===null||zb===null)return;
            if(campus){
              localGroundSurface(target,points,color,bottom);return;
            }
            quad(target,[...points[0],za+bottom],[...points[1],zb+bottom],[...points[2],zb+bottom],[...points[3],za+bottom],color,1,[[along/2,0],[(along+length)/2,0],[(along+length)/2,span/2],[along/2,span/2]]);
          }
          strip(pedestrian?paving:asphalt,0,width,pedestrian?'#c4bfb2':'#aaa9a4',pedestrian?.075:.065);
          const sidewalk=tags.sidewalk;
          if(['yes','both','left'].includes(sidewalk))strip(paving,width/2+.8,1.6,'#c9c4b6',.19);
          if(['yes','both','right'].includes(sidewalk))strip(paving,-width/2-.8,1.6,'#c9c4b6',.19);
          if(lanes>=2&&!pedestrian&&Math.floor(along/6)%2===0){
            const q=a,r=b,za=(terrainHeight(...pa)??0)+.09,zb=(terrainHeight(...pb)??0)+.09;
            const points=[[q[0]-dy*.055,q[1]+dx*.055,za],[r[0]-dy*.055,r[1]+dx*.055,zb],[r[0]+dy*.055,r[1]-dx*.055,zb],[q[0]+dy*.055,q[1]-dx*.055,za]];
            if(campus)localGroundSurface(details,points,'#e8e4cf',.09);else quad(details,points[0],points[1],points[2],points[3],'#e8e4cf');
          }
          along+=length;
        }
      }
      for(const object of city.streets.objects){
        if(cityModel&&!campus)continue;
        if(metersBetween(center,object.coordinates)>260)continue;const p=local(object.coordinates),ground=terrainHeight(...object.coordinates)??NaN;if(!Number.isFinite(ground))continue;
        function box(x:number,y:number,z:number,w:number,d:number,h:number,color:string){const a=[p[0]+x-w/2,p[1]+y-d/2,ground+z],b=[a[0]+w,a[1],a[2]],c=[a[0]+w,a[1]+d,a[2]],e=[a[0],a[1]+d,a[2]],top=(v:number[])=>[v[0],v[1],v[2]+h];quad(details,a,b,top(b),top(a),color);quad(details,b,c,top(c),top(b),color);quad(details,c,e,top(e),top(c),color);quad(details,e,a,top(a),top(e),color);quad(details,top(a),top(b),top(c),top(e),color);}
        if(object.tags.natural==='tree'){
          if(campus){tree([p[0],p[1],ground],Math.max(3,Math.min(14,Number.parseFloat(object.tags.height||'')||7)),object.id%29,options.walking&&metersBetween(center,object.coordinates)>100);continue;}
          const height=Math.max(3,Math.min(18,Number.parseFloat(object.tags.height||'')||7));box(0,0,0,.25,.25,height*.7,'#77634b');
          const slices=metersBetween(center,object.coordinates)<80?12:8,rings=6;
          const leaf=['#58784e','#607f51','#4d714a'][object.id%3];
          // Rounded crowns share one batch. Positions/heights follow mapped
          // data; foliage shape and unrecorded dimensions remain illustrative.
          const vertex=(u:number,v:number)=>{const phi=Math.PI*v/rings,theta=2*Math.PI*u/slices,r=height*.27*Math.sin(phi);return [p[0]+Math.cos(theta)*r,p[1]+Math.sin(theta)*r,ground+height*.7+height*.3*Math.cos(phi)];};
          for(let row=0;row<rings;row++)for(let col=0;col<slices;col++)quad(details,vertex(col,row),vertex(col+1,row),vertex(col+1,row+1),vertex(col,row+1),leaf,.7+.3*Math.max(0,Math.cos(2*Math.PI*(col+.5)/slices)));
        }else if(object.tags.highway==='street_lamp'){box(0,0,0,.12,.12,5,'#5b6465');box(.4,0,4.9,.9,.22,.12,'#444d50');box(.7,0,4.8,.4,.3,.12,options.mood==='night'?'#ffe9a6':'#bec7bf');}
        else if(object.tags.amenity==='bench'){
          if(campus)drawCampusBench(1.6,furnitureAt(p,ground));
          else{box(0,0,.4,1.6,.5,.1,'#93704e');box(0,.22,.5,1.6,.08,.55,'#93704e');box(-.55,0,0,.08,.45,.4,'#525b55');box(.55,0,0,.08,.45,.4,'#525b55');}
        }
        else if(object.tags.amenity==='bicycle_parking'){
          // Locations and capacities are mapped; the steel stands are illustrative.
          const stands=Math.max(1,Math.min(8,Math.ceil((Number(object.tags.capacity)||4)/2)));
          for(let i=0;i<stands;i++){
            const x=(i-(stands-1)/2)*.75;
            if(campus)drawCampusCycleStand(x,furnitureAt(p,ground));
            else{box(x,-.3,0,.045,.045,.75,'#687778');box(x,.3,0,.045,.045,.75,'#687778');box(x,0,.73,.045,.64,.045,'#687778');}
          }
        }else if(object.tags.amenity==='waste_basket'){box(0,0,0,.4,.4,.72,'#52635e');box(0,0,.72,.44,.44,.05,'#394a45');}
        else if(object.tags.highway==='bus_stop'&&object.tags.shelter==='yes'){
          for(const x of [-1.4,1.4])box(x,.5,0,.07,.07,2.3,'#58696a');
          box(0,0,2.3,3.1,1.4,.12,'#657477');box(0,.52,.45,2.8,.035,1.75,'#a1b8b7');
          if(object.tags.bench==='yes'){box(0,.2,.45,2.3,.4,.08,'#63706d');for(const x of [-.8,.8])box(x,.2,0,.06,.3,.45,'#586562');}
        }
      }
    }
    if(campus)for(const fixture of CAMPUS_COURTYARD.fixtures){
      const coordinates:[number,number]=[...fixture.coordinates],p=local(coordinates),ground=terrainHeight(...coordinates);if(ground===null)continue;
      if(fixture.kind==='tree'){
        tree([p[0],p[1],ground],fixture.height,11);
        solidBox([p[0],p[1],ground+.1],2,2,.08,'#625d48');
        for(const side of [-1,1]){solidBox([p[0]+side*1.05,p[1],ground+.1],.1,2.2,.22,'#a7a99c');solidBox([p[0],p[1]+side*1.05,ground+.1],2.2,.1,.22,'#a7a99c');}
      }else if(fixture.kind==='planter'){
        solidBox([p[0],p[1],ground],fixture.width,fixture.depth,fixture.height,'#b6b7aa');solidBox([p[0],p[1],ground+fixture.height+.01],fixture.width-.24,fixture.depth-.24,.035,'#564f37');
        for(let i=0;i<10;i++)leaves([p[0]-fixture.width*.4+i*fixture.width*.08,p[1]+Math.sin(i)*.35,ground+.8],.55,i);
        // Timber seat on the photographed raised planting-bed edge.
        for(let slat=0;slat<4;slat++){
          const y=p[1]-fixture.depth*.5+slat*.11;solidBox([p[0],y,ground+fixture.height+.06],fixture.width-.3,.09,.05,'#ffffff',timber);
          for(const x of [-1,1])solidBox([p[0]+x*(fixture.width*.5-.3),y,ground+fixture.height+.111],.018,.018,.003,'#575b50');
        }
        for(const x of [-1,1])for(const y of [-1,1])solidBox([p[0]+x*(fixture.width*.5-.07),p[1]+y*(fixture.depth*.5-.07),ground+fixture.height],.14,.14,.045,'#cdcec0');
      }else if(fixture.kind==='bench'){
        drawCampusBench(fixture.width,furnitureAt(p,ground));
      }else{
        solidBox([p[0],p[1],ground+.01],.25,.25,.035,'#525e57');
        branch([p[0],p[1],ground],[p[0],p[1],ground+.24],.085,'#63736c');
        branch([p[0],p[1],ground],[p[0],p[1],ground+fixture.height],.055,'#63736c');
        branch([p[0],p[1],ground+fixture.height-.3],[p[0],p[1],ground+fixture.height-.06],.14,'#c2c8b8');
        branch([p[0],p[1],ground+fixture.height-.05],[p[0],p[1],ground+fixture.height+.03],.33,'#717c70');
      }
    }
    if(campus&&city?.campus)for(const area of city.campus.areas){
      if(options.photo&&!options.walking&&area.tags.highway!=='pedestrian')continue;
      if(!area.coordinates.some(p=>metersBetween(center,p)<280))continue;
      const ring=area.coordinates.slice(0,-1),points=ring.map(p=>[...local(p),(terrainHeight(...p)??0)+.035]);
      const green=area.tags.landuse==='grass'||area.tags.landuse==='flowerbed'||area.tags.leisure==='garden',hex=green?'#849d70':area.tags.amenity==='parking'?'#858b8a':'#bcb9ab';
      for(const indices of ShapeUtils.triangulateShape(points.map(p=>new Vector2(p[0],p[1])),[])){
        const polygon=indices.map(i=>ring[i]);
        if(area.tags.highway==='pedestrian'&&area.tags.surface!=='asphalt')groundSurface(campusPaving,polygon,'#b4b6aa',.12,3.2);
        else groundSurface(green?groundAreas:asphalt,polygon,hex,.035);
      }
    }
    const routeCoordinates=options.routeCoordinates||[];let routeSegments=0;
    for(let i=1;i<routeCoordinates.length;i++){
      const a=routeCoordinates[i-1],b=routeCoordinates[i],parts=Math.max(1,Math.ceil(metersBetween(a,b)/5));
      for(let part=0;part<parts;part++){
        const pa=[a[0]+(b[0]-a[0])*part/parts,a[1]+(b[1]-a[1])*part/parts],pb=[a[0]+(b[0]-a[0])*(part+1)/parts,a[1]+(b[1]-a[1])*(part+1)/parts],qa=local(pa),qb=local(pb),za=terrainHeight(pa[0],pa[1]),zb=terrainHeight(pb[0],pb[1]);if(za===null||zb===null)continue;
        const length=Math.hypot(qb[0]-qa[0],qb[1]-qa[1]);if(length<.05)continue;const nx=-(qb[1]-qa[1])/length,ny=(qb[0]-qa[0])/length;
        for(const [width,color,height] of [[1.1,'#fff9e9',.28],[.7,options.mood==='night'?'#6ae8cb':'#087c70',.3]] as const){
          const points=[[qa[0]+nx*width,qa[1]+ny*width,za+height],[qb[0]+nx*width,qb[1]+ny*width,zb+height],[qb[0]-nx*width,qb[1]-ny*width,zb+height],[qa[0]-nx*width,qa[1]-ny*width,za+height]];
          if(campus)localGroundSurface(details,points,color,height);else quad(details,points[0],points[1],points[2],points[3],color);
        }
        routeSegments++;
      }
    }
    for(const tile of city?[city,...city.terrainPatches||[]]:[]){
      if(campus&&options.walking&&tile===city)continue;
      const [w,s,e,n]=tile.bounds,grid:number[][]=[];
      for(let y=0;y<tile.size;y++)for(let x=0;x<tile.size;x++){const lon=w+x/(tile.size-1)*(e-w),lat=s+y/(tile.size-1)*(n-s);grid.push([...local([lon,lat]),terrainHeight(lon,lat)!]);}
      for(let y=0;y<tile.size-1;y++)for(let x=0;x<tile.size-1;x++){
        const a=y*tile.size+x,b=a+1,c=a+tile.size,d=c+1;
        for(const indices of [[a,b,c],[b,d,c]]){const points=indices.map(i=>grid[i]);const uv=photoBounds?points.map(p=>[(origin.x+p[0]*unit-photoBounds!.west)/(photoBounds!.east-photoBounds!.west),1-(origin.y-p[1]*unit-photoBounds!.north)/(photoBounds!.south-photoBounds!.north)]):[];
          if(campus&&options.walking&&tile!==city)triangle(campusGround,points[0],points[1],points[2],tint('#a3a49a'),points.map(p=>[p[0]/2,p[1]/2]));
          else if(options.photo&&photoImage&&uv.length&&uv.every(p=>p.every(v=>v>=0&&v<=1)))triangle(photoTerrain,points[0],points[1],points[2],tint('#ffffff'),uv);
          else triangle(terrain,points[0],points[1],points[2],tint('#777970'));
        }
      }
    }
    // OpenMapTiles can merge hundreds of equal-height buildings into one MultiPolygon.
    // Cull and deduplicate individual footprints, never the feature's first polygon.
    const footprints=nearbyFootprints(features,center,options.walking?240:420);
    const campusOccluders=footprints.filter(f=>f.feature.properties?.region==='campus').map(f=>({feature:f.feature,rings:f.polygon.map(r=>r.map(local))}));
    for(const {feature,polygon,distance} of footprints){
        if(!options.enabled)break;
        if(count>=(options.walking?100:160))break;
        const p=feature.properties||{};if(p.hide_3d)continue;
        const campusBuilding=p.region==='campus';if(typeof p.campusName==='string')campusBuildings++;
        const university=campusProfile(p.sourceId);if(university)campusReferenceBuildings++;
        const completion=university||campusCompletionProfile(p.sourceId);
        const profile=facadeProfile(p.sourceId);if(profile){referenceBuildings++;for(const face of profile.photoFaces){const projection=facadeReferences.projections[face.projection];requestFacadeTexture(projection.image||facadeReferences.source.image);}}
        const {height,base}=mappedHeight(p);if(height<=base)continue;
        const rings=polygon.map(r=>r.slice(0,-1).map(local)).filter(r=>r.length>=3);if(!rings.length||rings[0].length>100)continue;
        const variant=stableVariant(undefined,polygon[0]);count++;
        const facade=completion?.wallColor||(campusBuilding?'#c2c6c3':typeof p.colour==='string'&&/^#[0-9a-f]{6}$/i.test(p.colour)?p.colour:['#e1c5a4','#e8d9b8','#c9b4a8','#d6b6a1','#d1d2bb','#d7bc83','#bdd0c6','#d5c8bb'][variant%8]);
        const outer=rings[0].map(p=>new Vector2(...p)),holes=rings.slice(1).map(r=>r.map(p=>new Vector2(...p)));
        const vertices=rings.flat();const roofColor=roofColors[variant%roofColors.length];
        for(const indices of ShapeUtils.triangulateShape(outer,holes)){
          const points=indices.map(i=>[...vertices[i],height+.045]);
          const uv=photoBounds?points.map(p=>[(origin.x+p[0]*unit-photoBounds!.west)/(photoBounds!.east-photoBounds!.west),1-(origin.y-p[1]*unit-photoBounds!.north)/(photoBounds!.south-photoBounds!.north)]):[];
          if(options.photo&&photoImage&&uv.length&&uv.every(p=>p.every(v=>v>=0&&v<=1)))triangle(photoRoofs,points[0],points[1],points[2],tint('#ffffff'),uv);
          // Flat campus envelopes should not inherit historic-town terracotta
          // tiles. Keep a neutral mineral roof when aerial photography is absent.
          else if(campusBuilding)triangle(campusRoofs,points[0],points[1],points[2],tint('#b9bcb4'),points.map(p=>[p[0]/4,p[1]/4]));
          else triangle(roofs,points[0],points[1],points[2],tint(roofColor),points.map(p=>[p[0]/2,p[1]/2]));
        }
        for(const [ringIndex,ring] of rings.entries()){
          const area=ring.reduce((s,a,i)=>{const b=ring[(i+1)%ring.length];return s+a[0]*b[1]-b[0]*a[1];},0);
          for(let i=0;i<ring.length;i++){
            const a=ring[i],b=ring[(i+1)%ring.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.5)continue;
            const flip=(area>0?1:-1)*(ringIndex===0?1:-1);
            const normal:Point=[(b[1]-a[1])/length*flip,-(b[0]-a[0])/length*flip];
            const wall:Wall={a,b,normal,length,height,base,variant};if(ringIndex===0&&!profile&&!campusBuilding)walls.push(wall);
            const materialWidth=campusBuilding?4:2;
            panel(campusBuilding?campusConcrete:profile?referenceFacades:facades,wall,length/2,length,base,height,facade,.025,[[0,0],[length/materialWidth,0],[length/materialWidth,(height-base)/2],[0,(height-base)/2]]);
            if(campusBuilding){
              // IGN gives one base elevation per volume. Extend its foundation
              // down to the sloping terrain instead of leaving an air gap.
              const ga=polygon[ringIndex][i],gb=polygon[ringIndex][i+1],pieces=Math.ceil(length/3);
              for(let piece=0;piece<pieces;piece++){
                const t0=piece/pieces,t1=(piece+1)/pieces;
                const bottom=(t:number)=>Math.min(base,(terrainHeight(ga[0]+(gb[0]-ga[0])*t,ga[1]+(gb[1]-ga[1])*t)??base))-.15;
                const z0=bottom(t0),z1=bottom(t1);if(z0>=base-.151&&z1>=base-.151)continue;
                const p0=[a[0]+(b[0]-a[0])*t0+normal[0]*.025,a[1]+(b[1]-a[1])*t0+normal[1]*.025],p1=[a[0]+(b[0]-a[0])*t1+normal[0]*.025,a[1]+(b[1]-a[1])*t1+normal[1]*.025];
                quad(campusConcrete,[...p0,z0],[...p1,z1],[...p1,base],[...p0,base],facade,1,[[length*t0/4,z0/2],[length*t1/4,z1/2],[length*t1/4,base/2],[length*t0/4,base/2]]);
              }
              const observed=university&&campusFace(university,polygon[ringIndex][i],polygon[ringIndex][i+1]);
              const academic=!!completion||['university','college','research','sports_hall','restaurant'].includes(String(p.campusUse));
              // Suppress detail on shared walls hidden inside another volume.
              const exposed=!academic||[.2,.5,.8].some(t=>{
                const point:Point=[a[0]+(b[0]-a[0])*t+normal[0]*.6,a[1]+(b[1]-a[1])*t+normal[1]*.6];
                return !campusOccluders.some(other=>other.feature!==feature&&Number(other.feature.properties?.render_height)>=height-.3&&insidePolygon(point,other.rings));
              });
              const estimated=!observed&&academic&&exposed?estimatedCampusFace(completion,p.campusUse,length,height-base):undefined;
              const face=observed||estimated;
              if(face||academic&&exposed){
                const drawing:CampusDrawing={
                  panel:(at,w,bottom,top,hex,depth)=>panel(campusConcreteTones.has(hex)?campusConcrete:details,wall,at,w,base+bottom,base+top,hex,depth,campusConcreteTones.has(hex)?[[0,0],[w/4,0],[w/4,(top-bottom)/2],[0,(top-bottom)/2]]:undefined),
                  box:(at,w,bottom,top,hex,front,back)=>{
                    const wooden=face?.kind==='timber'&&['#9a7049','#aa8056','#88603f','#ad8259'].includes(hex);
                    const concrete=campusConcreteTones.has(hex);
                    wallBox(wooden?timber:concrete?campusConcrete:campusFrameTones.has(hex)?campusFrames:details,wall,at,w,base+bottom,base+top,wooden?'#c9b89c':hex,front,back,wooden||concrete,concrete?[4,2]:[3,.25]);
                  },
                  lettering:(...args)=>campusLettering(wall,...args),
                  glazing:(at,w,bottom,top,depth,kind)=>{
                    const tile=campusGlassTile(at,bottom,wall.variant,kind),u=(tile%4)/4,v=Math.floor(tile/4)/4;
                    panel(campusGlazing,wall,at,w,base+bottom,base+top,'#6b8188',depth,[[u+.006,v+.006],[u+.244,v+.006],[u+.244,v+.244],[u+.006,v+.244]]);
                  },
                };
                if(academic&&exposed){
                  drawCampusEnvelope(length,height-base,drawing,distance<100,!!university?.faces.some(f=>f.kind==='libraryStone'),!face||!['ribbon','frame','libraryStone','timber'].includes(face.kind),!observed);
                  campusFinishedWalls++;
                }
                if(face){
                  windows+=drawCampusFacade(face,length,height-base,drawing);
                  if(observed)campusFacades++;else campusEstimatedFacades++;
                }
              }
              continue;
            }
            if(profile){
              const ga=polygon[ringIndex][i],gb=polygon[ringIndex][i+1];
              const observed=ringIndex===0&&profile.observedWalls.some(edge=>matchesFacadeEdge(edge,ga,gb));
              if(!observed)continue; // Hidden faces have no invented windows or ornaments.
              const photoFace=profile.photoFaces.find(edge=>matchesFacadeEdge(edge,ga,gb));
              const projection=photoFace&&facadeReferences.projections[photoFace.projection],photoPath=projection?.image||facadeReferences.source.image;
              const photoReady=facadeTextures.has(photoPath);
              if(photoFace&&projection&&photoReady){
                const bottom=Math.max(base,base+photoFace.bottom),top=Math.min(height-.07,base+photoFace.top),columns=Math.ceil(length/.4),rows=Math.ceil((top-bottom)/.4);
                const vertex=(u:number,v:number)=>[a[0]+(b[0]-a[0])*u+normal[0]*.085,a[1]+(b[1]-a[1])*u+normal[1]*.085,bottom+(top-bottom)*v];
                for(let row=0;row<rows;row++)for(let col=0;col<columns;col++){
                  const points=[vertex(col/columns,row/rows),vertex((col+1)/columns,row/rows),vertex((col+1)/columns,(row+1)/rows),vertex(col/columns,(row+1)/rows)];
                  const uv=points.map(point=>facadePhotoUv(point,projection));
                  let target=photoFacades.get(photoPath);if(!target){target=batch();photoFacades.set(photoPath,target);}
                  quad(target,points[0],points[1],points[2],points[3],'#ffffff',1,uv);
                }
                facadePhotoFaces++;
              }
              if(profile.kind==='retail'){
                // Visible pale-blue upper storey, white ribbon frames and dark glazing.
                panel(details,wall,length/2,length,base+.18,base+3.25,'#344c51',.07);
                const bays=Math.max(1,Math.round(length/3.3)),spacing=length/bays;
                for(let k=0;k<bays;k++){
                  const at=(k+.5)*spacing;
                  panel(details,wall,at,Math.max(.3,spacing-.14),base+.35,base+3.15,'#527076',.085);
                  panel(details,wall,at,Math.max(.3,spacing-.25),base+4.4,base+6.2,'#d7ddd5',.065);
                  panel(details,wall,at,Math.max(.2,spacing-.42),base+4.52,base+6.06,'#596d70',.08);
                  panel(details,wall,at,.06,base+4.52,base+6.06,'#e0e5db',.095);windows++;
                }
                wallBox(details,wall,length/2,length,base+3.25,base+3.6,'#c8ccbd',.55);
                wallBox(details,wall,length/2,length,base+6.3,base+6.45,'#aec6ca',.12);
              }else if(profile.kind==='slab'&&profile.storefrontWalls?.some(edge=>matchesFacadeEdge(edge,ga,gb))){
                panel(details,wall,length/2,length,base+.2,base+3.1,'#40575d',.07);
                for(let at=1;at<length;at+=1.6)panel(details,wall,at,.09,base+.2,base+3.1,'#b6bdb4',.1);
                wallBox(details,wall,length/2,length,base+3.1,base+3.65,'#e4e0d2',.24);
              }
              // Loading/outage fallback follows observed modern bands, never the old ornament template.
              if(photoFace&&!photoReady){
                const levels=profile.kind==='tower'?10:4,start=profile.kind==='tower'?0:3.8,step=(height-base-start)/levels;
                for(let floor=0;floor<levels;floor++){
                  const z=base+start+floor*step;if(z<base+photoFace.bottom)continue;
                  panel(details,wall,length/2,length*.9,z+.25,z+step*.6,'#687577',.06);
                  panel(details,wall,length/2,length,z+step*.6,z+step-.07,profile.wallColor,.07);
                  if(profile.kind==='tower'&&length>18)for(const at of [1.1,length-1.1])panel(details,wall,at,1.3,z+.2,z+step*.6,'#c9ce55',.08);
                }
              }
              continue;
            }
            panel(details,wall,length/2,length,Math.max(base,height-.22),height+.08,'#d5c9b0',.12);
            if(distance>(options.walking?155:260)||length<2.5)continue;
            // Small masonry plinth and floor bands give depth without changing mapped walls.
            panel(details,wall,length/2,length,base+.05,base+.38,'#948b79',.055);
            const close=distance<85;
            if(close){
              wallBox(details,wall,length/2,length,height-.28,height-.12,'#887b65',.22);
              wallBox(details,wall,length/2,length+.12,height-.12,height+.1,'#dfd5c0',.34);
              // Alternating corner stones and storey string courses remain illustrative.
              for(let z=base+.45,course=0;z<height-.5;z+=.5,course++){
                const width=course%2?.32:.52;
                for(const at of [width/2,length-width/2])panel(details,wall,at,width,z,z+.46,'#d8ccaf',.065);
              }
              for(let z=base+3;z<height-.8;z+=3)wallBox(details,wall,length/2,length,z-.1,z+.05,'#c9bea7',.13);
            }
            const slots=Math.min(18,Math.floor(length/2.9)),spacing=length/(slots+1),floors=Math.min(12,Math.floor((height-base)/3));
            for(let floor=0;floor<floors;floor++){
              const bottom=base+.95+floor*3,top=Math.min(bottom+1.45,height-.45);if(top-bottom<.8)continue;
              for(let slot=1;slot<=slots;slot++){
                const at=spacing*slot,width=Math.min(1.15,spacing*.52);
                // Ground-floor middle bay becomes a door; upper bays have shutters and sills.
                if(floor===0&&slot===Math.ceil(slots/2)){
                  panel(details,wall,at,1.25,base+.1,base+2.45,'#dacdb8',.09);panel(details,wall,at,1.02,base+.12,base+2.28,'#584b3c',.12);panel(details,wall,at,.73,base+1.12,base+2.1,'#76949b',.14);
                  if(close){
                    wallBox(details,wall,at-.59,.12,base+.1,base+2.45,'#d5c9af',.24);
                    wallBox(details,wall,at+.59,.12,base+.1,base+2.45,'#d5c9af',.24);
                    wallBox(details,wall,at,1.3,base+2.32,base+2.48,'#d5c9af',.28);
                    wallBox(details,wall,at,1.35,base+.04,base+.13,'#a39987',.36);
                    panel(details,wall,at+.31,.045,base+.92,base+1.12,'#c4b583',.18);
                    for(const z of [base+.25,base+.62])panel(details,wall,at,.62,z,z+.25,'#433a31',.15);
                  }
                  continue;
                }
                panel(details,wall,at,width+.2,bottom-.12,top+.12,'#766f61',.065);
                const lit=options.mood==='night'&&(slot+floor+variant)%3!==0;
                panel(details,wall,at,width,bottom,top,lit?'#ffe1a0':['#354a53','#526773','#435b64','#687a80'][(slot+floor+variant)%4],.08);
                if(close){
                  panel(details,wall,at-width*.25,width*.42,bottom+.05,top-.05,lit?'#e9c487':'#879393',.09);
                  for(const edge of [-1,1])wallBox(details,wall,at+edge*(width/2+.055),.11,bottom-.1,top+.1,'#dfd6c2',.2);
                  wallBox(details,wall,at,width+.22,top,top+.12,'#e4dac5',.22);
                  wallBox(details,wall,at,width+.38,bottom-.2,bottom-.08,'#c8bea8',.36);
                }
                panel(details,wall,at,.055,bottom,top,'#e8e1d0',.13);panel(details,wall,at,width,(bottom+top)/2-.025,(bottom+top)/2+.025,'#e8e1d0',.13);
                panel(details,wall,at,width+.3,bottom-.19,bottom-.1,'#bab09c',.19);
                if(floor>0&&spacing>2.5){const shutter=shutterColors[variant%shutterColors.length];panel(details,wall,at-width*.5-.23,.34,bottom,top,shutter,.1);panel(details,wall,at+width*.5+.23,.34,bottom,top,shutter,.1);}
                windows++;
              }
            }
          }
        }
        if(profile?.manualFront){
          const front=profile.manualFront,a=local(front.a),b=local(front.b),length=Math.hypot(b[0]-a[0],b[1]-a[1]);
          const wall:Wall={a,b,length,normal:[-(b[1]-a[1])/length,(b[0]-a[0])/length],height,base,variant};
          // One continuous observed elevation spans small IGN footprint jogs.
          panel(referenceFacades,wall,length/2,length,base,height,profile.wallColor,.23);
          if(front.roof){
            const roof=front.roof;
            wallBox(details,wall,length/2,length,height-.12,height+roof.parapet,profile.wallColor,.29,.03);
            wallBox(details,wall,length/2,length+.12,height+roof.parapet,height+roof.parapet+.08,'#797e7b',.35,-.05);
            // Only the three stacks visible in the credited street reference.
            // Setbacks and sizes are photo estimates, not surveyed roof geometry.
            for(const stack of roof.stacks){
              const at=length*stack.at,back=-stack.setback-stack.depth,frontDepth=-stack.setback;
              wallBox(details,wall,at,stack.width,height,height+stack.height,stack.color,frontDepth,back);
              wallBox(details,wall,at,stack.width+.15,height+stack.height,height+stack.height+.12,'#777a75',frontDepth+.08,back-.08);
            }
          }
          for(let floor=0;floor<front.floors;floor++){
            const bottom=base+front.firstWindowBottom+floor*front.storeyHeight,top=bottom+1.75;
            panel(details,wall,length/2,length,bottom-.65,bottom-.5,'#ded8c6',.28);
            for(const bay of front.bays){
              const at=length*bay.at,w=bay.width;
              panel(details,wall,at,w+.18,bottom-.12,top+.12,'#aaa99f',.26);
              if(bay.kind==='balcony'){
                panel(details,wall,at,w,bottom,top,'#444b48',.28);
                panel(details,wall,at-.35,w*.45,bottom+.1,top-.1,'#bdbdad',.3);
                panel(details,wall,at+.55,.65,bottom+.18,top-.12,'#566569',.32);
                for(const edge of [-1,1])wallBox(details,wall,at+edge*(w/2+.06),.14,bottom-.12,top+.12,'#bfc1b7',.55,.25);
                wallBox(details,wall,at,w+.25,bottom-.15,bottom-.02,'#c9c8bc',.7,.25);
                // Solid lower balcony panel and projecting sill observed in the photo.
                wallBox(details,wall,at,w,bottom-.02,bottom+.48,profile.wallColor,.66,.48);
                for(const z of [bottom+.1,bottom+.78])panel(details,wall,at,w,z,z+.04,'#565d59',.67);
                for(let x=-w/2+.12;x<w/2;x+=.22)panel(details,wall,at+x,.035,bottom+.13,bottom+.8,'#646b65',.68);
              }else if(bay.kind==='shutter'&&!(bay.openTop&&floor===front.floors-1)){
                panel(details,wall,at,w,bottom,top,'#a5a69e',.28);
                for(let z=bottom+.08;z<top;z+=.12)panel(details,wall,at,w,z,z+.018,'#878d86',.3);
                wallBox(details,wall,at,w+.2,bottom-.16,bottom-.05,'#c1c1b5',.42,.25);
              }else{
                panel(details,wall,at,w,bottom,top,'#43595d',.28);
                panel(details,wall,at,.055,bottom,top,'#d3d5c9',.32);
                wallBox(details,wall,at,w+.16,bottom-.15,bottom-.04,'#c1c3b7',.4,.25);
              }
              windows++;
            }
          }
          for(const shop of front.shops){
            const at=length*shop.at,w=shop.width,text=shop.label;
            panel(details,wall,at,w,base+.2,base+3,'#3b5157',.27);
            for(let x=at-w/2+.2;x<at+w/2;x+=1.25)panel(details,wall,x,.075,base+.2,base+3,'#c4c7b9',.32);
            wallBox(details,wall,at,w+.2,base+2.95,base+3.6,'#e2ddcd',.48,.25);
            referenceSign(wall,at,w,text);
            if(shop.awning){
              const {projection,drop}=shop.awning,dx=(b[0]-a[0])/length,dy=(b[1]-a[1])/length;
              const point=(x:number,z:number,depth:number)=>[a[0]+dx*x+wall.normal[0]*depth,a[1]+dy*x+wall.normal[1]*depth,z];
              const left=at-w/2,right=at+w/2,top=base+3.04,lip=top-drop;
              quad(details,point(left,top,.5),point(right,top,.5),point(right,lip,projection),point(left,lip,projection),'#e2dbca');
              wallBox(details,wall,at,w,lip-.14,lip,'#bdb4a3',projection+.025,projection-.04);
              // Angled side cheeks and slim supporting arms, without invented logos.
              for(const x of [left,right]){
                triangle(details,point(x,top,.5),point(x,lip,projection),point(x,lip,.5),tint('#b8b1a2',.8));
                wallBox(details,wall,x,.045,lip-.03,lip+.02,'#535951',projection,.29);
              }
            }
          }
        }
    }
    // Signs use genuine mapped names; their facade placement and graphics are illustrative.
    const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=2048;const ctx=atlas.getContext('2d')!;
    let signCount=0;const used:{wall:Wall;at:number;width:number}[]=[];
    for(const poi of pois){
      if(signCount>=32)break;const point=local(poi.coordinates);
      let best:{wall:Wall;at:number;width:number;distance:number}|undefined;
      for(const wall of walls){
        if(wall.height-wall.base<4||wall.length<4)continue;
        const width=Math.min(5.8,Math.max(3.2,poi.name.length*.18),wall.length-.6);
        const dx=(wall.b[0]-wall.a[0])/wall.length,dy=(wall.b[1]-wall.a[1])/wall.length;
        const at=Math.max(width/2+.15,Math.min(wall.length-width/2-.15,(point[0]-wall.a[0])*dx+(point[1]-wall.a[1])*dy));
        const distance=Math.hypot(wall.a[0]+dx*at-point[0],wall.a[1]+dy*at-point[1]);
        if(distance>22||best&&distance>=best.distance||used.some(s=>s.wall===wall&&Math.abs(s.at-at)<(s.width+width)/2+.3))continue;
        best={wall,at,width,distance};
      }
      if(!best)continue;
      const {wall,at,width}=best;used.push(best);
      const col=signCount%4,row=Math.floor(signCount/4),x=col*512,y=row*256;
      ctx.fillStyle=poi.color;ctx.fillRect(x,y,512,256);ctx.strokeStyle='#ffffff88';ctx.lineWidth=3;ctx.strokeRect(x+12,y+12,488,232);
      ctx.fillStyle='#fff8e6';ctx.textAlign='center';ctx.textBaseline='middle';let size=44;ctx.font=`600 ${size}px sans-serif`;
      while(ctx.measureText(poi.name).width>466&&size>18){size-=2;ctx.font=`600 ${size}px sans-serif`;}
      ctx.fillText(poi.name,x+256,y+109,470);ctx.font='22px sans-serif';ctx.fillStyle='#ffffffc0';ctx.fillText(poi.category.toLocaleUpperCase('fr'),x+256,y+180);
      const u=col/4,v=1-(row+1)/8,uv=[[u,v],[u+.25,v],[u+.25,v+.125],[u,v+.125]];
      const base=wall.base;
      panel(signs,wall,at,width,base+2.55,base+3.65,'#ffffff',.24,uv);
      panel(details,wall,at,width,base+.12,base+2.5,poi.color,.14);
      panel(details,wall,at,width-.28,base+.35,base+2.35,'#426774',.17);
      panel(details,wall,at-.45,.09,base+.3,base+2.4,'#d8c7a6',.19);
      panel(details,wall,at+width*.3,.08,base+.3,base+2.4,'#d8c7a6',.19);
      panel(details,wall,at,width,base+2.38,base+2.52,'#e9dbc0',.31);
      signCount++;
    }
    mesh(terrain);mesh(facades,materialTexture('plaster'),true);
    for(const floor of [mesh(campusGround,materialTexture('asphalt'),true),mesh(asphalt,materialTexture('asphalt'),true),mesh(paving,materialTexture('paving'),true),mesh(groundAreas,materialTexture('asphalt'),campus)])if(floor)floor.castShadow=false;
    mesh(details,undefined,campus);mesh(roofs,roofTexture());
    const hardware=mesh(metal,undefined,true);if(hardware){const mat=hardware.material as MeshStandardMaterial;mat.metalness=.7;mat.roughness=.34;mat.envMapIntensity=.55;}
    const concrete=campusConcrete.positions.length?mesh(campusConcrete,concreteTexture(),true):undefined;
    physicalSurface(concrete,'campus-concrete',.009);
    if(campusRoofs.positions.length)physicalSurface(mesh(campusRoofs,concreteTexture(),true),'campus-concrete',.009);
    if(timber.positions.length)physicalSurface(mesh(timber,materialTexture('campus-timber-color'),true),'campus-timber',.004);
    const glazing=mesh(campusGlazing,surfaceTexture('windows'),true);
    const frames=mesh(campusFrames,undefined,true);
    if(frames){const material=frames.material as MeshStandardMaterial;material.metalness=.35;material.roughness=.46;material.envMapIntensity=.6;}
    if(glazing){
      const old=glazing.material as MeshStandardMaterial,glass=new MeshPhysicalMaterial({vertexColors:true,map:old.map,side:DoubleSide,metalness:.25,roughness:.18,envMap:environment?.texture||null,envMapIntensity:options.mood==='night'?.2:.8,clearcoat:1,clearcoatRoughness:.12});
      glass.envMapRotation.copy(scene.environmentRotation);orientPhysicalMaterial(glass);glazing.material=glass;glazing.castShadow=false;glazing.receiveShadow=false;resources.push(glass);old.dispose();
    }
    const foliageMesh=mesh(foliage,leafTexture(),true);
    if(foliageMesh){const mat=foliageMesh.material as MeshStandardMaterial;mat.alphaTest=.22;mat.alphaToCoverage=true;mat.roughness=.8;mat.needsUpdate=true;}
    if(campusPaving.positions.length){const floor=mesh(campusPaving,campusSlabTexture(),true);if(floor){floor.castShadow=false;physicalSurface(floor,'campus-paving',.018);}}
    mesh(referenceFacades);for(const [path,data]of photoFacades)mesh(data,facadeTextures.get(path));
    // The separate town-centre GLB disables frustum culling internally. Drawing
    // all of it 1.6 km away was still costing draw calls on every campus frame.
    if(cityModel&&!campus){cityModel.group.scale.set(1,1,options.scale);scene.add(cityModel.group);}
    if((photoRoofs.positions.length||photoTerrain.positions.length)&&photoImage){
      if(roofImageTexture?.userData.image!==photoImage){
        roofImageTexture?.dispose();const canvas=document.createElement('canvas');canvas.width=canvas.height=2048;canvas.getContext('2d')!.drawImage(photoImage,0,0);
        roofImageTexture=new CanvasTexture(canvas);roofImageTexture.colorSpace=SRGBColorSpace;roofImageTexture.userData.image=photoImage;
        roofImageTexture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
      }
      mesh(photoRoofs,roofImageTexture);
      mesh(photoTerrain,roofImageTexture);
    }
    if(signCount){const texture=new CanvasTexture(atlas);texture.colorSpace=SRGBColorSpace;resources.push(texture);mesh(signs,texture);}
    renderer.shadowMap.needsUpdate=true;
    let street='',closest=Infinity;const position=local(center);
    for(const feature of map.querySourceFeatures('openmaptiles',{sourceLayer:'transportation_name'})){
      const name=feature.properties?.['name:fr']||feature.properties?.name;if(!name)continue;
      const g=feature.geometry,lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];
      for(const line of lines)for(let i=1;i<line.length;i++){
        const a=local(line[i-1]),b=local(line[i]),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;if(!length)continue;
        const t=Math.max(0,Math.min(1,((position[0]-a[0])*dx+(position[1]-a[1])*dy)/length));
        const d=Math.hypot(position[0]-a[0]-t*dx,position[1]-a[1]-t*dy);
        if(d<closest&&d<65){closest=d;street=String(name);}
      }
    }
    onStatus({buildings:count,windows,signs:signCount,pois,street,photoRoofTriangles:photoRoofs.positions.length/9,photoGroundTriangles:photoTerrain.positions.length/9,campusGroundTriangles:campusGround.positions.length/9,routeSegments,modelMeshes:!campus&&cityModel?cityModel.group.children.length:0,referenceBuildings,facadePhotoFaces,facadePhotoFailed:failedFacadeImages.size>0,campusBuildings,campus,campusFacades,campusFinishedWalls,campusEstimatedFacades,campusReferenceBuildings,campusEnvironment:campus&&!!environment,campusFixtures:campus?CAMPUS_COURTYARD.fixtures.length:0,campusShadowResolution:campus&&sun.castShadow?sun.shadow.mapSize.width:0});map.triggerRepaint();
  }
  function schedule(){if(!timer&&!disposed)timer=setTimeout(rebuild,450);}
  const layer:CustomLayerInterface={
    id:ID,type:'custom',renderingMode:'3d',
    onAdd(_map,gl){renderer=new WebGLRenderer({canvas:map.getCanvas(),context:gl as WebGL2RenderingContext});renderer.autoClear=false;renderer.shadowMap.enabled=true;renderer.shadowMap.type=PCFShadowMap;renderer.shadowMap.autoUpdate=false;
      const shadows=renderer.shadowMap,shadowPass=shadows.render.bind(shadows);
      shadows.render=(lights,s,c)=>{if(!shadows.enabled||(!shadows.autoUpdate&&!shadows.needsUpdate))return;withShadowDepthRange(gl as WebGL2RenderingContext,()=>shadowPass(lights,s,c));};
      new HDRLoader().loadAsync('/materials/kloofendal_48d_partly_cloudy_1k.hdr').then(texture=>{if(disposed){texture.dispose();return;}pendingHDR=texture;map.triggerRepaint();}).catch(()=>{/* Daylight shading remains available if the optional lighting asset fails. */});
      schedule();loadCityModel().then(model=>{if(disposed){model?.dispose();return;}cityModel=model;force=true;schedule();}).catch(()=>{/* Keep the procedural street fallback when an asset fails. */});},
    render(_gl,args){
      if(!renderer||!options.dimensional||map.getZoom()<15.5)return;
      const gl=_gl as WebGL2RenderingContext,framebuffer=gl.getParameter(gl.FRAMEBUFFER_BINDING) as WebGLFramebuffer|null,viewport=gl.getParameter(gl.VIEWPORT) as Int32Array;
      if(pendingHDR){
        renderer.resetState();const generator=new PMREMGenerator(renderer);environment=generator.fromEquirectangular(pendingHDR);generator.dispose();
        skyHDR=pendingHDR;pendingHDR=undefined;
        // Only the sky hemisphere: never replace distant mapped ground/buildings
        // with the HDR location's photographed landscape.
        const geometry=campusSkyGeometry();
        sky=new Mesh(geometry,new MeshBasicMaterial({map:skyHDR,side:DoubleSide,depthWrite:false}));sky.frustumCulled=false;sky.renderOrder=-100;
        force=true;schedule();renderer.resetState();
      }
      let eye:Vector3;
      if(options.walking&&walkPosition){const p=local(walkPosition);eye=new Vector3(p[0],p[1],walkEye??(terrainHeight(...walkPosition)||0)+WALK_EYE_HEIGHT);}
      else{
        const c=map.getCenter(),p=local([c.lng,c.lat]),pitch=map.getPitch()*Math.PI/180,bearing=map.getBearing()*Math.PI/180;
        const distance=.5*map.getCanvas().clientHeight/Math.tan(map.getVerticalFieldOfView()*Math.PI/360)*40075016.6856*Math.cos(c.lat*Math.PI/180)/(512*2**map.getZoom());
        eye=new Vector3(p[0]-Math.sin(bearing)*distance*Math.sin(pitch),p[1]-Math.cos(bearing)*distance*Math.sin(pitch),map.getCameraTargetElevation()+distance*Math.cos(pitch));
      }
      camera.position.copy(eye);camera.updateMatrixWorld(true);sky?.position.copy(eye);
      // Preserve clip coordinates while supplying physical shaders a real eye:
      // (MapLibre VP * world * cameraWorld) * cameraView.
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform).multiply(camera.matrixWorld);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      renderer.toneMapping=campusLighting?ACESFilmicToneMapping:NoToneMapping;renderer.toneMappingExposure=.95;
      renderer.resetState();
      sharedTarget.setSize(map.getCanvas().width,map.getCanvas().height);sharedTarget.viewport.set(viewport[0],viewport[1],viewport[2],viewport[3]);
      (renderer as SharedFramebufferRenderer).setRenderTargetFramebuffer(sharedTarget,framebuffer);renderer.setRenderTarget(sharedTarget);
      renderer.render(scene,camera);renderer.resetState();gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.viewport(viewport[0],viewport[1],viewport[2],viewport[3]);
    },
    onRemove(){
      disposed=true;environment?.dispose();pendingHDR?.dispose();skyHDR?.dispose();sky?.geometry.dispose();sky?.material.dispose();
      if(renderer)(renderer as SharedFramebufferRenderer).setRenderTargetFramebuffer(sharedTarget,null);sharedTarget.dispose();
      if(timer)clearTimeout(timer);if(pendingImage){pendingImage.onload=null;pendingImage.onerror=null;pendingImage.src='';}
      for(const image of facadeImages.values()){image.onload=null;image.onerror=null;image.src='';}
      facadeImages.clear();facadeTextures.forEach(t=>t.dispose());facadeTextures.clear();photoImage=undefined;roofImageTexture?.dispose();materials.forEach(t=>t.dispose());cityModel?.dispose();
      map.off('moveend',schedule);map.off('sourcedata',source);map.off('citysense-walk-position',locate);clear();renderer?.dispose();
    }
  };
  function source(event:{sourceId?:string;isSourceLoaded?:boolean}){
    if(event.sourceId==='openmaptiles'&&event.isSourceLoaded)schedule();
  }
  const layers=map.getStyle().layers;
  const lastBuilding=layers.findLastIndex(l=>l.type==='fill-extrusion');
  const firstSymbol=layers.slice(lastBuilding+1).find(l=>l.type==='symbol')?.id;
  map.addLayer(layer,firstSymbol);map.on('moveend',schedule);map.on('sourcedata',source);map.on('citysense-walk-position',locate);
  return {
    update(next:DetailOptions){if(JSON.stringify(options)===JSON.stringify(next))return;options=next;force=true;schedule();map.triggerRepaint();},
    dispose(){if(disposed)return;if(map.getLayer(ID))map.removeLayer(ID);}
  };
}
