import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {decodeFTree} from '../js/ftree.mjs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900},acceptDownloads:true});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.type()==='prompt'?d.accept('Proyecto renombrado'):d.accept());
const saved=()=>page.waitForFunction(()=>document.querySelector('#sync').textContent.includes('Guardado en este dispositivo'));
const menu=async()=>{if(await page.locator('#sideMenu').isHidden())await page.locator('#menuToggle').click();};
async function create(title){await page.locator('#localMode').click();await page.locator('#newProjectForm input').fill(title);await page.locator('#newProjectForm button').click();await page.waitForFunction(t=>document.querySelector('#title').textContent===t,title);await saved();await page.waitForFunction(()=>!document.querySelector('#projectDialog').open);}
async function add(name,status,birth,notes,publish=false,trigger='#add'){
 if(trigger==='#quickChild')await page.locator('#familyMenu').click();await page.locator(trigger).click();await page.locator('[name="name"]').fill(name);await page.locator('[name="status"]').selectOption(status);await page.locator('[name="birth"]').fill(birth);await page.locator('[name="notes"]').fill(notes);await page.locator('#personForm button[type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#personDialog').open);await saved();
}
try{
 await page.goto('http://127.0.0.1:8000');await page.waitForFunction(()=>document.querySelector('#modeBadge').textContent.includes('Ejemplo'));
 assert.equal(await page.locator('.leaf-node').count(),10);
 await page.locator('#welcomeClose').click();await page.locator('#searchToggle').click();await page.locator('#query').fill('Julian');await page.locator('#results button').first().click();assert.match(await page.locator('#detail h2').textContent(),/Julián/);
 await menu();await page.locator('#scope').selectOption('descendants');assert.equal(await page.locator('.leaf-node').count(),7);
 await page.locator('[data-view="directory"]').click();assert.equal(await page.locator('#directory .person-row').count(),1);
 await page.locator('#searchToggle').click();await page.locator('#query').fill('');assert.equal(await page.locator('#directory .person-row').count(),10);await page.locator('#searchToggle').click();
 await menu();await page.locator('[data-view="timeline"]').click();assert.ok(await page.locator('#timeline .event').count()>10);
 await create('Proyecto A');assert.equal(await page.locator('.leaf-node').count(),0);
 await add('Persona ficticia uno','deceased','1900','nota privada',true);
 await add('Persona ficticia dos','living','2000','dato ficticio privado',false,'#quickChild');
 assert.equal(await page.locator('.leaf-node').count(),2);assert.equal(await page.locator('#countLinks').textContent(),'1');
 await page.locator('#undo').click();await saved();assert.equal(await page.locator('#countLinks').textContent(),'0');
 await page.locator('#redo').click();await saved();assert.equal(await page.locator('#countLinks').textContent(),'1');
 await page.locator('#fit').click();const child=page.getByRole('button',{name:/Persona ficticia dos, 2000/});await child.click();
 await page.getByRole('button',{name:'Editar',exact:true}).click();await page.locator('[name="name"]').fill('Persona ficticia dos editada');await page.locator('#personForm button[type=submit]').click();await saved();assert.match(await page.locator('#detail h2').textContent(),/editada/);
 await page.locator('#clearSelection').click();await page.locator('#fit').click();
 const node=page.getByRole('button',{name:/Persona ficticia dos editada, 2000/}),before=await node.boundingBox(),oldPath=await page.locator('.branch-wood').first().getAttribute('d');
 await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();await page.mouse.move(before.x+before.width/2+100,before.y+before.height/2+40,{steps:8});await page.mouse.up();await saved();
 const after=await node.boundingBox();assert.ok(after.x-before.x>80);assert.notEqual(await page.locator('.branch-wood').first().getAttribute('d'),oldPath);
 const panBefore=await page.locator('#world').evaluate(x=>x.style.transform);const v=await page.locator('#viewport').boundingBox();await page.mouse.move(v.x+30,v.y+v.height-30);await page.mouse.down();await page.mouse.move(v.x+100,v.y+v.height-65,{steps:5});await page.mouse.up();assert.notEqual(await page.locator('#world').evaluate(x=>x.style.transform),panBefore);
 const zoomBefore=await page.locator('#scaleText').textContent();await page.mouse.move(v.x+100,v.y+100);await page.mouse.wheel(0,-100);await page.waitForFunction(z=>document.querySelector('#scaleText').textContent!==z,zoomBefore);
 const dl=page.waitForEvent('download');await page.locator('#export').click();const privateFile=await dl;assert.match(privateFile.suggestedFilename(),/\.ftree$/);const privateData=decodeFTree(readFileSync(await privateFile.path()));assert.equal(privateData.people.length,2);assert.equal(Object.keys(privateData.positions).length,2);
 await page.reload();await saved();assert.equal(await page.locator('#title').textContent(),'Proyecto A');assert.equal(await page.locator('#countPeople').textContent(),'2');
 const childId=privateData.people.find(p=>p.name.includes('editada')).id;assert.ok(Math.abs(await page.locator('[data-person="'+childId+'"]').evaluate(x=>parseFloat(x.style.left))-privateData.positions[childId].x)<0.001);
 const persisted=await page.evaluate(async()=>{const {loadProject}=await import('/js/projects.mjs');return (await loadProject(localStorage.getItem('famtree-active'))).data;});assert.deepEqual(persisted,privateData);
 const staleRejected=await page.evaluate(async()=>{const {loadProject,saveProject}=await import('/js/projects.mjs');const id=localStorage.getItem('famtree-active'),row=await loadProject(id);try{await saveProject(id,row.data,row.revision-1);return false;}catch(e){return e.message.includes('otra pestaña');}});assert.equal(staleRejected,true);
 assert.equal(await page.locator('#publish').count(),0);assert.equal(privateData.people.length,2);
 await create('Proyecto B');assert.equal(await page.locator('#countPeople').textContent(),'0');await page.locator('#localMode').click();await page.locator('#projectList .project-row').first().waitFor();assert.equal(await page.locator('#projectList .project-row').count(),2);
 await page.getByRole('button',{name:'Renombrar Proyecto B'}).click();await page.locator('#renameForm input').fill('Proyecto renombrado');await page.locator('#renameForm button[type=submit]').click();await page.getByRole('button',{name:'Duplicar Proyecto renombrado'}).waitFor();
 await page.getByRole('button',{name:'Duplicar Proyecto renombrado'}).click();await page.waitForFunction(()=>document.querySelector('#title').textContent.includes('copia'));await saved();await page.waitForFunction(()=>!document.querySelector('#projectDialog').open);assert.match(await page.locator('#title').textContent(),/copia/);
 await page.locator('#localMode').click();await page.getByRole('button',{name:'Eliminar Proyecto renombrado (copia)',exact:true}).click();await page.waitForFunction(()=>document.querySelectorAll('#projectList .project-row').length===2);await page.locator('#closeProjects').click();
 await page.locator('#file').setInputFiles({name:'copia.ftree',mimeType:'application/octet-stream',buffer:readFileSync(await privateFile.path())});await page.waitForFunction(()=>document.querySelector('#title').textContent==='Proyecto A');await saved();assert.equal(await page.locator('#countPeople').textContent(),'2');
 const bad=Buffer.from(readFileSync(await privateFile.path()));bad[bad.length-1]^=1;await page.locator('#file').setInputFiles({name:'dañado.ftree',mimeType:'application/octet-stream',buffer:bad});await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('dañado'));assert.equal(await page.locator('#countPeople').textContent(),'2');
 await page.locator('#file').setInputFiles({name:'old.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({...privateData,title:'Árbol antiguo'}))});await page.waitForFunction(()=>document.querySelector('#title').textContent==='Árbol antiguo');await saved();
 await page.locator('[data-view="review"]').click();assert.ok(await page.locator('#review .review-group').count()>=5);await page.locator('[data-view="directory"]').click();await page.locator('#directoryFilter').selectOption('living');assert.equal(await page.locator('#directory .person-row').count(),1);await page.locator('#directoryFilter').selectOption('all');await page.locator('[data-view="tree"]').click();await page.locator('#theme').click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
 await menu();await page.locator('#demoMode').click();await page.setViewportSize({width:390,height:844});await page.locator('#welcomeClose').click();await page.locator('#fit').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2));
 assert.equal(errors.length,0,errors.join('\n'));console.log('Browser checks: projects, binary, corruption, reopening, drag, pan, zoom, local data, legacy import, mobile.');
}finally{await browser.close();}
