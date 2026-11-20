import {test,expect} from '@playwright/test';
test('the university walk starts automatically, accepts keyboard and touch, and exits to the aerial view',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 const hud=page.getByRole('region',{name:'Exploration à pied',exact:true});
 await expect(hud).toBeVisible();await expect(hud).toHaveAttribute('data-lon',/\d/);
 await expect(hud).toContainText('Le directeur du campus vous accompagne');
 expect(Number(await hud.getAttribute('data-lat'))).toBeCloseTo(47.4953,3);
 expect(Number(await hud.getAttribute('data-lon'))).toBeCloseTo(6.8039,3);
 await expect(page.locator('.walk-error')).toHaveCount(0);
 await expect(page.locator('.panel')).toBeHidden();
 await expect.poll(()=>page.locator('.map').evaluate(e=>e.clientHeight===innerHeight&&e.clientWidth===innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/walking-start-${test.info().project.name}.png`,fullPage:true});
 const longitude=await hud.getAttribute('data-lon'),latitude=await hud.getAttribute('data-lat');
 await page.keyboard.down('w');
 try{
  await expect.poll(async()=>Number(await hud.getAttribute('data-meters')),{timeout:10000}).toBeGreaterThan(.6);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  await page.evaluate(()=>new Promise<void>(resolve=>{let frames=0;const next=()=>{if(++frames===20)resolve();else requestAnimationFrame(next);};requestAnimationFrame(next);}));
  const stopped=Number(await hud.getAttribute('data-meters'));
  await page.evaluate(()=>new Promise<void>(resolve=>{let frames=0;const next=()=>{if(++frames===20)resolve();else requestAnimationFrame(next);};requestAnimationFrame(next);}));
  expect(Number(await hud.getAttribute('data-meters'))).toBeCloseTo(stopped,2);
 }finally{await page.keyboard.up('w');}
 expect((await hud.getAttribute('data-lon'))!==longitude||(await hud.getAttribute('data-lat'))!==latitude).toBe(true);
 const turn=page.getByRole('button',{name:'Tourner à droite',exact:true}),box=await turn.boundingBox();
 const heading=Number(await hud.getAttribute('data-heading'));
 await page.mouse.move(box!.x+box!.width/2,box!.y+box!.height/2);await page.mouse.down();
 try{await expect.poll(async()=>Math.abs(Number(await hud.getAttribute('data-heading'))-heading)).toBeGreaterThan(5);}finally{await page.mouse.up();}
 await page.getByRole('button',{name:'Revenir au point de départ'}).click();
 const beforeTouch=Number(await hud.getAttribute('data-meters'));
 const forward=await page.getByRole('button',{name:'Avancer',exact:true}).boundingBox();
 await page.mouse.move(forward!.x+forward!.width/2,forward!.y+forward!.height/2);await page.mouse.down();
 try{await expect.poll(async()=>Number(await hud.getAttribute('data-meters')),{timeout:10000}).toBeGreaterThan(beforeTouch+.6);}finally{await page.mouse.up();}
 const beforeKeyButton=Number(await hud.getAttribute('data-meters'));
 await page.getByRole('button',{name:'Avancer',exact:true}).focus();await page.keyboard.down('Space');
 try{await expect.poll(async()=>Number(await hud.getAttribute('data-meters'))).toBeGreaterThan(beforeKeyButton+.3);}finally{await page.keyboard.up('Space');}
 await page.screenshot({path:`test-results/walking-street-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Quitter la marche'}).click();
 await expect(hud).toHaveCount(0);await expect(page.locator('.panel')).toBeVisible();
 await expect(page.locator('.map')).toHaveAttribute('data-pitch','60');
 expect(errors).toEqual([]);
});
test('Escape exits walking and reduced-motion users can walk without an automatic tour',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Quitter la marche'}).click();
 await page.getByRole('button',{name:'Vue 3D',exact:true}).click();
 await expect(page.locator('.map')).toHaveAttribute('data-pitch','0');
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 await expect(page.getByRole('region',{name:'Exploration à pied',exact:true})).toHaveAttribute('data-lon',/\d/);
 await page.keyboard.press('Escape');
 await expect(page.getByRole('region',{name:'Exploration à pied',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Visite orbitale',exact:true})).toBeDisabled();
 await expect(page.locator('.map')).toHaveAttribute('data-pitch','0');
});

test('drag-to-look rotates at street level and pointer lock can be released safely',async({page})=>{
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 const hud=page.getByRole('region',{name:'Exploration à pied',exact:true});await expect(hud).toHaveAttribute('data-heading',/\d/);
 const heading=Number(await hud.getAttribute('data-heading'));
 const canvas=await page.locator('.maplibregl-canvas').boundingBox();
 await page.mouse.move(canvas!.width/2,canvas!.height/2);await page.mouse.down();await page.mouse.move(canvas!.width/2+100,canvas!.height/2-90,{steps:8});await page.mouse.up();
 await expect.poll(async()=>Math.abs(Number(await hud.getAttribute('data-heading'))-heading)).toBeGreaterThan(8);
 await expect.poll(async()=>Number(await hud.getAttribute('data-look-pitch'))).toBeGreaterThan(90);
 await expect(page.locator('.map-error')).toHaveCount(0);
 await page.screenshot({path:`test-results/walking-look-up-${test.info().project.name}.png`,fullPage:true});
 if(test.info().project.name==='desktop'){
  await page.getByRole('button',{name:'Capturer la souris',exact:true}).click();
  await expect(page.getByRole('button',{name:'Souris capturée',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(hud).toHaveCount(0);
 }else{await page.getByRole('button',{name:'Quitter la marche'}).click();}
 await expect(page.locator('.panel')).toBeVisible();
});
