import {test,expect} from '@playwright/test';
import {CAMPUS_VISITS} from '../../apps/web/lib/campus-visits';

test('restaurant and IUT elevations load at grounded walking viewpoints',async({page})=>{
 test.setTimeout(300000);await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|GL_INVALID|shader error|framebuffer/i.test(m.text()))errors.push(m.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 for(const id of ['crous','crous-east','iut-mp']){
  await page.getByRole('combobox',{name:'Secteur du campus'}).selectOption(id);
  await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
  const hud=page.locator('.walk-hud'),details=page.locator('.architecture-panel');
  await expect(details).toHaveAttribute('data-campus-environment','true');
  await expect(hud).toHaveAttribute('data-look-pitch','90');
  await expect.poll(async()=>Number(await hud.getAttribute('data-eye-elevation'))-Number(await hud.getAttribute('data-ground-elevation'))).toBeCloseTo(1.65,2);
  if(id.startsWith('crous')){
   const visit=CAMPUS_VISITS.find(v=>v.id===id)!;
   await expect.poll(async()=>Math.hypot((Number(await hud.getAttribute('data-lon'))-visit.start[0])*75400,(Number(await hud.getAttribute('data-lat'))-visit.start[1])*111319)).toBeLessThan(3);
  }
  await expect(details).toHaveAttribute('data-photo-ground','0');
  await expect(page.locator('.walk-error')).toHaveCount(0);
  await page.screenshot({path:`test-results/${id}-expansion-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 }
 expect(errors).toEqual([]);
});
