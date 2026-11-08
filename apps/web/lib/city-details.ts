import {MercatorCoordinate,type Map as CityMap,type CustomLayerInterface} from 'maplibre-gl';
import {BufferGeometry,Float32BufferAttribute,Mesh,MeshBasicMaterial,MeshStandardMaterial,AmbientLight,DirectionalLight,TextureLoader,type Texture,Scene,Camera,WebGLRenderer,Matrix4,Color,Vector3,DoubleSide,CanvasTexture,SRGBColorSpace,RepeatWrapping,ShapeUtils,Vector2} from 'three';
import {readCityPois,mappedHeight,stableVariant,metersBetween,nearbyFootprints,outwardUv,type CityPoi} from './city-details-data';
import type {SceneMood} from './city-scene';
import {roofPhotoRequest} from './photo-city';
import {cityBuildingFeatures,getCityWorld,terrainHeight} from './city-world';
import {loadCityModel} from './city-model';

export type DetailOptions={mood:SceneMood;scale:number;enabled:boolean;dimensional:boolean;walking:boolean;photo:boolean;routeCoordinates?:number[][]};
export type DetailStatus={buildings:number;windows:number;signs:number;pois:CityPoi[];street:string;photoRoofTriangles?:number;routeSegments?:number;modelMeshes?:number};
type Point=[number,number];
type Wall={a:Point;b:Point;normal:Point;length:number;height:number;base:number;variant:number};
type Batch={positions:number[];colors:number[];uvs:number[]};
const ID='citysense-architecture';
const origin=MercatorCoordinate.fromLngLat([6.8,47.51]);
const unit=origin.meterInMercatorCoordinateUnits();
const local=(p:number[]):Point=>{const c=MercatorCoordinate.fromLngLat([p[0],p[1]]);return [(c.x-origin.x)/unit,(origin.y-c.y)/unit];};
const batch=():Batch=>({positions:[],colors:[],uvs:[]});
const roofColors=['#ae6d50','#8f5848','#7c5550','#687880','#b57c5e'];
const shutterColors=['#52695c','#526b7a','#80574a','#64756f','#6c6575'];

/** A bounded, shared-depth mesh layer; no per-frame tile decoding or geometry allocation. */
export function createCityDetails(map:CityMap,initial:DetailOptions,onStatus:(value:DetailStatus)=>void) {
  let options=initial,disposed=false,timer:ReturnType<typeof setTimeout>|undefined;
  let lastCenter:[number,number]|undefined,walkPosition:[number,number]|undefined,lastKey='',force=true;
  function locate(event:{coordinates?:[number,number]}){if(event.coordinates?.every(Number.isFinite))walkPosition=event.coordinates;}
  let renderer:WebGLRenderer|undefined;
  let cityModel:Awaited<ReturnType<typeof loadCityModel>>;
  const scene=new Scene(),camera=new Camera();
  const transform=new Matrix4().makeTranslation(origin.x,origin.y,0).scale(new Vector3(unit,-unit,unit));
  const color=new Color();
  const resources:{dispose:()=>void}[]=[];
  const materials=new Map<string,Texture>();
  function materialTexture(name:string){
    if(materials.has(name))return materials.get(name)!;
    const texture=new TextureLoader().load(`/materials/${name}.jpg`,()=>{if(disposed){texture.dispose();return;}force=true;schedule();});
    texture.wrapS=texture.wrapT=RepeatWrapping;texture.colorSpace=SRGBColorSpace;texture.anisotropy=renderer?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;materials.set(name,texture);return texture;
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
  function wallBox(target:Batch,wall:Wall,along:number,width:number,bottom:number,top:number,hex:string,front:number,back=.03){
    const dx=(wall.b[0]-wall.a[0])/wall.length,dy=(wall.b[1]-wall.a[1])/wall.length;
    const point=(at:number,z:number,depth:number)=>[wall.a[0]+dx*at+wall.normal[0]*depth,wall.a[1]+dy*at+wall.normal[1]*depth,z];
    const l=along-width/2,r=along+width/2;
    const a=point(l,bottom,front),b=point(r,bottom,front),c=point(r,top,front),d=point(l,top,front);
    const e=point(l,bottom,back),f=point(r,bottom,back),g=point(r,top,back),h=point(l,top,back);
    quad(target,a,b,c,d,hex,.92);quad(target,e,a,d,h,hex,.64);quad(target,b,f,g,c,hex,.72);
    quad(target,d,c,g,h,hex,1);quad(target,e,f,b,a,hex,.5);
  }
  function mesh(data:Batch,texture?:Texture,physical=false){
    if(!data.positions.length)return;
    const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(data.positions,3));geometry.setAttribute('color',new Float32BufferAttribute(data.colors,3));
    if(texture)geometry.setAttribute('uv',new Float32BufferAttribute(data.uvs,2));
    geometry.computeVertexNormals();
    const material=physical?new MeshStandardMaterial({vertexColors:true,side:DoubleSide,map:texture||null,roughness:.95,metalness:0}):new MeshBasicMaterial({vertexColors:true,side:DoubleSide,map:texture||null});
    const object=new Mesh(geometry,material);object.frustumCulled=false;scene.add(object);resources.push(geometry,material);
  }
  function roofTexture(){
    const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,128,128);ctx.strokeStyle='#00000032';ctx.lineWidth=2;
    for(let y=0;y<=128;y+=32){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(128,y);ctx.stroke();for(let x=(y%64?16:0);x<=128;x+=32){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+32);ctx.stroke();}}
    const texture=new CanvasTexture(canvas);texture.colorSpace=SRGBColorSpace;texture.wrapS=texture.wrapT=RepeatWrapping;resources.push(texture);return texture;
  }
  function rebuild(){
    timer=undefined;if(disposed||!renderer)return;
    const center:[number,number]=options.walking&&walkPosition?walkPosition:[map.getCenter().lng,map.getCenter().lat];
    if(options.dimensional&&map.getZoom()>=15.5)requestPhoto(center);
    const pois=readCityPois(map.querySourceFeatures('openmaptiles',{sourceLayer:'poi'}),center);
    if(!options.dimensional||map.getZoom()<15.5){if(scene.children.length)clear();lastCenter=undefined;onStatus({buildings:0,windows:0,signs:0,pois,street:''});return;}
    const features=cityBuildingFeatures(map);
    const key=features.map(f=>f.id).join(',')+'|'+pois.map(p=>p.id).sort().join(',');
    if(!force&&lastCenter&&metersBetween(center,lastCenter)<30&&key===lastKey)return;
    force=false;lastCenter=center;lastKey=key;clear();
    const walls:Wall[]=[],details=batch(),facades=batch(),asphalt=batch(),paving=batch(),roofs=batch(),photoRoofs=batch(),photoTerrain=batch(),terrain=batch(),signs=batch();let count=0,windows=0;
    const city=getCityWorld();
    scene.add(new AmbientLight(options.mood==='night'?'#9db5d0':'#fff4dd',1.05));const sun=new DirectionalLight('#fff5df',1.5);sun.position.set(-100,-100,300);scene.add(sun);
    if(city?.streets&&!cityModel){
      for(const road of city.streets.roads){
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
            quad(target,[...points[0],za+bottom],[...points[1],zb+bottom],[...points[2],zb+bottom],[...points[3],za+bottom],color,1,[[along/2,0],[(along+length)/2,0],[(along+length)/2,span/2],[along/2,span/2]]);
          }
          strip(pedestrian?paving:asphalt,0,width,pedestrian?'#c4bfb2':'#aaa9a4');
          const sidewalk=tags.sidewalk;
          if(['yes','both','left'].includes(sidewalk))strip(paving,width/2+.8,1.6,'#c9c4b6',.19);
          if(['yes','both','right'].includes(sidewalk))strip(paving,-width/2-.8,1.6,'#c9c4b6',.19);
          if(lanes>=2&&!pedestrian&&Math.floor(along/6)%2===0){const q=a,r=b,za=(terrainHeight(...pa)??0)+.09,zb=(terrainHeight(...pb)??0)+.09;quad(details,[q[0]-dy*.055,q[1]+dx*.055,za],[r[0]-dy*.055,r[1]+dx*.055,zb],[r[0]+dy*.055,r[1]-dx*.055,zb],[q[0]+dy*.055,q[1]-dx*.055,za],'#e8e4cf');}
          along+=length;
        }
      }
      for(const object of city.streets.objects){
        if(metersBetween(center,object.coordinates)>260)continue;const p=local(object.coordinates),ground=terrainHeight(...object.coordinates)??NaN;if(!Number.isFinite(ground))continue;
        function box(x:number,y:number,z:number,w:number,d:number,h:number,color:string){const a=[p[0]+x-w/2,p[1]+y-d/2,ground+z],b=[a[0]+w,a[1],a[2]],c=[a[0]+w,a[1]+d,a[2]],e=[a[0],a[1]+d,a[2]],top=(v:number[])=>[v[0],v[1],v[2]+h];quad(details,a,b,top(b),top(a),color);quad(details,b,c,top(c),top(b),color);quad(details,c,e,top(e),top(c),color);quad(details,e,a,top(a),top(e),color);quad(details,top(a),top(b),top(c),top(e),color);}
        if(object.tags.natural==='tree'){
          const height=Math.max(3,Math.min(18,Number.parseFloat(object.tags.height||'')||7));box(0,0,0,.25,.25,height*.7,'#77634b');
          const rgb=tint('#55754b');for(let i=0;i<10;i++){const a=i*Math.PI/5,b=(i+1)*Math.PI/5,r=height*.25;triangle(details,[p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r,ground+height*.45],[p[0]+Math.cos(b)*r,p[1]+Math.sin(b)*r,ground+height*.45],[p[0],p[1],ground+height],rgb);}
        }else if(object.tags.highway==='street_lamp'){box(0,0,0,.12,.12,5,'#5b6465');box(.4,0,4.9,.9,.22,.12,'#444d50');box(.7,0,4.8,.4,.3,.12,options.mood==='night'?'#ffe9a6':'#bec7bf');}
        else if(object.tags.amenity==='bench'){box(0,0,.4,1.6,.5,.1,'#93704e');box(0,.22,.5,1.6,.08,.55,'#93704e');box(-.55,0,0,.08,.45,.4,'#525b55');box(.55,0,0,.08,.45,.4,'#525b55');}
      }
    }
    const routeCoordinates=options.routeCoordinates||[];let routeSegments=0;
    for(let i=1;i<routeCoordinates.length;i++){
      const a=routeCoordinates[i-1],b=routeCoordinates[i],parts=Math.max(1,Math.ceil(metersBetween(a,b)/5));
      for(let part=0;part<parts;part++){
        const pa=[a[0]+(b[0]-a[0])*part/parts,a[1]+(b[1]-a[1])*part/parts],pb=[a[0]+(b[0]-a[0])*(part+1)/parts,a[1]+(b[1]-a[1])*(part+1)/parts],qa=local(pa),qb=local(pb),za=terrainHeight(pa[0],pa[1]),zb=terrainHeight(pb[0],pb[1]);if(za===null||zb===null)continue;
        const length=Math.hypot(qb[0]-qa[0],qb[1]-qa[1]);if(length<.05)continue;const nx=-(qb[1]-qa[1])/length,ny=(qb[0]-qa[0])/length;
        for(const [width,color,height] of [[1.1,'#fff9e9',.28],[.7,options.mood==='night'?'#6ae8cb':'#087c70',.3]] as const)quad(details,[qa[0]+nx*width,qa[1]+ny*width,za+height],[qb[0]+nx*width,qb[1]+ny*width,zb+height],[qb[0]-nx*width,qb[1]-ny*width,zb+height],[qa[0]-nx*width,qa[1]-ny*width,za+height],color);
        routeSegments++;
      }
    }
    if(city){
      const [w,s,e,n]=city.bounds,grid:number[][]=[];
      for(let y=0;y<city.size;y++)for(let x=0;x<city.size;x++){const lon=w+x/(city.size-1)*(e-w),lat=s+y/(city.size-1)*(n-s);grid.push([...local([lon,lat]),terrainHeight(lon,lat)!]);}
      for(let y=0;y<city.size-1;y++)for(let x=0;x<city.size-1;x++){
        const a=y*city.size+x,b=a+1,c=a+city.size,d=c+1;
        for(const indices of [[a,b,c],[b,d,c]]){const points=indices.map(i=>grid[i]);const uv=photoBounds?points.map(p=>[(origin.x+p[0]*unit-photoBounds!.west)/(photoBounds!.east-photoBounds!.west),1-(origin.y-p[1]*unit-photoBounds!.north)/(photoBounds!.south-photoBounds!.north)]):[];
          if(options.photo&&photoImage&&uv.length&&uv.every(p=>p.every(v=>v>=0&&v<=1)))triangle(photoTerrain,points[0],points[1],points[2],tint('#ffffff'),uv);
          else triangle(terrain,points[0],points[1],points[2],tint('#777970'));
        }
      }
    }
    // OpenMapTiles can merge hundreds of equal-height buildings into one MultiPolygon.
    // Cull and deduplicate individual footprints, never the feature's first polygon.
    const footprints=nearbyFootprints(features,center,options.walking?240:420);
    for(const {feature,polygon,distance} of footprints){
        if(!options.enabled)break;
        if(count>=(options.walking?100:160))break;
        const p=feature.properties||{};if(p.hide_3d)continue;
        const {height,base}=mappedHeight(p);if(height<=base)continue;
        const rings=polygon.map(r=>r.slice(0,-1).map(local)).filter(r=>r.length>=3);if(!rings.length||rings[0].length>100)continue;
        const variant=stableVariant(undefined,polygon[0]);count++;
        const facade=typeof p.colour==='string'&&/^#[0-9a-f]{6}$/i.test(p.colour)?p.colour:['#e1c5a4','#e8d9b8','#c9b4a8','#d6b6a1','#d1d2bb','#d7bc83','#bdd0c6','#d5c8bb'][variant%8];
        const outer=rings[0].map(p=>new Vector2(...p)),holes=rings.slice(1).map(r=>r.map(p=>new Vector2(...p)));
        const vertices=rings.flat();const roofColor=roofColors[variant%roofColors.length];
        for(const indices of ShapeUtils.triangulateShape(outer,holes)){
          const points=indices.map(i=>[...vertices[i],height+.045]);
          const uv=photoBounds?points.map(p=>[(origin.x+p[0]*unit-photoBounds!.west)/(photoBounds!.east-photoBounds!.west),1-(origin.y-p[1]*unit-photoBounds!.north)/(photoBounds!.south-photoBounds!.north)]):[];
          if(options.photo&&photoImage&&uv.length&&uv.every(p=>p.every(v=>v>=0&&v<=1)))triangle(photoRoofs,points[0],points[1],points[2],tint('#ffffff'),uv);
          else triangle(roofs,points[0],points[1],points[2],tint(roofColor),points.map(p=>[p[0]/2,p[1]/2]));
        }
        for(const [ringIndex,ring] of rings.entries()){
          const area=ring.reduce((s,a,i)=>{const b=ring[(i+1)%ring.length];return s+a[0]*b[1]-b[0]*a[1];},0);
          for(let i=0;i<ring.length;i++){
            const a=ring[i],b=ring[(i+1)%ring.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(length<.5)continue;
            const flip=(area>0?1:-1)*(ringIndex===0?1:-1);
            const normal:Point=[(b[1]-a[1])/length*flip,-(b[0]-a[0])/length*flip];
            const wall:Wall={a,b,normal,length,height,base,variant};if(ringIndex===0)walls.push(wall);
            panel(facades,wall,length/2,length,base,height,facade,.025,[[0,0],[length/2,0],[length/2,(height-base)/2],[0,(height-base)/2]]);
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
    mesh(terrain);mesh(facades,materialTexture('plaster'),true);mesh(asphalt,materialTexture('asphalt'),true);mesh(paving,materialTexture('paving'),true);mesh(details);mesh(roofs,roofTexture());
    if(cityModel){cityModel.group.scale.set(1,1,options.scale);scene.add(cityModel.group);}
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
    onStatus({buildings:count,windows,signs:signCount,pois,street,photoRoofTriangles:photoRoofs.positions.length/9,routeSegments,modelMeshes:cityModel?.group.children.length||0});map.triggerRepaint();
  }
  function schedule(){if(!timer&&!disposed)timer=setTimeout(rebuild,450);}
  const layer:CustomLayerInterface={
    id:ID,type:'custom',renderingMode:'3d',
    onAdd(_map,gl){renderer=new WebGLRenderer({canvas:map.getCanvas(),context:gl as WebGL2RenderingContext});renderer.autoClear=false;schedule();loadCityModel().then(model=>{if(disposed){model?.dispose();return;}cityModel=model;force=true;schedule();}).catch(()=>{/* Keep the procedural street fallback when an asset fails. */});},
    render(_gl,args){
      if(!renderer||!options.dimensional||map.getZoom()<15.5)return;
      camera.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(transform);
      renderer.resetState();renderer.render(scene,camera);renderer.resetState();
    },
    onRemove(){disposed=true;if(timer)clearTimeout(timer);if(pendingImage){pendingImage.onload=null;pendingImage.onerror=null;pendingImage.src='';}photoImage=undefined;roofImageTexture?.dispose();materials.forEach(t=>t.dispose());cityModel?.dispose();map.off('moveend',schedule);map.off('sourcedata',source);map.off('citysense-walk-position',locate);clear();renderer?.dispose();}
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
