import {test} from 'node:test';
import assert from 'node:assert/strict';
import {campusSkyGeometry} from '../../apps/web/lib/campus-sky';

test('the sky dome stays above the eye and samples zenith at its pole, never the HDR landscape',()=>{
 const geometry=campusSkyGeometry(),position=geometry.getAttribute('position'),uv=geometry.getAttribute('uv');
 let pole=false,rim=false;
 for(let i=0;i<position.count;i++){
  const z=position.getZ(i),v=uv.getY(i);assert.ok(z>=-.001);assert.ok(v>=.5599&&v<=1);
  if(z>699.9){assert.ok(Math.abs(v-1)<1e-5);pole=true;}
  if(z<.001){assert.ok(Math.abs(v-.56)<1e-5);rim=true;}
 }
 assert.ok(pole&&rim);geometry.dispose();
});
