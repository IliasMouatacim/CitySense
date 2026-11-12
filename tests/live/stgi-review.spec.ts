import {test,expect} from '@playwright/test';
import {CAMPUS_VISITS} from '../../apps/web/lib/campus-visits';

test('STGI west, courtyard and turquoise elevations have stable pedestrian viewpoints',async({page})=>{
 test.setTimeout(300000);await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|GL_INVALID|shader error|framebuffer|feedback loop/i.test(m.text()))errors.push(m.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 const references=await page.evaluate(()=>fetch('/city/campus-facades.json').then(r=>r.json()));
 const layouts=references.buildings.flatMap((b:{faces:{layout?:string}[]})=>b.faces.map(f=>f.layout));
 for(const layout of ['stgi-west','stgi-court','stgi-colour'])expect(layouts).toContain(layout);
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 for(const id of ['stgi','stgi-court','stgi-colour']){
  await page.getByRole('combobox',{name:'Secteur du campus'}).selectOption(id);
  await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
  const hud=page.locator('.walk-hud'),details=page.locator('.architecture-panel');
  await expect(hud).toHaveAttribute('data-look-pitch','90');
  await expect(details).toHaveAttribute('data-campus-environment','true');
  const visit=CAMPUS_VISITS.find(v=>v.id===id)!;
  await expect.poll(async()=>Math.hypot((Number(await hud.getAttribute('data-lon'))-visit.start[0])*75400,(Number(await hud.getAttribute('data-lat'))-visit.start[1])*111319)).toBeLessThan(id==='stgi'?25:3);
  await expect.poll(async()=>Number(await hud.getAttribute('data-eye-elevation'))-Number(await hud.getAttribute('data-ground-elevation'))).toBeCloseTo(1.65,2);
  await expect(details).toHaveAttribute('data-photo-ground','0');
  await expect(page.locator('.walk-error')).toHaveCount(0);
  if(test.info().project.name==='mobile'){
   const toggle=page.getByRole('button',{name:'Options et lieux',exact:true});
   await expect(toggle).toBeVisible();
   await expect(page.getByLabel('Style de la ville')).toBeHidden();
   expect((await details.boundingBox())!.height).toBeLessThan(120);
   await toggle.click();
   await expect(page.getByLabel('Style de la ville')).toBeVisible();
   await page.getByRole('button',{name:'Masquer les détails',exact:true}).click();
   await expect(page.getByLabel('Style de la ville')).toBeHidden();
  }
  await page.screenshot({path:`test-results/${id}-review-${test.info().project.name}.png`,fullPage:true});
  await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 }
 expect(errors).toEqual([]);
});
