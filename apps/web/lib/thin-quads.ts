/** Split elongated quads without changing their surface, winding or UV scale.
 * Narrow roof caps can otherwise rasterize with unstable depth on mobile GPUs.
 * The cap bounds geometry growth for exceptionally narrow decorative lines.
 */
export function thinQuadSpans(points:number[][],uv?:number[][]):{points:number[][];uv?:number[][]}[]{
 const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
 const [a,b,c,d]=points,u=Math.max(distance(a,b),distance(d,c)),v=Math.max(distance(a,d),distance(b,c));
 const short=Math.min(u,v),long=Math.max(u,v);
 if(short===0||long<=short*20)return [{points,uv}];
 const count=Math.min(64,Math.ceil(long/(short*20))),alongU=u>=v;
 const mix=(a:number[],b:number[],t:number)=>a.map((value,i)=>value+(b[i]-value)*t);
 const slice=(q:number[][],t0:number,t1:number)=>alongU
  ?[mix(q[0],q[1],t0),mix(q[0],q[1],t1),mix(q[3],q[2],t1),mix(q[3],q[2],t0)]
  :[mix(q[0],q[3],t0),mix(q[1],q[2],t0),mix(q[1],q[2],t1),mix(q[0],q[3],t1)];
 return Array.from({length:count},(_,i)=>({points:slice(points,i/count,(i+1)/count),...(uv?{uv:slice(uv,i/count,(i+1)/count)}:{})}));
}
