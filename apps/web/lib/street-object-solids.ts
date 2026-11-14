/** Collision follows rendered street furniture, in metres: east, north, up.
 * Entrance/barrier metadata with no rendered geometry must not create posts.
 * Dimensions remain illustrative, shared with the existing furniture rendering.
 */
export type StreetObjectSolid=
 | {kind:'box';x:number;y:number;z:number;width:number;depth:number;height:number}
 | {kind:'cylinder';x:number;y:number;z:number;radius:number;height:number};
export function streetObjectSolids(tags:Record<string,string>):StreetObjectSolid[]{
 const solids:StreetObjectSolid[]=[];
 const box=(x:number,y:number,z:number,width:number,depth:number,height:number)=>solids.push({kind:'box',x,y,z,width,depth,height});
 if(tags.natural==='tree')solids.push({kind:'cylinder',x:0,y:0,z:0,radius:.2,height:4.6});
 else if(tags.highway==='street_lamp')box(0,0,0,.12,.12,5);
 else if(tags.amenity==='bench')box(0,0,0,1.6,.5,.9);
 else if(tags.amenity==='bicycle_parking'){
  const stands=Math.max(1,Math.min(8,Math.ceil((Number(tags.capacity)||4)/2)));
  // Individual hoops leave the gaps between stands clear. Their curved tops
  // are conservatively bounded, including the mounting plates at ground level.
  for(let i=0;i<stands;i++)box((i-(stands-1)/2)*.75,0,0,.15,.70,.842);
 }else if(tags.amenity==='waste_basket')box(0,0,0,.44,.44,.77);
 else if(tags.highway==='bus_stop'&&tags.shelter==='yes'){
  for(const x of [-1.4,1.4])box(x,.5,0,.07,.07,2.3);
  box(0,.52,.45,2.8,.035,1.75);
  if(tags.bench==='yes')box(0,.2,0,2.3,.4,.53);
 }
 return solids;
}
