import test from 'node:test';
import assert from 'node:assert/strict';
import {thinQuadSpans} from '../../apps/web/lib/thin-quads';
const cross=(a:number[],b:number[])=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=(p:number[][])=>cross(p[1].map((v,i)=>v-p[0][i]),p[3].map((v,i)=>v-p[0][i]));
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('thin quad subdivision preserves area, winding and continuous UVs in both directions',()=>{
 const base=[[0,0,2],[30,10,2],[30,10.1,2],[0,.1,2]],uv=[[0,0],[7.5,0],[7.5,.4],[0,.4]];
 for(const order of [[0,1,2,3],[0,3,2,1],[1,2,3,0]]){
  const p=order.map(i=>base[i]),t=order.map(i=>uv[i]),faces=thinQuadSpans(p,t),n=normal(p);
  assert.ok(faces.length>1&&faces.length<=64);
  const total=faces.reduce((sum,f)=>sum+Math.hypot(...normal(f.points)),0);close(total,Math.hypot(...n));
  for(const f of faces){
   assert.ok(normal(f.points).reduce((sum,v,i)=>sum+v*n[i],0)>0);
   for(let i=0;i<4;i++){
    const [x,y,z]=f.points[i];close(z,2);close(f.uv![i][0],x/4);close(f.uv![i][1],(y-x/3)*4);
   }
  }
  for(let i=1;i<faces.length;i++)assert.equal(faces[i-1].points.filter(a=>faces[i].points.some(b=>a.every((v,j)=>Math.abs(v-b[j])<1e-8))).length,2);
 }
});
test('ordinary quads retain their vertices and extreme strips have bounded subdivision',()=>{
 const p=[[0,0,0],[2,0,0],[2,1,0],[0,1,0]];
 assert.equal(thinQuadSpans(p)[0].points,p);
 assert.equal(thinQuadSpans([[0,0,0],[100,0,0],[100,.0001,0],[0,.0001,0]]).length,64);
 assert.equal(thinQuadSpans([[0,0,0],[0,0,0],[0,1,0],[0,1,0]]).length,1);
});
