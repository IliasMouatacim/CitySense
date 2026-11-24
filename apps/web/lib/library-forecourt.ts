// Measured building corner and north elevation from the campus IGN footprint.
// Furniture positions are estimated in metres along and out from that wall.
export const libraryCorner:[number,number]=[6.8034052,47.4954809];
export const libraryAxis=[.955,.297] as const;
export function forecourtPoint(along:number,out:number):[number,number]{
 const [x,y]=libraryAxis;
 return [libraryCorner[0]+(x*along-y*out)/75200,libraryCorner[1]+(y*along+x*out)/111319];
}

export const directoryPosition={along:-11.55,out:14.35,alongSpan:.33,outSpan:1.41};
export const forecourtLamps=[[-7.6,12.3],[17,9],[33,9]] as const;
export const cycleLockers={along:3,out:.7,count:6,pitch:1.25,depth:1.12};
