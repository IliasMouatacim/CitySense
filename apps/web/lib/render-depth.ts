/** MapLibre reserves a compressed depth range for 3D map layers. Shadow-map
 * textures need the full range because their sampling matrices assume 0..1.
 */
export function withShadowDepthRange(gl:Pick<WebGL2RenderingContext,'getParameter'|'depthRange'|'DEPTH_RANGE'>,draw:()=>void){
 const range=gl.getParameter(gl.DEPTH_RANGE) as Float32Array;
 gl.depthRange(0,1);
 try{draw();}finally{gl.depthRange(range[0],range[1]);}
}
