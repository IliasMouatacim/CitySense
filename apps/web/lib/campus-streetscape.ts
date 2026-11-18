import type {CampusData, StreetWay} from './city-world';

type Point = [number, number];

export function streetWidth(tags: Record<string, string>, pedestrian: boolean) {
 const mapped = Number.parseFloat(tags.width);
 const fallback = Number(tags.lanes) * 3 || (pedestrian ? 3 : tags.highway === 'service' ? 4 : 6);
 return Math.max(1, Math.min(20, Number.isFinite(mapped) ? mapped : fallback));
}

/** Only paint zebra crossings that share a mapped node with a carriageway. */
export function campusZebras(campus: CampusData, project: (point: number[]) => Point) {
 const paths = new Set(['footway','pedestrian','path','cycleway','steps','construction','proposed']);
 const roads = campus.roads.filter(road => !paths.has(road.tags.highway) && road.tags.tunnel !== 'yes');
 const crossings: {position: Point; stripes: Point[][]}[] = [];
 for (const node of campus.objects) {
  if (node.tags.highway !== 'crossing' || node.tags['crossing:markings'] !== 'zebra') continue;
  const matches = roads.flatMap((road: StreetWay) => {
   const i = road.coordinates.findIndex(([x,y]) => x === node.coordinates[0] && y === node.coordinates[1]);
   if (i < 0) return [];
   const a = project(road.coordinates[Math.max(0, i-1)]);
   const b = project(road.coordinates[Math.min(road.coordinates.length-1, i+1)]);
   return [{dx:b[0]-a[0], dy:b[1]-a[1], width:streetWidth(road.tags, road.tags.highway === 'living_street')}];
  });
  const match = matches.sort((a,b) => b.width-a.width)[0];
  if (!match) continue;
  const length = Math.hypot(match.dx, match.dy);
  if (length < .1) continue;
  const position = project(node.coordinates);
  const ux = match.dx/length, uy = match.dy/length;
  const point = (along:number, across:number): Point => [position[0]+ux*along-uy*across,position[1]+uy*along+ux*across];
  const stripes: Point[][] = [];
  const count = Math.max(1, Math.floor(match.width-.4));
  for (let i=0; i<count; i++) {
   const side = i-(count-1)/2;
   stripes.push([point(-1.25,side-.24),point(1.25,side-.24),point(1.25,side+.24),point(-1.25,side+.24)]);
  }
  crossings.push({position:node.coordinates,stripes});
 }
 return crossings;
}
