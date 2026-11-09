import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withShadowDepthRange} from '../../apps/web/lib/render-depth';

test('shadow passes use full depth and restore MapLibre depth even when drawing fails',()=>{
 for(const fail of [false,true]){
  let current:[number,number]=[0,.99981],drawn=false;
  const gl={DEPTH_RANGE:2928,getParameter:()=>current,depthRange:(near:number,far:number)=>{current=[near,far];}};
  const draw=()=>withShadowDepthRange(gl,()=>{drawn=true;assert.deepEqual(current,[0,1]);if(fail)throw Error('draw failed');});
  if(fail)assert.throws(draw,/draw failed/);else draw();
  assert.ok(drawn);assert.deepEqual(current,[0,.99981]);
 }
});
