import {test,expect} from '@playwright/test';

test('library glazing and concrete remain readable in the shaded campus elevation',async({page})=>{
 test.setTimeout(210000);await page.emulateMedia({reducedMotion:'reduce'});
 const loadedMaterials=new Set<string>();
 page.on('response',response=>{if(/\/materials\/campus-.*\.jpg$/.test(response.url())&&response.ok())loadedMaterials.add(new URL(response.url()).pathname.split('/').pop()!);});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'&&/THREE|WebGL|GL_INVALID|shader error|framebuffer|feedback loop/i.test(message.text()))errors.push(message.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 await page.getByRole('combobox',{name:'Secteur du campus'}).selectOption('library');
 await expect(page.locator('.architecture-panel')).toHaveAttribute('data-campus-environment','true',{timeout:45000});
 const facadeMaps=['concrete','paving','timber'].flatMap(name=>['color','height','roughness'].map(map=>'campus-'+name+'-'+map+'.jpg'));
 await expect.poll(()=>facadeMaps.filter(name=>!loadedMaterials.has(name)),{timeout:45000}).toEqual([]);
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 await expect(page.locator('.walk-hud')).toHaveAttribute('data-lat',/47\.49/,{timeout:45000});
 await expect(page.locator('.walk-error')).toHaveCount(0);
 await page.screenshot({path:`test-results/campus-library-materials-${test.info().project.name}.png`,fullPage:true});
 // Walk round the end of the library and inspect the formerly blank north wall.
 const hud=page.locator('.walk-hud'),canvas=page.locator('.maplibregl-canvas');
 async function turnTo(target:number){
  const rect=(await canvas.boundingBox())!,heading=Number(await hud.getAttribute('data-heading'));
  let dx=((target-heading+540)%360-180)/.13;
  while(Math.abs(dx)>.1){
   const step=Math.sign(dx)*Math.min(Math.abs(dx),rect.width*.55,270),x=rect.x+rect.width/2,y=rect.y+rect.height*.52;
   await page.mouse.move(x-step/2,y);await page.mouse.down();await page.mouse.move(x+step/2,y,{steps:2});await page.mouse.up();dx-=step;
  }
 }
 // Face the mapped zebra crossing west of the library from the pedestrian start.
 await expect.poll(()=>loadedMaterials.has('campus-grass.jpg')).toBe(true);
 await turnTo(292);
 await page.screenshot({path:`test-results/campus-library-crossing-${test.info().project.name}.png`,fullPage:true});
 await turnTo(0);
 await page.evaluate(()=>new Promise<void>(resolve=>{
  const start=performance.now(),hud=document.querySelector<HTMLElement>('.walk-hud')!;
  for(const code of ['KeyW','ShiftLeft'])window.dispatchEvent(new KeyboardEvent('keydown',{code,key:code==='KeyW'?'w':'Shift',bubbles:true}));
  const step=()=>{
   if(Number(hud.dataset.lat)<47.49555&&performance.now()-start<15000){requestAnimationFrame(step);return;}
   for(const code of ['KeyW','ShiftLeft'])window.dispatchEvent(new KeyboardEvent('keyup',{code,key:code==='KeyW'?'w':'Shift',bubbles:true}));
   resolve();
  };requestAnimationFrame(step);
 }));
 await expect.poll(async()=>Number(await hud.getAttribute('data-lat'))).toBeGreaterThanOrEqual(47.49555);
 await turnTo(110);
 await page.screenshot({path:`test-results/campus-library-north-${test.info().project.name}.png`,fullPage:true});
 expect(errors).toEqual([]);
});

test('lit campus courtyard remains detailed at the reported 220 degree walking view',async({page})=>{
 test.setTimeout(210000);await page.emulateMedia({reducedMotion:'reduce'});
 if(test.info().project.name==='desktop')await page.setViewportSize({width:1868,height:938});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'&&/THREE|WebGL|GL_INVALID|shader error|framebuffer|feedback loop/i.test(message.text()))errors.push(message.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 const panel=page.locator('.architecture-panel');await expect(panel).toHaveAttribute('data-campus-environment','true',{timeout:45000});
 await expect(panel).toHaveAttribute('data-campus-fixtures','5');await expect.poll(async()=>Number(await panel.getAttribute('data-campus-shadows'))).toBeGreaterThanOrEqual(1024);
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 const hud=page.locator('.walk-hud');await expect(hud).toHaveAttribute('data-lat',/47\.49/,{timeout:45000});
 const rect=(await page.locator('.maplibregl-canvas').boundingBox())!;
 const heading=Number(await hud.getAttribute('data-heading')),pitch=Number(await hud.getAttribute('data-look-pitch'));
 let dx=((220-heading+540)%360-180)/.13,dy=(pitch-90)/.12;
 const maxDrag=Math.min(270,rect.width*.6);
 while(Math.abs(dx)>.1||Math.abs(dy)>.1){
  const x=Math.sign(dx)*Math.min(Math.abs(dx),maxDrag),y=Math.sign(dy)*Math.min(Math.abs(dy),80),cx=rect.x+rect.width/2,cy=rect.y+rect.height*.52;
  await page.mouse.move(cx-x/2,cy-y/2);await page.mouse.down();await page.mouse.move(cx+x/2,cy+y/2,{steps:4});await page.mouse.up();dx-=x;dy-=y;
 }
 await expect.poll(async()=>Math.abs(Number(await hud.getAttribute('data-heading'))-220)).toBeLessThan(1);
 await page.screenshot({path:`test-results/campus-courtyard-upgraded-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 await page.getByRole('button',{name:'Nuit',exact:true}).click();
 await expect(panel).toHaveAttribute('data-campus-shadows','0');
 await page.getByRole('button',{name:'Jour',exact:true}).click();
 await expect.poll(async()=>Number(await panel.getAttribute('data-campus-shadows'))).toBeGreaterThanOrEqual(1024);
 await page.screenshot({path:`test-results/campus-day-restored-${test.info().project.name}.png`,fullPage:true});
 expect(errors).toEqual([]);
});
