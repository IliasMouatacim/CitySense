// Reviewed institutional-photo observations on existing IGN envelopes.
// No source photographs are copied into the application or used as textures.
import {readFileSync,writeFileSync} from 'node:fs';
const world=JSON.parse(readFileSync('apps/web/public/city/campus-portes-du-jura.json','utf8'));
const sources=[
 {id:'stgi-west',institution:'UFR STGI · Université Marie et Louis Pasteur',url:'https://stgi.umlp.fr/wp-content/uploads/2021/02/ufr-stgi-montbe1.jpg',published:'2021-02',captureDate:null},
 {id:'stgi-court',institution:'UFR STGI · Université Marie et Louis Pasteur',url:'https://stgi.umlp.fr/wp-content/uploads/2021/02/ufr-stgi-montbe2.jpg',published:'2021-02',captureDate:null},
 {id:'stgi-colour',institution:'UFR STGI · Université Marie et Louis Pasteur',url:'https://stgi.umlp.fr/wp-content/uploads/2021/02/ufr-stgi-montbe3.jpg',published:'2021-02',captureDate:null},
 {id:'library',institution:'UFR STGI · Bibliothèque universitaire',url:'https://stgi.umlp.fr/wp-content/uploads/2021/06/BU-MONTBELIARD.jpg',published:'2021-06',captureDate:null},
 {id:'utbm',institution:'Université de Technologie de Belfort-Montbéliard',url:'https://www.utbm.fr/wp-content/uploads/2015/04/site-utbm-montbeliard.jpg',published:'2015-04',captureDate:null},
 {id:'plan',institution:'UFR STGI · Plan du campus 2025',url:'https://stgi.umlp.fr/wp-content/uploads/2025/07/2025_Plan-Campus_Montbeliard.jpg',published:'2025-07',captureDate:null},
 {id:'iut-plan',institution:'IUT Nord Franche-Comté · Plan Montbéliard 2026',url:'https://www.iut-nfc.univ-fcomte.fr/wp-content/uploads/2026/04/SITE-MONTBELIARD.png',published:'2026-04',captureDate:null},
];
const buildings=[];
function building(id,label,wallColor,sourceIds,faces,notes){
 const feature=world.buildings.features.find(f=>f.properties.sourceId===id);if(!feature)throw Error('Missing IGN building '+id);
 const ring=(feature.geometry.type==='Polygon'?feature.geometry.coordinates:feature.geometry.coordinates[0])[0];
 buildings.push({buildingId:id,label,wallColor,sourceIds,faces:faces.map(([edge,kind,extra={}])=>({a:ring[edge],b:ring[edge+1],kind,...extra})),notes});
}
building('BATIMENT0000000223563366','UFR STGI · aile sud','#d2d1c8',['stgi-west','stgi-court','stgi-colour','plan'],[
 [0,'ribbon',{floors:3,label:'LEA  SVE'}],[3,'frame',{floors:3}],[16,'frame',{floors:3}],
],'Three observed storeys, ribbon glazing, concrete reveals and coloured transoms. Opening positions, dimensions and assignment to IGN walls are estimates. Stair projections remain plain.');
building('BATIMENT0000000223563368','UFR STGI · aile nord','#d2d1c8',['stgi-west','stgi-colour','plan'],[
 [9,'ribbon',{floors:3}],[11,'ribbon',{floors:3}],[21,'ribbon',{floors:3}],
],'Ribbon windows and red/green/yellow trim follow the institutional views. Small IGN jogs and hidden faces are simplified.');
building('BATIMENT0000000223563452','UFR STGI · pavillon est','#d2d1c8',['stgi-court','stgi-colour','plan'],[
 [3,'frame',{floors:3}],[5,'frame',{floors:3}],[7,'frame',{floors:3}],[8,'ribbon',{floors:3}],[9,'ribbon',{floors:3,accent:true}],
],'Concrete grid towards the courtyard and ribbon windows with a turquoise accent bay, observed in the STGI complex. Their registration to this approximate envelope is not a surveyed reconstruction.');
building('BATIMENT0000000223563705','UFR STGI · pavillon nord-est','#d2d1c8',['stgi-court','stgi-colour','plan'],[
 [3,'frame',{floors:3}],[5,'frame',{floors:3}],[6,'ribbon',{floors:3}],[7,'ribbon',{floors:3}],[8,'ribbon',{floors:3}],
],'The courtyard architectural language is reconstructed from institutional photographs. Precise departmental boundaries and obscured openings are unverified.');
building('BATIMENT0000000223563364','Bibliothèque universitaire','#aaa99e',['library','stgi-court','plan'],[
 [0,'libraryGlass'],[2,'libraryGlass'],[4,'libraryGlass'],[7,'libraryStone'],[11,'libraryStone'],
],'Observed grey concrete/brick courses, narrow ribbon windows, glazed west end and stair bay. Interior space and the undercroft are not accessible. Dimensions are estimated.');
building('BATIMENT0000000292211747','UTBM · façade du Cours Louis Leprince-Ringuet','#c4c1b4',['utbm','library','plan'],[
 [3,'timber',{label:'UTBM'}],[2,'concrete'],
],'The observed southern timber screen, horizontal glazing, concrete base and large outline lettering are reconstructed as geometry. The reference was published in 2015; present-day alterations are unverified.');
for(const [id,edge] of [['BATIMENT0000000223563543',1],['BATIMENT0000000223563537',25],['BATIMENT0000000223563536',3]]){
 building(id,'IUT · Mesures physiques · côté cour','#d2d1c8',['stgi-court','iut-plan'],[[edge,'ribbon',{floors:3}]],'Eastern courtyard elevation seen at the left of the STGI courtyard reference. The 2026 institutional plan identifies this strip as IUT Mesures physiques. Openings and registration remain approximate; other sides are not reconstructed.');
}
writeFileSync('apps/web/public/city/campus-facades.json',JSON.stringify({version:1,reviewedAt:'2026-11-09',method:'Manual architectural observations registered approximately to IGN envelopes; not photogrammetry.',sourceImagesRedistributed:false,sources,buildings},null,2)+'\n');
console.log(`Recorded ${buildings.length} building envelopes and ${buildings.reduce((sum,b)=>sum+b.faces.length,0)} observed-style faces.`);
