import {test,expect} from '@playwright/test';
import {CAMPUS_VISITS} from '../../apps/web/lib/campus-visits';

test('campus terrain, named departments and grounded walking work outside the historic centre',async({page})=>{
 test.setTimeout(180000);
 await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 const details=page.locator('.architecture-panel');
 await expect(details).toHaveAttribute('data-campus','true',{timeout:45000});
 await expect.poll(async()=>Number(await details.getAttribute('data-campus-buildings'))).toBeGreaterThan(8);
 await page.getByText(/Campus Portes du Jura ·/).click();
 await expect(details).toContainText('correspondances de façades estimées');
 await expect.poll(async()=>Number(await details.getAttribute('data-campus-facades'))).toBeGreaterThan(15);
 await page.getByText(/Campus Portes du Jura ·/).click();
 await page.getByRole('button',{name:'Noms et commerces'}).click();
 await page.getByRole('textbox',{name:'Filtrer les commerces visibles'}).fill('IUT');
 await expect(page.locator('.city-businesses li').first()).toContainText('IUT');
 await page.getByRole('button',{name:'Noms et commerces'}).click();
 await page.screenshot({path:`test-results/campus-aerial-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 const hud=page.locator('.walk-hud');
 await expect(hud).toHaveAttribute('data-lat',/47\.49/,{timeout:45000});
 const lat=Number(await hud.getAttribute('data-lat'));expect(lat).toBeGreaterThan(47.493);expect(lat).toBeLessThan(47.498);
 await expect(details).toHaveAttribute('data-campus','true');
 await expect(hud).toContainText('Sur le campus Portes du Jura');
 const ground=Number(await hud.getAttribute('data-ground-elevation')),pitch=Number(await hud.getAttribute('data-look-pitch')),target=Number(await hud.getAttribute('data-camera-target'));
 expect(Math.abs(target-(ground+1.8-30*Math.cos(pitch*Math.PI/180)))).toBeLessThan(.1);
 await expect(page.locator('.walk-error')).toHaveCount(0);
 if(test.info().project.name==='desktop'){
  await page.keyboard.down('KeyW');
  try{await expect.poll(async()=>Number(await hud.getAttribute('data-meters')),{timeout:20000}).toBeGreaterThan(.4);}finally{await page.keyboard.up('KeyW');}
 }
 await page.screenshot({path:`test-results/campus-walking-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 await expect(page.getByRole('button',{name:'Campus universitaire',exact:true})).toHaveAttribute('aria-pressed','true');
 expect(errors).toEqual([]);
});

test('the UTBM, library and IUT sectors open their documented facades in grounded walking mode',async({page})=>{
 test.setTimeout(240000);await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 for(const id of ['utbm','library','iut-mp']){
  await page.getByRole('combobox',{name:'Secteur du campus'}).selectOption(id);
  const details=page.locator('.architecture-panel');await expect.poll(async()=>Number(await details.getAttribute('data-campus-facades'))).toBeGreaterThan(15);
  await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
  const hud=page.locator('.walk-hud');await expect(hud).toHaveAttribute('data-lat',/47\.49/,{timeout:45000});
  const visit=CAMPUS_VISITS.find(s=>s.id===id)!,lon=Number(await hud.getAttribute('data-lon')),lat=Number(await hud.getAttribute('data-lat'));
  expect(Math.hypot((lon-visit.start[0])*75400,(lat-visit.start[1])*111319)).toBeLessThan(25);
  await expect(page.locator('.walk-error')).toHaveCount(0);
  await page.screenshot({path:`test-results/campus-${id}-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Secteur du campus'})).toHaveValue(id);
 }
});
