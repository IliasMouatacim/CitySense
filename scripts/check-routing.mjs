const url=new URL('http://127.0.0.1:4000/routes');
url.search=new URLSearchParams({from:'6.8011,47.5105',to:'6.8049,47.5057',mode:'pedestrian'}).toString();
const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
if(!response.ok)throw Error(`Route check failed: HTTP ${response.status}`);
const route=await response.json();
if(route.engine!=='Valhalla'||route.geometry?.coordinates?.length<3||route.distanceMeters<100||route.durationSeconds<=0||!route.instructions?.length)throw Error('Invalid real route response');
console.log(`Valhalla walking route: ${route.distanceMeters} m, ${route.durationSeconds} s, ${route.instructions.length} instructions.`);
