import java.io.File;
import java.util.List;
import java.util.Map;
import org.osm2world.O2WConverter;
import org.osm2world.conversion.O2WConfig;
import org.osm2world.math.geo.LatLon;
import org.osm2world.math.geo.LatLonBounds;
import org.osm2world.math.geo.MetricMapProjection;
import org.osm2world.osm.creation.OSMFileReader;
import org.osm2world.output.gltf.GltfOutput;

/** Generate only street/environment assets; IGN remains the building/terrain source. */
public class CitySceneExport {
 public static void main(String[] args) throws Exception {
  if(args.length!=3)throw new IllegalArgumentException("input.osm.pbf style/standard.properties output.glb");
  var converter=new O2WConverter();
  var excluded=List.of("ExternalModelModule","RailwayModule","AerowayModule","BuildingModule","ParkingModule","WaterModule","PoolModule","GolfModule","SportsModule","CliffModule","PowerModule","MastModule","BridgeModule","TunnelModule","SurfaceAreaModule","InvisibleModule","IndoorModule");
  converter.setConfig(new O2WConfig(Map.of("excludeWorldModule",excluded,"lod",4,"maxTextureResolution",512,"treesPerSquareMeter",0,"createTerrain",false),new File(args[1])));
  converter.convert(new OSMFileReader(new File(args[0])),new LatLonBounds(47.5055,6.7935,47.5135,6.8065),new MetricMapProjection(new LatLon(47.51,6.8)),new GltfOutput(new File(args[2])));
 }
}
