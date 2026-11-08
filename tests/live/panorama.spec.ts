import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
test('controlled equirectangular photo opens an interactive panorama and exits safely',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://api.panoramax.xyz/api/search?**',route=>route.fulfill({json:{type:'FeatureCollection',features:[{type:'Feature',id:'synthetic-panorama-fixture',geometry:{type:'Point',coordinates:[6.7982,47.5102]},providers:[{name:'Synthetic test fixture',roles:['producer']}],properties:{'pers:interior_orientation':{field_of_view:360},datetime:'2025-01-01T00:00:00Z',license:'CC0-1.0'},assets:{hd:{href:'https://fixture.panoramax.test/panorama.jpg',type:'image/jpeg',roles:['visual']}}}]}}));
 await page.route('https://fixture.panoramax.test/panorama.jpg',route=>route.fulfill({contentType:'image/jpeg',headers:{'access-control-allow-origin':'*'},body:readFileSync('tests/fixtures/equirectangular-test.jpg')}));
 await page.goto('/');await expect(page.locator('.map')).toHaveAttribute('data-ready','true');await page.getByRole('button',{name:'Marcher dans la ville'}).click();await expect(page.locator('.walk-hud')).toHaveAttribute('data-lon',/\d/);await page.getByRole('button',{name:'Photos des rues'}).click();
 const dialog=page.getByRole('dialog',{name:'Photos réelles des rues'});await expect(dialog.locator('.psv-container')).toBeVisible();await expect(dialog.locator('canvas')).toBeVisible();await expect(dialog).toContainText('Synthetic test fixture');await page.getByRole('button',{name:'Reprendre la marche'}).click();await expect(dialog).toHaveCount(0);await expect(page.locator('.walk-hud')).toBeVisible();expect(errors).toEqual([]);
});
