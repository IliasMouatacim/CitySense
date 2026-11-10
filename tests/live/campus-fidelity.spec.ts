import {test,expect} from '@playwright/test';

test('photo-reviewed STGI and UTBM elevations render in grounded walking views',async({page})=>{
 test.setTimeout(240000);await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|GL_INVALID|shader error|framebuffer|feedback loop/i.test(m.text()))errors.push(m.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 // Use the browser's configured network path, including the cloud proxy.
 const references=await page.evaluate(async()=>{
  const response=await fetch('/city/campus-facades.json');
  if(!response.ok)throw Error('Campus references unavailable: '+response.status);
  return response.json();
 });
 const west=references.buildings.flatMap((b:{faces:{layout?:string;label?:string}[]})=>b.faces).find((f:{layout?:string})=>f.layout==='stgi-west');
 expect(west?.label).toBe('UFR STGI');
 const utbm=references.buildings.find((b:{buildingId:string})=>b.buildingId==='BATIMENT0000000292211747');
 expect(utbm.faces.find((f:{kind:string})=>f.kind==='timber').entrances).toHaveLength(2);
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 for(const sector of ['stgi','utbm']){
  await page.getByRole('combobox',{name:'Secteur du campus'}).selectOption(sector);
  await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
  const hud=page.locator('.walk-hud'),details=page.locator('.architecture-panel');
  await expect(hud).toHaveAttribute('data-look-pitch','90');
  await expect.poll(async()=>Number(await details.getAttribute('data-campus-facades'))).toBeGreaterThanOrEqual(27);
  await expect.poll(async()=>Number(await hud.getAttribute('data-eye-elevation'))-Number(await hud.getAttribute('data-ground-elevation'))).toBeCloseTo(1.65,2);
  await expect(details).toHaveAttribute('data-photo-ground','0');
  await expect(page.locator('.walk-error')).toHaveCount(0);
  await page.screenshot({path:`test-results/campus-${sector}-fidelity-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 }
 expect(errors).toEqual([]);
});
