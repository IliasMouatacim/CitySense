/** Split elongated quads without changing their surface, winding or UV scale.
 * Narrow roof caps can otherwise rasterize with unstable depth on mobile GPUs.
 * The cap bounds geometry growth for exceptionally narrow decorative lines.
 */
export function thinQuadSpans(points:number[][],uv?:number[][]):{points:number[][];uv?:number[][]}[]{
 const squaredDistance=(a:number[],b:number[])=>{
  const dx=a[0]-b[0],dy=a[1]-b[1],dz=a[2]-b[2];
  return dx*dx+dy*dy+dz*dz;
 };
 const [a,b,c,d]=points;
 const u=Math.max(squaredDistance(a,b),squaredDistance(d,c));
 const v=Math.max(squaredDistance(a,d),squaredDistance(b,c));
 const short=Math.min(u,v),long=Math.max(u,v);
 if(short===0||long<=short*400)return [{points,uv}];
 const count=Math.min(64,Math.ceil(Math.sqrt(long/short)/20)),alongU=u>=v;
 const mix=(a:number[],b:number[],t:number)=>a.map((value,i)=>value+(b[i]-value)*t);
 // Adjacent spans reuse their shared edge, including its texture coordinates.
 const spans=(q:number[][])=>{
  const endA=alongU?q[1]:q[3],startB=alongU?q[3]:q[1];
  let a=q[0],b=startB;
  return Array.from({length:count},(_,i)=>{
   const t=(i+1)/count;
   const nextA=i+1===count?endA:mix(q[0],endA,t);
   const nextB=i+1===count?q[2]:mix(startB,q[2],t);
   const face=alongU?[a,nextA,nextB,b]:[a,b,nextB,nextA];
   a=nextA;b=nextB;
   return face;
  });
 };
 const texture=uv&&spans(uv);
 return spans(points).map((points,i)=>({points,uv:texture?.[i]}));
}
