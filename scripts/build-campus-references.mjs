// Reviewed institutional-photo observations on existing IGN envelopes.
// No source photographs are copied into the application or used as textures.
import {readFileSync,writeFileSync} from 'node:fs';
const world=JSON.parse(readFileSync('apps/web/public/city/campus-portes-du-jura.json','utf8'));
const sources=[
 {id:'stgi-history-aerial',institution:'UFR STGI · Livret des 30 ans · aerial image, pp. 46–47',url:'https://stgi.umlp.fr/wp-content/uploads/2023/10/Livre-30ans_v1.pdf',published:'2023-10',captureDate:null},
 {id:'stgi-c-2023',institution:'L’Est Républicain · Lionel Vadam',url:'https://www.estrepublicain.fr/education/2023/03/05/la-fac-fete-ses-30-ans-vendredi-sur-le-campus-des-portes-du-jura',published:'2023-03-05',captureDate:null,author:'Lionel Vadam'},
 {id:'crous-2012',institution:'Wikimedia Commons · Restaurant universitaire des Portes du Jura',url:'https://commons.wikimedia.org/wiki/File:URF_STGI_CROUS.JPG',published:'unknown',captureDate:'2012-11-13',author:'Antomoro',license:'Free Art License'},
 {id:'stgi-west',institution:'UFR STGI · Université Marie et Louis Pasteur',url:'https://stgi.umlp.fr/wp-content/uploads/2021/02/ufr-stgi-montbe1.jpg',published:'2021-02',captureDate:null},
 {id:'stgi-court',institution:'UFR STGI · Université Marie et Louis Pasteur',url:'https://stgi.umlp.fr/wp-content/uploads/2021/02/ufr-stgi-montbe2.jpg',published:'2021-02',captureDate:null},
 {id:'stgi-colour',institution:'UFR STGI · Université Marie et Louis Pasteur',url:'https://stgi.umlp.fr/wp-content/uploads/2021/02/ufr-stgi-montbe3.jpg',published:'2021-02',captureDate:null},
 {id:'stgi-painted-detail',institution:'Wikimedia Commons · UFR STGI Montbéliard',url:'https://commons.wikimedia.org/wiki/File:Ufr_stgi_univ_framche_comte.jpg',published:'2016-11',captureDate:'2016-11-10',author:'Noscium',license:'CC BY-SA 4.0'},
 {id:'library',institution:'UFR STGI · Bibliothèque universitaire',url:'https://stgi.umlp.fr/wp-content/uploads/2021/06/BU-MONTBELIARD.jpg',published:'2021-06',captureDate:null},
 {id:'utbm',institution:'Université de Technologie de Belfort-Montbéliard',url:'https://www.utbm.fr/wp-content/uploads/2015/04/site-utbm-montbeliard.jpg',published:'2015-04',captureDate:null},
 {id:'plan',institution:'UFR STGI · Plan du campus 2025',url:'https://stgi.umlp.fr/wp-content/uploads/2025/07/2025_Plan-Campus_Montbeliard.jpg',published:'2025-07',captureDate:null},
 {id:'iut-plan',institution:'IUT Nord Franche-Comté · Plan Montbéliard 2026',url:'https://www.iut-nfc.univ-fcomte.fr/wp-content/uploads/2026/04/SITE-MONTBELIARD.png',published:'2026-04',captureDate:null},
];
const buildings=[];
function building(id,label,wallColor,sourceIds,faces,notes){
 const feature=world.buildings.features.find(f=>f.properties.sourceId===id);if(!feature)throw Error('Missing IGN building '+id);
 const ring=(feature.geometry.type==='Polygon'?feature.geometry.coordinates:feature.geometry.coordinates[0])[0];
 if(label.startsWith('UFR STGI'))sourceIds.push('stgi-painted-detail');
 buildings.push({buildingId:id,label,wallColor,sourceIds,faces:faces.map(([edge,kind,extra={}])=>({a:ring[edge],b:ring[edge+1],kind,...extra})),notes});
}
building('BATIMENT0000000223563706','STGI · retour nord · élévation ouest','#d2d1c8',['stgi-c-2023','stgi-history-aerial','plan'],[
 [8,'concrete',{layout:'stgi-return',label:'MULTIMEDIA'}],
 [7,'concrete',{layout:'stgi-north-openings',openings:[
  ...[.18,.5,.82].map(at=>({at,width:.17,bottom:.075,top:.255})),
  ...[.18,.5,.82].map(at=>({at,width:.17,bottom:.385,top:.565})),
  ...[.18,.5,.82].map(at=>({at,width:.17,bottom:.705,top:.825})),
 ]}],
],'The west return visible behind the C stair tower in Lionel Vadam’s 2023 photograph has three stacked glazing bands, projecting concrete ledges and a broad solid parapet. Registration, window subdivisions and dimensions are approximate from an oblique partial view. The anniversary booklet aerial identifies the MULTIMEDIA lettering on this return and glazing on the long north side. Painted north panels and grouped openings are registered approximately on edge 7; group positions, subdivisions and heights remain estimates from an oblique image, not surveyed fenestration. Hidden elevations remain simplified; no doors are inferred.');
building('BATIMENT0000000223563366','UFR STGI · aile sud','#d2d1c8',['stgi-west','stgi-court','stgi-colour','plan'],[
 [0,'ribbon',{floors:3,label:'UFR STGI',layout:'stgi-west',solidBays:[[.69,.83]],stairBay:[.34,.43],glazingBands:[[.055,.29],[.36,.60],[.77,.88]]}],[3,'frame',{floors:3,layout:'stgi-court'}],[16,'frame',{floors:3,layout:'stgi-court'}],
],'West reference: two broad lower glazing bands, paired narrow upper lights, outside guardrails, a glazed stair bay, a solid concrete pier and UFR STGI outline lettering. Positions and registration are estimated from the oblique photo; no new entrance is inferred.');
building('BATIMENT0000000223563368','UFR STGI · aile nord','#d2d1c8',['stgi-west','stgi-colour','plan'],[
 [9,'frame',{floors:3,layout:'stgi-court',courtyardFeature:'stgi-entry'}],[11,'ribbon',{floors:3,layout:'stgi-ribbon',glazingBands:[[.055,.255],[.395,.585],[.735,.885]]}],[21,'ribbon',{floors:3,layout:'stgi-ribbon',glazingBands:[[.055,.255],[.395,.585],[.735,.885]]}],
],'Ribbon windows and red/green/yellow trim follow the institutional views. The green entrance and concrete grid facing the main court follow the supplied campus photographs. Small IGN jogs and hidden faces are simplified.');
building('BATIMENT0000000223563452','UFR STGI · pavillon est','#d2d1c8',['stgi-court','stgi-colour','plan'],[
 [3,'frame',{floors:3,layout:'stgi-court'}],[5,'frame',{floors:3,layout:'stgi-court'}],[7,'frame',{floors:3,layout:'stgi-court'}],[8,'ribbon',{floors:3,layout:'stgi-ribbon',glazingBands:[[.055,.255],[.395,.585],[.735,.885]]}],[9,'ribbon',{floors:3,layout:'stgi-colour',accentBay:[.30,.56],glazingBands:[[.055,.255],[.395,.585],[.735,.885]]}],
],'Concrete grid towards the courtyard and ribbon windows with a turquoise accent bay, observed in the STGI complex. The courtyard grid uses projecting continuous piers and cross beams. The colour reference supplies an upper turquoise projection, a small horizontal window and a yellow vertical slit above uninterrupted ground-floor glazing; the former inferred doorway is removed. Their registration to this approximate envelope is not a surveyed reconstruction.');
building('BATIMENT0000000223563705','UFR STGI · pavillon nord-est','#d2d1c8',['stgi-court','stgi-colour','plan'],[
 [3,'frame',{floors:3,layout:'stgi-court'}],[5,'frame',{floors:3,layout:'stgi-court'}],[6,'ribbon',{floors:3,layout:'stgi-ribbon',glazingBands:[[.055,.255],[.395,.585],[.735,.885]]}],[7,'ribbon',{floors:3,layout:'stgi-ribbon',glazingBands:[[.055,.255],[.395,.585],[.735,.885]]}],[8,'ribbon',{floors:3,layout:'stgi-ribbon',glazingBands:[[.055,.255],[.395,.585],[.735,.885]]}],
],'The courtyard architectural language is reconstructed from institutional photographs. Precise departmental boundaries and obscured openings are unverified.');
building('BATIMENT0000000223563364','Bibliothèque universitaire','#aaa99e',['library','stgi-court','plan'],[
 [0,"libraryGlass",{}],
 [2,"libraryGlass",{}],
 [4,"libraryGlass",{}],
 [7,"libraryStone",{}],
 [11,"libraryStone",{"courtyardFeature":"library-bay","openings":[{"at":0.16,"width":0.2,"bottom":0.045,"top":0.205},{"at":0.49,"width":0.18,"bottom":0.045,"top":0.205},{"at":0.78,"width":0.14,"bottom":0.045,"top":0.205},{"at":0.1,"width":0.07,"bottom":0.3,"top":0.365,"accent":"#559380"},{"at":0.31,"width":0.16,"bottom":0.3,"top":0.365},{"at":0.56,"width":0.24,"bottom":0.3,"top":0.365},{"at":0.83,"width":0.07,"bottom":0.3,"top":0.365,"accent":"#b4a75a"},{"at":0.15,"width":0.07,"bottom":0.535,"top":0.6,"accent":"#559380"},{"at":0.51,"width":0.05,"bottom":0.535,"top":0.6},{"at":0.82,"width":0.06,"bottom":0.535,"top":0.6,"accent":"#995e50"},{"at":0.2,"width":0.06,"bottom":0.79,"top":0.825},{"at":0.53,"width":0.06,"bottom":0.79,"top":0.825},{"at":0.78,"width":0.07,"bottom":0.79,"top":0.825,"accent":"#559380"}]}],
 [1,"libraryStone",{"openings":[{"at":0.46,"width":0.76,"bottom":0.71,"top":0.765},{"at":0.36,"width":0.47,"bottom":0.485,"top":0.55},{"at":0.12,"width":0.025,"bottom":0.385,"top":0.435,"accent":"#52745e"},{"at":0.72,"width":0.022,"bottom":0.4,"top":0.45,"accent":"#a69a58"},{"at":0.88,"width":0.027,"bottom":0.5,"top":0.555},{"at":0.52,"width":0.78,"bottom":0.055,"top":0.23}]}],
],"Observed grey concrete/brick courses, glazed west end and stair bay. The long courtyard elevation uses uneven window groups and coloured reveals observed in stgi-court; their fractions along the IGN wall are estimates, not surveyed dimensions. The supplied courtyard photographs show a projecting white reading-room bay with red shades and BU lettering below. Interior space and the undercroft are not accessible. The north elevation visible receding from the glazed west end in the library photograph adds long narrow glazing and smaller punched openings. Positions remain approximate; the undercroft remains a closed envelope.");
building('BATIMENT0000000292211747','UTBM · façade du Cours Louis Leprince-Ringuet','#c4c1b4',['utbm','library','plan'],[
 [3,'timber',{label:'UTBM',openings:[{at:.24,width:.055,bottom:.065,top:.09},{at:.585,width:.37,bottom:.015,top:.16},{at:.895,width:.17,bottom:.015,top:.16}]}],[2,'concrete'],
],'The observed southern timber screen, horizontal glazing, concrete base and large outline lettering are reconstructed as geometry. The west plinth remains mostly solid with a small slit and grouped glazing, following the photo. Door positions use OSM entrance nodes 6050160864 and 6050160865; door widths and hardware are estimated. The reference was published in 2015; present-day alterations are unverified.');
for(const [id,edge] of [['BATIMENT0000000223563543',1],['BATIMENT0000000223563537',25],['BATIMENT0000000223563536',3]]){
 building(id,'IUT · Mesures physiques · côté cour','#d2d1c8',['stgi-court','iut-plan'],[[edge,'ribbon',{floors:3,painted:true,...(id.endsWith('3543')?{courtyardFeature:'mp-entry'}:{}),glazingBands:[[.045,.28],[.465,.585],[.795,.915]]}]],'Eastern courtyard elevation seen at the left of the STGI courtyard reference. The 2026 institutional plan identifies this strip as IUT Mesures physiques. The supplied courtyard views show a red entrance block with a white department plaque. Openings and registration remain approximate; other sides are not reconstructed.');
}
// Register existing mapped entrances along the documented southern frontage.
building('BATIMENT0000000223563747','CROUS · restaurant universitaire · accueil','#d2d1c8',['crous-2012','plan'],[
 [4,'concrete',{layout:'crous-front'}],
],'Tall glazed entrance bays, blue upper infill, concrete pilasters and restaurant canopy observed in the 2012 photograph. User-supplied frontal views show broad uninterrupted glazing, narrow concrete fins and a pale fascia. Bay widths and projections are estimated. Doors remain closed; the interior and detached forecourt structure are not reconstructed.');
building('BATIMENT0000000223563498','CROUS · restaurant universitaire · aile est','#d2d1c8',['crous-2012','plan'],[
 [13,'concrete',{layout:'crous-corner'}],[12,'concrete',{layout:'crous-glass'}],[10,'concrete',{layout:'crous-east'}],
],'White upper fascia, red/blue ribbon accents, glazed corner and tall narrow east-wing windows observed in the 2012 photograph. Obscured walls and current alterations remain unverified.');
const campusMap=JSON.parse(readFileSync('apps/web/public/city/campus-osm.json','utf8'));
const entranceFace=buildings.find(b=>b.buildingId==='BATIMENT0000000292211747').faces.find(f=>f.kind==='timber');
const [a,b]=[entranceFace.a,entranceFace.b],cos=Math.cos(a[1]*Math.PI/180),dx=(b[0]-a[0])*cos,dy=b[1]-a[1];
entranceFace.entrances=[6050160864,6050160865].map(id=>{
 const node=campusMap.objects.find(o=>o.id===id&&o.tags.entrance==='main');
 if(!node)throw Error('Missing mapped UTBM entrance '+id);
 const at=((node.coordinates[0]-a[0])*cos*dx+(node.coordinates[1]-a[1])*dy)/(dx*dx+dy*dy);
 if(at<=0||at>=1)throw Error('Entrance outside UTBM frontage');
 const gap=Math.hypot((node.coordinates[0]-a[0]-(b[0]-a[0])*at)*cos,node.coordinates[1]-a[1]-(b[1]-a[1])*at)*111319;
 if(gap>8)throw Error('Mapped entrance too far from the IGN frontage');
 return {at:Number(at.toFixed(6)),width:1.8,sourceNode:id};
});
writeFileSync('apps/web/public/city/campus-facades.json',JSON.stringify({version:1,reviewedAt:'2026-11-19',method:'Manual architectural observations registered approximately to IGN envelopes; not photogrammetry.',sourceImagesRedistributed:false,sources,buildings},null,2)+'\n');
console.log(`Recorded ${buildings.length} building envelopes and ${buildings.reduce((sum,b)=>sum+b.faces.length,0)} observed-style faces.`);
