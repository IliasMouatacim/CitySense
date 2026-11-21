import {expect,test} from '@playwright/test';

test('campus starts with the textured player, supports orbit in place and restores the aerial view',async({page},info)=>{
 test.setTimeout(180000);
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const loaded=page.waitForResponse(r=>r.url().endsWith('/city/player.glb')&&r.ok());
 await page.goto('/');await loaded;
 const hud=page.locator('.walk-hud');
 await expect(hud).toHaveAttribute('data-perspective','third-person');
 await expect(hud).toHaveAttribute('data-player-heading',/\d/,{timeout:60000});
 await expect.poll(async()=>Number(await hud.getAttribute('data-camera-distance'))).toBeGreaterThan(.42);
 const heading=Number(await hud.getAttribute('data-heading'));
 const facing=await hud.getAttribute('data-player-heading');
 const canvas=page.locator('.maplibregl-canvas'),rect=(await canvas.boundingBox())!;
 const y=rect.y+rect.height*.46,dx=Math.min(240,rect.width*.52);
 let remaining=180/.13;
 while(remaining>0){
  const step=Math.min(remaining,dx),x=rect.x+(rect.width-step)/2;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+step,y);await page.mouse.up();
  remaining-=step;
 }
 await expect.poll(async()=>Math.abs(((Number(await hud.getAttribute('data-heading'))-heading+540)%360)-180)).toBeGreaterThan(170);
 await expect(hud).toHaveAttribute('data-player-heading',facing!);
 await expect(hud).toHaveAttribute('data-meters','0');
 await page.screenshot({path:info.outputPath('player-front.png')});
 await page.getByRole('button',{name:'Revenir au point de départ'}).click();
 await page.screenshot({path:info.outputPath('player-back.png')});
 await page.keyboard.down('w');
 try{await expect.poll(async()=>Number(await hud.getAttribute('data-meters'))).toBeGreaterThan(.4);}
 finally{await page.keyboard.up('w');}
 await expect(page.locator('.walk-error')).toHaveCount(0);
 await page.getByRole('button',{name:'Quitter la marche'}).click();await expect(hud).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Marcher dans la ville',exact:true})).toBeVisible();
 expect(errors).toEqual([]);
});
