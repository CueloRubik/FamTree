const {app,BrowserWindow,Menu,dialog,ipcMain,protocol,session,shell,nativeImage}=require('electron');
const fs=require('node:fs/promises'),syncFs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFile}=require('node:child_process'),{promisify}=require('node:util');
const exec=promisify(execFile),ROOT=path.join(__dirname,'..'),LIMIT=64*1024*1024+64;
const scheme='famtree',origin=scheme+'://app',installed='/Applications/FamTree.app';
protocol.registerSchemesAsPrivileged([{scheme,privileges:{standard:true,secure:true,supportFetchAPI:true,codeCache:true}}]);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const appBundle=process.platform==='darwin'?path.resolve(process.execPath,'../../..'):'';
const canonical=app.isPackaged&&appBundle===installed;
const profile=app.isPackaged?(process.platform==='darwin'&&!canonical?'FamTree-archive-'+hash(appBundle).slice(0,12):'FamTree'):'FamTree-dev-'+hash(ROOT).slice(0,12);
const userDir=path.join(app.getPath('appData'),profile);syncFs.mkdirSync(userDir,{recursive:true});app.setPath('userData',userDir);
let win=null,ready=false,pending=[],chain=Promise.resolve();const handles=new Map();const handleFile=path.join(userDir,'documents.json');
async function restoreHandles(){try{const raw=JSON.parse(await fs.readFile(handleFile,'utf8'));for(const [token,entry] of Object.entries(raw)){if(/^[a-f0-9-]{36}$/.test(token)&&entry&&typeof entry.file==='string'&&path.isAbsolute(entry.file)&&/^[a-f0-9]{64}$/.test(entry.digest))handles.set(token,{file:entry.file,digest:entry.digest,writable:entry.writable===true});}}catch{}}
let handleQueue=Promise.resolve();function persistHandles(){const payload=Buffer.from(JSON.stringify(Object.fromEntries(handles)));handleQueue=handleQueue.catch(()=>{}).then(()=>atomicWrite(handleFile,payload)).catch(()=>{});return handleQueue;}
const ext=p=>/\.(famtree|ftree|json)$/i.test(p);
const nativeDoc=p=>/\.(famtree|ftree)$/i.test(p);
const candidates=args=>args.slice(1).filter(a=>typeof a==='string'&&!a.startsWith('-')&&nativeDoc(a)).map(a=>path.resolve(a));
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.png':'image/png'};
function asset(url){const u=new URL(url);if(u.protocol!==scheme+':'||u.hostname!=='app')return null;const p=decodeURIComponent(u.pathname);if(!/^\/(?:index\.html|(?:js|css|assets|data)\/[a-zA-Z0-9_.-]+)$/.test(p)||p.includes('..'))return null;return path.join(ROOT,p.slice(1));}
async function readDocument(file){if(!ext(file))throw Error('Elige un archivo .famtree, .ftree o .json.');const absolute=await fs.realpath(file),st=await fs.stat(absolute);if(!st.isFile()||st.size>LIMIT)throw Error('El archivo no es válido o supera 64 MiB.');const bytes=await fs.readFile(absolute);if(bytes.length>LIMIT)throw Error('El archivo supera 64 MiB.');const token=crypto.randomUUID();handles.set(token,{file:absolute,digest:hash(bytes),writable:nativeDoc(absolute)});await persistHandles();return {token,key:hash(absolute),name:path.basename(absolute),bytes:new Uint8Array(bytes),writable:nativeDoc(absolute)};}
async function atomicWrite(file,bytes){const tmp=path.join(path.dirname(file),'.famtree-'+crypto.randomUUID()+'.tmp');try{const f=await fs.open(tmp,'wx',0o600);try{await f.writeFile(bytes);await f.sync();}finally{await f.close();}await fs.rename(tmp,file);}finally{await fs.unlink(tmp).catch(()=>{});}}
function trusted(event){if(!win||event.sender!==win.webContents||event.senderFrame?.url!==origin+'/index.html')throw Error('Origen no autorizado.');}
function validateBytes(raw){if(!(raw instanceof Uint8Array)||raw.byteLength>LIMIT||raw.byteLength<20)throw Error('Archivo binario inválido.');const b=Buffer.from(raw);if(!b.subarray(0,8).equals(Buffer.from([70,84,82,69,69,13,10,26]))||b.readUInt32LE(12)!==b.length-20)throw Error('Cabecera binaria inválida.');return b;}
async function forward(file){
 if(process.platform!=='darwin'||!app.isPackaged||canonical||!nativeDoc(file))return false;
 try{if(await fs.realpath(appBundle)===await fs.realpath(installed))return false;const {stdout}=await exec('/usr/libexec/PlistBuddy',['-c','Print :CFBundleIdentifier',path.join(installed,'Contents/Info.plist')]);if(stdout.trim()!=='com.cuelorubik.famtree')return false;await exec('/usr/bin/open',['-a',installed,path.resolve(file)]);return true;}catch{return false;}
}
function sendCommand(command){if(ready&&win&&!win.isDestroyed())win.webContents.send('famtree:command',command);}
function flush(){if(!ready||!win)return;while(pending.length){const file=pending.shift();chain=chain.then(async()=>{if(await forward(file))return;try{const doc=await readDocument(file);win.webContents.send('famtree:document',doc);win.show();win.focus();}catch(e){dialog.showErrorBox('No se pudo abrir el árbol',e.message);}});}}
function enqueue(file){if(typeof file==='string'&&nativeDoc(file)){pending.push(path.resolve(file));flush();}}
app.on('open-file',(e,file)=>{e.preventDefault();enqueue(file);});
for(const f of candidates(process.argv))enqueue(f);
const lock=app.requestSingleInstanceLock();
if(!lock){app.quit();}else{
 app.on('second-instance',(_e,args)=>{for(const f of candidates(args))enqueue(f);if(win){if(win.isMinimized())win.restore();win.show();win.focus();}});
 app.whenReady().then(async()=>{await restoreHandles();
  protocol.handle(scheme,async request=>{try{const file=asset(request.url);if(!file||request.method!=='GET')return new Response('Not found',{status:404});return new Response(await fs.readFile(file),{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff'}});}catch{return new Response('Not found',{status:404});}});
  session.defaultSession.setPermissionRequestHandler((_w,_p,cb)=>cb(false));session.defaultSession.setPermissionCheckHandler(()=>false);
  session.defaultSession.webRequest.onBeforeRequest((d,cb)=>cb({cancel:!d.url.startsWith(origin+'/')&&!d.url.startsWith('blob:')&&!d.url.startsWith('data:')}));
  ipcMain.handle('famtree:open',async e=>{trusted(e);const r=await dialog.showOpenDialog(win,{properties:['openFile'],filters:[{name:'Árbol FamTree',extensions:['famtree','ftree','json']}]});return r.canceled?null:readDocument(r.filePaths[0]);});
  ipcMain.handle('famtree:save',async(e,raw,token,name,saveAs)=>{trusted(e);const bytes=validateBytes(raw),old=typeof token==='string'?handles.get(token):null;let file;
   if(old?.writable&&!saveAs){file=old.file;let digest;try{const st=await fs.stat(file);if(st.size>LIMIT)throw Error('Archivo cambiado');digest=hash(await fs.readFile(file));}catch{digest=null;}if(digest!==old.digest){const answer=await dialog.showMessageBox(win,{type:'warning',buttons:['Cancelar','Guardar como…'],defaultId:0,cancelId:0,message:'El archivo original cambió fuera de FamTree.',detail:'Guarda una copia con otro nombre para no perder cambios externos.'});if(answer.response===0)return null;file=null;}}
   if(!file){const safe=String(name||'Familia.ftree').replace(/[\\/:*?"<>|]/g,'_').slice(0,180);const r=await dialog.showSaveDialog(win,{defaultPath:path.join(app.getPath('documents'),safe),filters:[{name:'Árbol FamTree',extensions:['ftree']}]});if(r.canceled)return null;file=/\.ftree$/i.test(r.filePath)?r.filePath:r.filePath+'.ftree';if(file!==r.filePath){try{await fs.access(file);const q=await dialog.showMessageBox(win,{type:'warning',buttons:['Cancelar','Reemplazar'],cancelId:0,defaultId:0,message:'Ya existe un archivo con ese nombre.'});if(q.response!==1)return null;}catch{}}}
   await atomicWrite(file,bytes);const next=crypto.randomUUID();handles.set(next,{file,digest:hash(bytes),writable:true});await persistHandles();return {token:next,key:hash(file),name:path.basename(file),writable:true};
  });
  ipcMain.handle('famtree:pdf',async(e,name)=>{trusted(e);const safe=String(name||'FamTree').replace(/[\\/:*?"<>|]/g,'_').slice(0,150);const out=await dialog.showSaveDialog(win,{defaultPath:safe+'.pdf',filters:[{name:'Informe PDF',extensions:['pdf']}]});if(out.canceled||!out.filePath)return false;const bytes=await win.webContents.printToPDF({pageSize:'A4',printBackground:true,preferCSSPageSize:true});await fs.writeFile(out.filePath,bytes);return true;});
  ipcMain.handle('famtree:editText',(e,cmd)=>{trusted(e);if(['copy','paste','selectAll'].includes(cmd))win.webContents[cmd]();});
  ipcMain.on('famtree:ready',e=>{try{trusted(e);ready=true;flush();}catch{}});
  ipcMain.handle('famtree:profile',e=>{trusted(e);return {installed:canonical,packaged:app.isPackaged,version:app.getVersion()};});
  if(process.platform==='darwin'&&app.dock){const img=nativeImage.createFromPath(path.join(ROOT,'build','icon.png'));if(!img.isEmpty())app.dock.setIcon(img);}
  createWindow();createMenu();
 });
 app.on('activate',()=>{if(!win)createWindow();});
 app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
}
function createWindow(){ready=false;win=new BrowserWindow({width:1280,height:820,minWidth:380,minHeight:430,backgroundColor:'#f4f5f1',show:false,title:'FamTree',webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true,spellcheck:false}});
 win.webContents.on('did-start-loading',()=>{ready=false;});win.webContents.on('will-navigate',(e,url)=>{if(url!==origin+'/index.html')e.preventDefault();});win.webContents.on('will-attach-webview',e=>e.preventDefault());
 win.webContents.setWindowOpenHandler(({url})=>{try{const u=new URL(url);if(u.protocol==='https:'&&['www.familysearch.org','familysearch.org'].includes(u.hostname)&&!u.username&&!u.password&&!u.port)shell.openExternal(u.href).catch(()=>{});}catch{}return {action:'deny'};});
 win.once('ready-to-show',()=>win.show());win.on('closed',()=>{win=null;ready=false;});win.loadURL(origin+'/index.html');
}
function createMenu(){const file={label:'Archivo',submenu:[{label:'Nuevo árbol',accelerator:'CmdOrCtrl+N',click:()=>sendCommand('new')},{label:'Abrir…',accelerator:'CmdOrCtrl+O',click:()=>sendCommand('open')},{label:'Guardar archivo',accelerator:'CmdOrCtrl+S',click:()=>sendCommand('save')},{label:'Volver a Inicio',click:()=>sendCommand('home')},{label:'Exportar informe PDF',click:()=>sendCommand('report')},{label:'Historial y recuperación',click:()=>sendCommand('history')},{label:'Exportar copia protegida',click:()=>sendCommand('protect')},{label:'Guardar como…',accelerator:'CmdOrCtrl+Shift+S',click:()=>sendCommand('saveAs')},{type:'separator'},{role:'close',label:'Cerrar ventana'}]};
 const edit={label:'Edición',submenu:[{label:'Deshacer en el árbol',click:()=>sendCommand('undo')},{label:'Rehacer en el árbol',click:()=>sendCommand('redo')},{role:'undo',label:'Deshacer texto'},{role:'redo',label:'Rehacer texto'},{type:'separator'},{role:'cut',label:'Cortar'},{label:'Copiar',accelerator:'CmdOrCtrl+C',click:()=>sendCommand('copy')},{label:'Pegar',accelerator:'CmdOrCtrl+V',click:()=>sendCommand('paste')},{label:'Seleccionar todo',accelerator:'CmdOrCtrl+A',click:()=>sendCommand('selectAll')},{label:'Duplicar selección',accelerator:'CmdOrCtrl+D',click:()=>sendCommand('duplicate')}]};
 const tools={label:'Herramientas',submenu:[{label:'Revisión',click:()=>sendCommand('review')},{label:'Configuración',click:()=>sendCommand('settings')}]};
 const view={label:'Vista',submenu:[{label:'Ampliar área de trabajo',click:()=>sendCommand('focus')},{label:'Presentación familiar',click:()=>sendCommand('present')},{label:'Encuadrar árbol',click:()=>sendCommand('fit')},{label:'Buscar personas',accelerator:'CmdOrCtrl+F',click:()=>sendCommand('search')},{role:'togglefullscreen',label:'Pantalla completa'}]};
 Menu.setApplicationMenu(Menu.buildFromTemplate([...(process.platform==='darwin'?[{label:'FamTree',submenu:[{role:'about',label:'Acerca de FamTree'},{type:'separator'},{role:'hide',label:'Ocultar FamTree'},{role:'quit',label:'Salir de FamTree'}]}]:[]),file,edit,view,tools]));
}
