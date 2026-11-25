import {_electron as electron} from 'playwright';
import executablePath from 'electron';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import {encodeFTree,decodeFTree} from '../js/ftree.mjs';
const dir=await mkdtemp(path.join(tmpdir(),'famtree-test-')),file=path.join(dir,'fixture.famtree'),config=path.join(dir,'config');await mkdir(config);
const person={id:'a',name:'Persona ficticia',birth:'1900',status:'deceased'};
await writeFile(file,encodeFTree({version:1,title:'Documento de prueba',people:[person],relations:[]}));
const errors=[];
let app;
try{
 app=await electron.launch({executablePath,args:['.',file,'--no-sandbox'],env:{...process.env,XDG_CONFIG_HOME:config}});
 const page=await app.firstWindow();page.on('pageerror',e=>errors.push(e.message));
 await page.waitForFunction(()=>document.querySelector('#title')?.textContent==='Documento de prueba');
 await page.waitForFunction(()=>document.querySelector('#sync').textContent.includes('Guardado en este dispositivo'));
 assert.equal(await page.evaluate(()=>typeof window.require),'undefined');assert.equal(await page.evaluate(()=>typeof window.famDesktop.open),'function');
 assert.equal(await page.locator('#countPeople').textContent(),'1');assert.match(await page.locator('#documentName').textContent(),/fixture\.famtree/);
 await page.locator('#add').click();await page.locator('[name="name"]').fill('Otra persona ficticia');await page.locator('#personForm button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('#countPeople').textContent==='2');
 await page.locator('#export').click();await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('Archivo guardado'));
 const stored=decodeFTree(await readFile(file));assert.equal(stored.people.length,2);
 assert.equal(await page.evaluate(async()=>{try{await fetch('https://example.com');return false;}catch{return true;}}),true);
 assert.equal(errors.length,0,errors.join('\n'));console.log('Electron: document launch, isolated renderer, native save, network restriction.');
}finally{if(app)await app.close();await rm(dir,{recursive:true,force:true});}
