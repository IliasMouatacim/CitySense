import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readCityPois,mappedHeight,stableVariant,nearbyFootprints,outwardUv,outwardWallOrder} from '../../apps/web/lib/city-details-data.ts';
const point=(id,properties,coordinates=[6.8,47.51])=>({id,properties,geometry:{type:'Point',coordinates}});
test('only named mapped places become signs, with French names and duplicate tile suppression',()=>{
 const cafe=point(1,{name:'Coffee','name:fr':'Café de la place',class:'cafe'});
 const pois=readCityPois([cafe,cafe,point(2,{class:'shop'}),point(3,{name:'Bus',class:'bus'}),point(4,{name:'Loin',class:'shop'},[7,48]),point(5,{name:'Épicerie',class:'shop',subclass:'convenience'})],[6.8,47.51]);
 assert.equal(pois.length,2);assert.equal(pois[0].name,'Café de la place');assert.equal(pois[0].category,'Café');assert.equal(pois[1].category,'Épicerie');assert.equal(pois[0].distance,0);
});
test('mapped heights and fallback details stay deterministic',()=>{
 assert.deepEqual(mappedHeight({render_height:12,render_min_height:3}),{height:12,base:3});
 assert.deepEqual(mappedHeight({render_height:'invalid',render_min_height:-1}),{height:8,base:0});
 const ring=[[6.8,47.5],[6.801,47.5],[6.801,47.501]];
 assert.equal(stableVariant(42,ring),stableVariant(42,[...ring].reverse()));
 assert.notEqual(stableVariant(42,ring),stableVariant(43,ring));
});

test('merged tile buildings are culled per footprint, including nearby polygons after a distant one',()=>{
 const far=[[7,48],[7.001,48],[7.001,48.001],[7,48]];
 const near=[[6.8,47.51],[6.8001,47.51],[6.8001,47.5101],[6.8,47.51]];
 const merged={id:0,properties:{render_height:8},geometry:{type:'MultiPolygon',coordinates:[[far],[near]]}};
 const result=nearbyFootprints([merged,merged],[6.8,47.51],240);
 assert.equal(result.length,1);assert.deepEqual(result[0].polygon,[near]);
});
test('store lettering faces outwards for both polygon windings',()=>{
 const uv=[[0,0],[1,0],[1,1],[0,1]];
 assert.deepEqual(outwardUv(uv,1,0,[0,-1]),uv);
 assert.deepEqual(outwardUv(uv,1,0,[0,1]),[[1,0],[0,0],[0,1],[1,1]]);
});


test('wall and trim normals point outwards for either ring winding, with UV vertices preserved',()=>{
 const cross=(a,b,c)=>{const u=b.map((n,i)=>n-a[i]),v=c.map((n,i)=>n-a[i]);return [u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];};
 for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1],[.6,.8]])for(const sign of [-1,1]){
  const normal=[dy*sign,-dx*sign],order=outwardWallOrder(dx,dy,normal);
  const wall=[[0,0,0],[dx,dy,0],[dx,dy,2],[0,0,2]];
  const oriented=order.map(i=>wall[i]),n=cross(...oriented.slice(0,3));
  assert.ok(n[0]*normal[0]+n[1]*normal[1]>0,'Normal must face outside before shadow bias is applied');
  const cap=[[0,0,2],[dx,dy,2],[dx-normal[0]*.1,dy-normal[1]*.1,2],[-normal[0]*.1,-normal[1]*.1,2]];
  assert.ok(cross(...order.map(i=>cap[i]).slice(0,3))[2]>0,'Trim top must face up');
  const uv=outwardUv([[0,0],[1,0],[1,1],[0,1]],dx,dy,normal);
  const paired=order.map(i=>({point:wall[i],uv:uv[i]}));
  for(let i=0;i<4;i++)assert.deepEqual(paired.find(p=>p.point===wall[i]).uv,uv[i]);
 }
});
