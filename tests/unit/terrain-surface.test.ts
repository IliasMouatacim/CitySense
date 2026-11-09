import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drapeSurface} from '../../apps/web/lib/terrain-surface';
import {terrainHeight,type CityWorld} from '../../apps/web/lib/city-world';

test('ground overlays follow every terrain cell and diagonal, including between vertices',()=>{
 const tile={bounds:[0,0,2,2],size:3,datum:10,heights:[10,14,12,18,11,21,13,19,15]};
 const data={...tile} as CityWorld,lift=.075;
 const triangles=drapeSurface([[.1,.2],[1.9,.2],[1.9,1.8],[.1,1.8]],tile,tile.datum,lift);
 let area=0;
 assert.ok(triangles.length>8);
 for(const [a,b,c] of triangles){
  area+=Math.abs((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]))/2;
  for(const weights of [[1,0,0],[0,1,0],[0,0,1],[.5,.5,0],[.25,.25,.5],[1/3,1/3,1/3]]){
   const p=[0,1,2].map(i=>a[i]*weights[0]+b[i]*weights[1]+c[i]*weights[2]);
   assert.ok(Math.abs(p[2]-terrainHeight(p[0],p[1],data)!-lift)<1e-8,'No floating or buried midpoint');
  }
 }
 assert.ok(Math.abs(area-1.8*1.6)<1e-8,'Clipping must not create gaps or duplicate area');
 assert.deepEqual(drapeSurface([[3,3],[4,3],[4,4]],tile,10,lift),[]);
});
