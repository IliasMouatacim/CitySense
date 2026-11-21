import {test,expect} from '@playwright/test';

test('library paths have stable materials and walking stays grounded and responsive',async({page})=>{
 test.setTimeout(180000);await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&/THREE|GL_INVALID|shader error|framebuffer|feedback loop/i.test(m.text()))errors.push(m.text());});
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');
 await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 const originalSize=await page.locator('.maplibregl-canvas').evaluate((c:HTMLCanvasElement)=>c.width/c.clientWidth);
 await page.getByRole('button',{name:'Campus universitaire',exact:true}).click();
 await page.getByRole('combobox',{name:'Secteur du campus'}).selectOption('library');
 await page.getByRole('button',{name:'Marcher dans la ville',exact:true}).click();
 const hud=page.locator('.walk-hud'),details=page.locator('.architecture-panel');
 await expect(hud).toHaveAttribute('data-look-pitch','90');
 await expect.poll(async()=>Number(await details.getAttribute('data-campus-ground'))).toBeGreaterThan(0);
 await expect(details).toHaveAttribute('data-photo-ground','0');
 await expect(details).toHaveAttribute('data-model-meshes','0');
 await expect.poll(async()=>Number(await details.getAttribute('data-campus-finished-walls'))).toBeGreaterThan(30);
 await expect.poll(async()=>Number(await details.getAttribute('data-campus-estimated-facades'))).toBeGreaterThan(5);
 await expect.poll(async()=>Number(await details.getAttribute('data-campus-facades'))).toBeGreaterThanOrEqual(27);
 await expect.poll(async()=>Number(await hud.getAttribute('data-eye-elevation'))-Number(await hud.getAttribute('data-ground-elevation'))).toBeCloseTo(1.65,2);
 for(const mode of ['map','photo']){
  const options=page.getByRole('button',{name:'Options et lieux',exact:true});
  if(await options.isVisible())await options.click();
  await page.getByLabel('Style de la ville').selectOption(mode);
  await expect(details).toHaveAttribute('data-photo-ground','0');
  await expect.poll(async()=>Number(await details.getAttribute('data-campus-ground'))).toBeGreaterThan(0);
 }
 await page.screenshot({path:`test-results/campus-library-ground-${test.info().project.name}.png`,fullPage:true});
 // Measure inside the browser so Playwright transport latency is not mistaken
 // for movement time. Reduced motion must also keep the eye free of bobbing.
 const measured=await page.evaluate(()=>new Promise<{fps:number;meters:number;seconds:number;maxEyeError:number}>(resolve=>{
  const hud=document.querySelector<HTMLElement>('.walk-hud')!,startMeters=Number(hud.dataset.meters),start=performance.now();let frames=0,maxEyeError=0;
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'s',code:'KeyS',bubbles:true}));
  const sample=(now:number)=>{
   frames++;maxEyeError=Math.max(maxEyeError,Math.abs(Number(hud.dataset.eyeElevation)-Number(hud.dataset.groundElevation)-1.65));
   if(now-start<4000){requestAnimationFrame(sample);return;}
   window.dispatchEvent(new KeyboardEvent('keyup',{key:'s',code:'KeyS',bubbles:true}));
   const seconds=(now-start)/1000;
   resolve({fps:frames/seconds,meters:Number(hud.dataset.meters)-startMeters,seconds,maxEyeError});
  };requestAnimationFrame(sample);
 }));
 console.log('Campus walking sample',test.info().project.name,JSON.stringify(measured));
 expect(measured.meters).toBeGreaterThan(4);expect(measured.maxEyeError).toBeLessThan(.01);
 await page.screenshot({path:`test-results/campus-library-ground-moved-${test.info().project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'Revenir au point de départ'}).click();
 await expect(hud).toHaveAttribute('data-look-pitch','90');
 await page.getByRole('button',{name:'Quitter la marche',exact:true}).click();
 await expect.poll(()=>page.locator('.maplibregl-canvas').evaluate((c:HTMLCanvasElement)=>c.width/c.clientWidth)).toBeCloseTo(originalSize,2);
 expect(errors).toEqual([]);
});
