import {test,expect} from '@playwright/test';
test('search, category filter, place details and empty state',async({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{level:1})).toContainText('La ville');
 await expect(page.getByRole('button',{name:/Gare de Montbéliard/})).toBeVisible();
 await page.getByRole('button',{name:'Nature',exact:true}).click();
 await expect(page.getByRole('button',{name:/Parc du Près-la-Rose/})).toBeVisible();
 await expect(page.getByRole('button',{name:/Gare de Montbéliard/})).toHaveCount(0);
 await page.getByRole('button',{name:'Tout',exact:true}).click();
 await page.getByRole('textbox',{name:'Rechercher un lieu'}).fill('gare');
 await expect(page.getByRole('button',{name:/Gare de Montbéliard/})).toBeVisible();
 await expect(page.getByRole('button',{name:/Parc du Près-la-Rose/})).toHaveCount(0);
 await page.getByRole('button',{name:/Gare de Montbéliard/}).click();
 await expect(page.getByRole('heading',{name:'Gare de Montbéliard'})).toBeVisible();
 await expect(page.getByText('Accessibilité non vérifiée',{exact:true})).toBeVisible();
 await expect(page.getByRole('region',{name:'Lieux à proximité'}).getByRole('button',{name:/Château des ducs/})).toBeVisible();
 await page.getByRole('button',{name:'Fermer les détails'}).click();
 await page.getByRole('textbox',{name:'Rechercher un lieu'}).fill('unfindable');
 await expect(page.getByText('Aucun lieu trouvé.',{exact:false})).toBeVisible();
 await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:`test-results/explorer-${test.info().project.name}.png`,fullPage:true});
});
test('search outage shows actionable feedback',async({page})=>{
 await page.route('**/api/search?**',r=>r.fulfill({status:503,body:'{}'}));
 await page.goto('/');
 await page.getByRole('textbox',{name:'Rechercher un lieu'}).fill('gare');
 await expect(page.getByText('Recherche indisponible.',{exact:false})).toBeVisible();
});
test('route controls display engine results and directions (controlled response)',async({page})=>{
 await page.route('**/api/routes?**',r=>r.fulfill({json:{engine:'Valhalla',distanceMeters:820,durationSeconds:620,geometry:{type:'LineString',coordinates:[[6.8011,47.5105],[6.8049,47.5057]]},instructions:[{text:'Continuez vers le parc.',distanceMeters:820}],accessibility:'unknown'}}));
 await page.goto('/');
 await page.getByRole('button',{name:/Parc du Près-la-Rose/}).click();
 await page.getByLabel('Lieu de départ').selectOption('gare');
 await expect(page.getByText('820 m · 11 min',{exact:true})).toBeVisible();
 await expect(page.getByText('Continuez vers le parc.',{exact:false})).toBeVisible();
 await expect(page.getByText('Accessibilité du trajet non vérifiée.',{exact:false})).toBeVisible();
});
test('route outage does not fabricate an itinerary',async({page})=>{
 await page.route('**/api/routes?**',r=>r.fulfill({status:503,json:{message:'Routing unavailable'}}));
 await page.goto('/');
 await page.getByRole('button',{name:/Parc du Près-la-Rose/}).click();
 await page.getByLabel('Lieu de départ').selectOption('gare');
 await expect(page.getByText('Le service de calcul est indisponible.',{exact:false})).toBeVisible();
});
test('saved places survive reload, can be reopened with keyboard, and can be removed',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Parc du Près-la-Rose/}).click();
 await page.getByRole('button',{name:'Enregistrer ce lieu',exact:true}).click();
 await expect(page.getByRole('button',{name:'Retirer des favoris',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.reload();
 const saved=page.getByRole('region',{name:'Lieux enregistrés'});
 const park=saved.getByRole('button',{name:'Parc du Près-la-Rose Nature',exact:true});
 await expect(park).toBeVisible();
 await park.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('heading',{name:'Parc du Près-la-Rose'})).toBeVisible();
 await page.getByRole('button',{name:'Retirer des favoris',exact:true}).click();
 await page.reload();
 await expect(saved.getByRole('button',{name:/Parc du Près-la-Rose/})).toHaveCount(0);
 await expect(saved.getByText('0/50')).toBeVisible();
});
test('invalid stored places are filtered and the saved list is capped',async({page})=>{
 await page.addInitScript(()=>{
  const valid={id:'gare',name:'Gare de Montbéliard',category:'Transport',coordinates:[6.8011,47.5105]};
  localStorage.setItem('citysense.saved-places.v1',JSON.stringify([valid,valid,{...valid,id:'outside',coordinates:[0,0]},...Array.from({length:60},(_,i)=>({...valid,id:`fixture-${i}`,name:`Lieu ${i}`}))]));
 });
 await page.goto('/');
 const saved=page.getByRole('region',{name:'Lieux enregistrés'});
 await expect(saved.getByText('50/50')).toBeVisible();
 await expect(saved.locator('li')).toHaveCount(50);
 await page.getByRole('button',{name:/Parc du Près-la-Rose/}).click();
 await page.getByRole('button',{name:'Enregistrer ce lieu',exact:true}).click();
 await expect(page.getByText('Votre liste contient 50 lieux.',{exact:false})).toBeVisible();
 await expect(saved.getByRole('button',{name:/Parc du Près-la-Rose/})).toHaveCount(0);
});
test('blocked browser storage keeps places usable for the current visit',async({page})=>{
 await page.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Unavailable','QuotaExceededError');};});
 await page.goto('/');
 await page.getByRole('button',{name:/Parc du Près-la-Rose/}).click();
 await page.getByRole('button',{name:'Enregistrer ce lieu',exact:true}).click();
 await expect(page.getByRole('region',{name:'Lieux enregistrés'}).getByRole('button',{name:'Parc du Près-la-Rose Nature',exact:true})).toBeVisible();
 await expect(page.getByText('Stockage local indisponible :',{exact:false})).toBeVisible();
});
