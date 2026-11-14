import {test,expect} from '@playwright/test';

test('walking dropdowns retain keyboard control and Escape exits only from the scene',async({page})=>{
 test.setTimeout(240000);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.goto('/');
 await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 const hud=page.locator('.walk-hud');
 await expect(hud).toHaveAttribute('data-lon',/\d/);
 const options=page.getByRole('button',{name:'Options et lieux',exact:true});
 if(await options.isVisible())await options.click();
 const select=page.getByLabel('Secteur du campus',{exact:true});
 await page.locator('.maplibregl-canvas').focus();
 await page.keyboard.down('w');
 try{
  await select.focus();
  // Allow pending telemetry to settle, then keep W held over several frames.
  const meters=()=>page.evaluate(async()=>{
   for(let i=0;i<3;i++)await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));
   return Number(document.querySelector<HTMLElement>('.walk-hud')!.dataset.meters);
  });
  const before=await meters();
  expect(await meters()).toBeCloseTo(before,3);
 }finally{await page.keyboard.up('w');}
 await page.keyboard.press('Escape');
 await expect(hud).toBeVisible();
 await expect(select).toBeFocused();
 await expect(page.locator('.walk-error')).toHaveCount(0);
 await page.locator('.maplibregl-canvas').focus();
 await page.keyboard.press('Escape');
 await expect(hud).toHaveCount(0);
});
