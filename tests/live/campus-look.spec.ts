import {test,expect} from '@playwright/test';

test('library glazing and concrete remain readable in the shaded campus elevation',async({page})=>{
 test.setTimeout(150000);await page.emulateMedia({reducedMotion:'reduce'});
 const loadedMaterials=new Set<string>();
 page.on('response',response=>{if(/\/materials\/campus-.*\.jpg$/.test(response.url())&&response.ok())loadedMaterials.add(response.url());});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 page.on('console',message=>{if(message.type()==='error'&&/THREE|WebGL|GL_INVALID|shader error|framebuffer|feedback loop/i.test(message.text()))errors.push(message.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 await page.getByRole('combobox',{name:'Secteur du campus'}).selectOption('library');
 await expect(page.locator('.architecture-panel')).toHaveAttribute('data-campus-environment','true',{timeout:45000});
 await expect.poll(()=>loadedMaterials.size,{timeout:45000}).toBe(9);
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 await expect(page.locator('.walk-hud')).toHaveAttribute('data-lat',/47\.49/,{timeout:45000});
 await expect(page.locator('.walk-error')).toHaveCount(0);
 await page.screenshot({path:`test-results/campus-library-materials-${test.info().project.name}.png`,fullPage:true});
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
