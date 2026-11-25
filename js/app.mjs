import {blank,validate,validatePublic,publicCopy,removePerson,related,searchPeople,layout} from './model.mjs';

const $=id=>document.getElementById(id);
const svgNS='http://www.w3.org/2000/svg';
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
function icon(name){const e=document.createElementNS(svgNS,'svg');e.setAttribute('class','icon');e.setAttribute('aria-hidden','true');const u=document.createElementNS(svgNS,'use');u.setAttribute('href','assets/icons.svg#'+name);e.append(u);return e}
function svg(tag,attrs){const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e}
function button(label,ico,fn,cls='icon-button'){const b=make('button',cls);b.type='button';b.title=label;b.setAttribute('aria-label',label);b.append(icon(ico));if(cls!=='icon-button')b.append(document.createTextNode(label));b.addEventListener('click',fn);return b}
const statusNames={living:'Vive · privado',deceased:'Falleció',unknown:'Estado desconocido · privado'};
let mode='public',publicData=blank(),demoData=blank(),localData=null,selected=null,view='tree',zoom=1,graph=layout(blank()),history=[],future=[],editing=null,toastTimer,autoDemo=false,refreshing=false,dirty=false;
const data=()=>mode==='local'?localData:mode==='demo'?demoData:publicData;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000)}
function initials(p){return p.name.trim().split(/\s+/).slice(0,2).map(s=>Array.from(s)[0]||'').join('').toUpperCase()}
function dates(p){return [p.birth,p.death].filter(Boolean).join(' – ')||'Fechas sin registrar'}
function avatar(p,large=false){return make('span','avatar'+(large?' portrait':''),initials(p))}
function person(id){return data().people.find(p=>p.id===id)}
function download(d,filename){const url=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)+'\n'],{type:'application/json'}));const a=make('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function setMode(next,automatic=false){
 if(next==='local'&&!localData)localData=mode==='public'?validate(publicData):blank();
 mode=next;if(!automatic)autoDemo=false;selected=null;$('query').value='';$('scope').value='all';view='tree';render(true);
}
function commit(next){if(mode!=='local')return;const validated=validate(next);history.push(localData);if(history.length>60)history.shift();future=[];localData=validated;dirty=true;if(!person(selected))selected=null;render(false)}
function undo(){if(mode!=='local'||!history.length)return;future.push(localData);localData=history.pop();dirty=true;if(!person(selected))selected=null;render(false)}
function redo(){if(mode!=='local'||!future.length)return;history.push(localData);localData=future.pop();dirty=true;if(!person(selected))selected=null;render(false)}
function refreshControls(){
 const local=mode==='local';$('modeBadge').replaceChildren(icon(local?'lock':mode==='demo'?'leaf':'globe'),document.createTextNode(local?'Taller privado':mode==='demo'?'Ejemplo ficticio':'Archivo público'));
 for(const m of ['public','demo','local']){$(m+'Mode').classList.toggle('mode-active',mode===m);$(m+'Mode').setAttribute('aria-pressed',String(mode===m))}
 for(const id of ['add','export','publish'])$(id).disabled=!local;
 $('undo').disabled=!local||!history.length;$('redo').disabled=!local||!future.length;
 $('scope').disabled=!selected||view!=='tree';
 $('title').textContent=data().title;
 $('subtitle').textContent=local?'Edición privada en esta pestaña · guarda una copia JSON.':mode==='demo'?'Diez personas inventadas para conocer FamTree.':'Explora las ramas y sus historias.';
 $('countPeople').textContent=data().people.length;$('countGen').textContent=layout(data()).generations;$('countLinks').textContent=data().relations.length;
 for(const n of document.querySelectorAll('[data-view]')){const active=n.dataset.view===view;n.classList.toggle('active',active);if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current')}
 for(const v of ['tree','directory','timeline'])$(v+'View').hidden=v!==view;
}
function render(fit=false){refreshControls();renderResults();if(view==='tree')renderTree(fit);else if(view==='directory')renderDirectory();else renderTimeline();renderDetail()}
function selectPerson(id,center=false){if(!person(id))return;selected=id;render(false);if(center&&view==='tree')centerPerson(id);if(window.innerWidth<=900&&center)$('detail').scrollIntoView({block:'nearest',behavior:'auto'})}
function matchSet(){return new Set(searchPeople(data(),$('query').value).map(p=>p.id))}
function renderResults(){
 const q=$('query').value.trim(),box=$('results');box.replaceChildren();box.hidden=!q||view!=='tree';if(box.hidden)return;
 const results=searchPeople(data(),q);if(!results.length){box.append(make('p','muted','Sin coincidencias.'));return}
 for(const p of results.slice(0,40)){const b=make('button','result');b.type='button';b.append(make('span','',p.name),icon('chevron'));b.addEventListener('click',()=>{ $('scope').value='all';selectPerson(p.id,true)});box.append(b)}
 if(results.length>40)box.append(make('p','muted','Mostrando 40 de '+results.length+' coincidencias.'));
}
function renderTree(fit){
 const scope=$('scope').value;graph=layout(data(),selected&&scope!=='all'?related(data(),selected,scope):null);
 const branches=$('branches'),nodes=$('nodes');branches.replaceChildren();nodes.replaceChildren();
 $('world').style.width=graph.width+'px';$('world').style.height=graph.height+'px';branches.setAttribute('width',graph.width);branches.setAttribute('height',graph.height);
 $('empty').hidden=graph.people.length>0;
 const levels=new Set([...graph.positions.values()].map(p=>p.depth));
 for(const level of levels){const label=svg('text',{x:18,y:45+level*176,class:'generation'});label.textContent='GENERACIÓN '+(level+1);branches.append(label)}
 for(const r of graph.edges){
  const a=graph.positions.get(r.from),b=graph.positions.get(r.to);let d;
  if(r.type==='parent'){const ay=a.y+41,by=b.y-41,mid=(ay+by)/2;d='M '+a.x+' '+ay+' C '+a.x+' '+mid+', '+b.x+' '+mid+', '+b.x+' '+by}
  else if(a.y===b.y){const ax=a.x+(a.x<b.x?92:-92),bx=b.x+(a.x<b.x?-92:92);const sameRow=Math.abs(a.x-b.x)<=218;d=sameRow?'M '+ax+' '+a.y+' L '+bx+' '+b.y:'M '+a.x+' '+(a.y-41)+' C '+a.x+' '+(a.y-79)+', '+b.x+' '+(b.y-79)+', '+b.x+' '+(b.y-41)}
  else{const right=Math.max(a.x,b.x)+105;d='M '+(a.x+92)+' '+a.y+' C '+right+' '+a.y+', '+right+' '+b.y+', '+(b.x+92)+' '+b.y}
  branches.append(svg('path',{d,class:'branch '+(r.type==='partner'?'partner ':'')+(r.from===selected||r.to===selected?'highlight':'')}));
 }
 const matches=matchSet(),q=$('query').value.trim();
 for(const p of graph.people){const pos=graph.positions.get(p.id),b=make('button','leaf-node'+(p.id===selected?' selected':'')+(q?(matches.has(p.id)?' match':' dim'):''));b.type='button';b.style.left=pos.x+'px';b.style.top=pos.y+'px';b.dataset.person=p.id;b.title=p.name+' · '+dates(p);b.setAttribute('aria-label',p.name+', '+dates(p));b.setAttribute('aria-pressed',String(selected===p.id));const t=make('span','node-text');t.append(make('strong','',p.name),make('small','',dates(p)));b.append(avatar(p),t);b.addEventListener('click',()=>selectPerson(p.id));nodes.append(b)}
 if(fit)fitTree();else applyZoom(zoom,false);
}
function applyZoom(next,anchor=true){
 const v=$('viewport'),old=zoom,wx=(v.scrollLeft+v.clientWidth/2)/old,wy=(v.scrollTop+v.clientHeight/2)/old;
 zoom=Math.max(.015,Math.min(1.6,next));$('world').style.transform='scale('+zoom+')';$('stage').style.width=Math.ceil(graph.width*zoom)+'px';$('stage').style.height=Math.ceil(graph.height*zoom)+'px';$('scaleText').textContent=Math.round(zoom*100)+'%';
 if(anchor){v.scrollLeft=wx*zoom-v.clientWidth/2;v.scrollTop=wy*zoom-v.clientHeight/2}
 $('zoomIn').disabled=zoom>=1.6;$('zoomOut').disabled=zoom<=.015;
}
function fitTree(){const v=$('viewport');if(!v.clientWidth)return;applyZoom(Math.min(1,(v.clientWidth-14)/graph.width,(v.clientHeight-14)/graph.height),false);v.scrollLeft=0;v.scrollTop=0}
function centerPerson(id){const p=graph.positions.get(id),v=$('viewport');if(!p)return;if(zoom<.65)applyZoom(.85,false);v.scrollLeft=p.x*zoom-v.clientWidth/2;v.scrollTop=p.y*zoom-v.clientHeight/2}
function row(p,sub){const b=make('button','person-row');b.type='button';const txt=make('span');txt.append(make('strong','',p.name),make('small','',sub));b.append(avatar(p),txt,icon('chevron'));b.addEventListener('click',()=>selectPerson(p.id,true));return b}
function renderDirectory(){const box=$('directory');box.replaceChildren();const people=searchPeople(data(),$('query').value).sort((a,b)=>a.name.localeCompare(b.name,'es'));if(!people.length)box.append(make('p','','No hay personas que mostrar.'));for(const p of people)box.append(row(p,dates(p)+(p.place?' · '+p.place:'')))}
function year(s){const m=s.match(/\b(\d{3,4})\b/);return m?Number(m[1]):null}
function renderTimeline(){const box=$('timeline');box.replaceChildren();const events=[];for(const p of searchPeople(data(),$('query').value))for(const [key,label] of [['birth','Nacimiento'],['death','Fallecimiento']])if(p[key])events.push({p,label,date:p[key],year:year(p[key])});events.sort((a,b)=>(a.year===null?Infinity:a.year)-(b.year===null?Infinity:b.year)||a.p.name.localeCompare(b.p.name,'es'));if(!events.length)box.append(make('p','','No hay acontecimientos con fecha.'));for(const e of events){const item=make('div','event'),t=make('time','',e.year===null?'Sin año':String(e.year));item.append(t,row(e.p,e.label+' · '+e.date));box.append(item)}}
function section(box,title){const s=make('section','detail-section');s.append(make('h3','',title));box.append(s);return s}
function fact(box,label,value){if(!value)return;const d=make('dl','fact');d.append(make('dt','',label),make('dd','',value));box.append(d)}
function renderDetail(){
 const box=$('detail'),p=person(selected);box.replaceChildren();$('clearSelection').disabled=!p;
 if(!p){const empty=make('div','detail-empty');empty.append(icon('leaf'),make('h3','','Cada rama tiene una historia'),make('p','','Selecciona a una persona para consultar sus fechas, vínculos y fuentes.'));box.append(empty);return}
 box.append(avatar(p,true),make('h2','',p.name),make('p','muted center',statusNames[p.status]));
 if(mode==='local'){const actions=make('div','detail-actions');actions.append(button('Editar','edit',()=>openPerson(p)),button('Añadir vínculo','link',openRelation),button('Eliminar persona','trash',()=>{if(confirm('¿Eliminar esta ficha y todos sus vínculos?')){commit(removePerson(data(),p.id));toast('Ficha eliminada. Puedes deshacer.')}}));box.append(actions)}
 const details=section(box,'DATOS VITALES');fact(details,'Nacimiento',p.birth||'Sin registrar');fact(details,'Fallecimiento',p.death||'Sin registrar');fact(details,'Lugar',p.place);if(mode==='local')fact(details,'Publicación',p.publish?'Revisada para publicar':'No autorizada');
 if(p.familysearch){const a=make('a','detail-link');a.href=p.familysearch;a.target='_blank';a.rel='noopener noreferrer';a.append(icon('link'),document.createTextNode('Consultar en FamilySearch'),icon('arrow'));box.append(a)}
 const links=section(box,'VÍNCULOS FAMILIARES');const rs=data().relations.filter(r=>r.from===p.id||r.to===p.id);
 if(!rs.length)links.append(make('p','muted','No hay vínculos registrados.'));
 for(const r of rs){const other=person(r.from===p.id?r.to:r.from),label=r.type==='partner'?'Pareja':r.to===p.id?'Progenitor/a':'Hijo/a',line=make('div','relation-row'),b=make('button','result'),txt=make('span');b.type='button';txt.append(make('small','',label),make('strong','',other.name));b.append(txt,icon('chevron'));b.addEventListener('click',()=>{$('scope').value='all';selectPerson(other.id,true)});line.append(b);if(mode==='local')line.append(button('Eliminar vínculo con '+other.name,'close',()=>{if(confirm('¿Eliminar este vínculo?'))commit({...data(),relations:data().relations.filter(x=>x!==r)})}));links.append(line)}
 if(mode==='local'&&(p.notes||p.sources)){const notes=section(box,'INVESTIGACIÓN PRIVADA');fact(notes,'Notas',p.notes);fact(notes,'Fuentes',p.sources)}
}
function openPerson(p=null){if(mode!=='local')return;editing=p?p.id:null;const f=$('personForm');f.reset();$('formTitle').textContent=p?'Editar persona':'Nueva persona';$('formError').textContent='';if(p)for(const k of ['name','birth','death','place','status','familysearch','notes','sources'])f.elements.namedItem(k).value=p[k]||'';f.elements.namedItem('publish').checked=!!(p&&p.publish);syncPublish();$('personDialog').showModal()}
function syncPublish(){const f=$('personForm'),check=f.elements.namedItem('publish');check.disabled=f.elements.namedItem('status').value!=='deceased';if(check.disabled)check.checked=false}
$('personForm').elements.namedItem('status').addEventListener('change',syncPublish);
$('personForm').addEventListener('submit',e=>{
 e.preventDefault();if(mode!=='local')return;try{const f=new FormData(e.currentTarget),id=editing||('p-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)));const p={id};for(const k of ['name','birth','death','place','status','familysearch','notes','sources'])p[k]=String(f.get(k)||'');p.publish=f.has('publish');const people=editing?data().people.map(x=>x.id===id?p:x):[...data().people,p];commit({...data(),people});selected=id;$('scope').value='all';render(!editing);$('personDialog').close();toast('Ficha guardada en el taller privado.')}catch(err){$('formError').textContent=err.message}
});
function openRelation(){if(mode!=='local'||!selected)return;const f=$('relationForm');f.reset();const other=f.elements.namedItem('other');other.replaceChildren();for(const p of [...data().people].filter(p=>p.id!==selected).sort((a,b)=>a.name.localeCompare(b.name,'es'))){const o=make('option','',p.name);o.value=p.id;other.append(o)}if(!other.options.length){toast('Añade otra persona antes de crear el vínculo.');return}$('relationError').textContent='';$('relationDialog').showModal()}
$('relationForm').addEventListener('submit',e=>{e.preventDefault();if(mode!=='local'||!selected)return;try{const f=new FormData(e.currentTarget),type=f.get('type'),other=String(f.get('other'));const r={type:type==='partner'?'partner':'parent',from:type==='parent'?other:selected,to:type==='parent'?selected:other};commit({...data(),relations:[...data().relations,r]});$('relationDialog').close();toast('Vínculo añadido.')}catch(err){$('relationError').textContent=err.message}});
for(const [id,dialog] of [['cancelPerson','personDialog'],['cancelRelation','relationDialog'],['closeHelp','helpDialog']])$(id).addEventListener('click',()=>$(dialog).close());
$('help').addEventListener('click',()=>$('helpDialog').showModal());
$('add').addEventListener('click',()=>openPerson());
$('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
$('publicMode').addEventListener('click',()=>{setMode('public');refreshPublic()});$('demoMode').addEventListener('click',()=>setMode('demo'));$('localMode').addEventListener('click',()=>setMode('local'));
$('clearSelection').addEventListener('click',()=>{selected=null;$('scope').value='all';render(false)});
$('query').addEventListener('input',()=>render(false));$('scope').addEventListener('change',()=>renderTree(true));
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{view=b.dataset.view;render(true)});
$('zoomIn').addEventListener('click',()=>applyZoom(zoom*1.25));$('zoomOut').addEventListener('click',()=>applyZoom(zoom/1.25));$('fit').addEventListener('click',fitTree);
$('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').replaceChildren(icon(dark?'sun':'moon'));try{localStorage.setItem('famtree-theme',dark?'dark':'light')}catch{}});
try{if(localStorage.getItem('famtree-theme')==='dark'){$('theme').click()}}catch{}
$('import').addEventListener('click',()=>$('file').click());
$('file').addEventListener('change',async()=>{const file=$('file').files[0];$('file').value='';if(!file)return;try{if(file.size>25*1024*1024)throw Error('Archivo demasiado grande (máximo 25 MB).');const next=validate(JSON.parse(await file.text()));if(dirty&&!confirm('¿Reemplazar el taller privado? Descarga primero una copia si necesitas conservarlo.'))return;localData=next;dirty=false;history=[];future=[];setMode('local');toast('Archivo importado. Los datos permanecen en esta pestaña.')}catch(err){toast('No se pudo importar: '+err.message)}});
$('export').addEventListener('click',()=>{if(mode==='local'){download(localData,'famtree.private.json');dirty=false;toast('Copia privada preparada. No la subas a GitHub.')}});
$('publish').addEventListener('click',()=>{if(mode!=='local')return;const d=publicCopy(localData);if(!d.people.length){toast('No hay fichas fallecidas y revisadas para publicar.');return}if(confirm('Se exportarán '+d.people.length+' fichas de personas fallecidas marcadas como revisadas, sin notas ni fuentes privadas. Confirma que un adulto ha revisado nombres, fechas, lugares y enlaces. El archivo será público si lo subes a GitHub.')){download(d,'tree.json');toast('Revisa tree.json antes de reemplazar data/tree.json en Development.')}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
const viewport=$('viewport');let drag=null;
viewport.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0||e.target.closest('button'))return;drag={x:e.clientX,y:e.clientY,l:viewport.scrollLeft,t:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('drag')});
viewport.addEventListener('pointermove',e=>{if(drag){viewport.scrollLeft=drag.l+drag.x-e.clientX;viewport.scrollTop=drag.t+drag.y-e.clientY}});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(ev,()=>{drag=null;viewport.classList.remove('drag')});
viewport.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();applyZoom(zoom*(e.deltaY<0?1.12:1/1.12))}},{passive:false});
window.addEventListener('keydown',e=>{if(e.target.closest('input,textarea,select,dialog')||mode!=='local')return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}});
async function readJSON(path){const r=await fetch(path,{cache:'no-cache',credentials:'same-origin',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function refreshPublic(){
 if(refreshing)return;refreshing=true;
 try{const next=validatePublic(await readJSON('data/tree.json'));const changed=JSON.stringify(next)!==JSON.stringify(publicData);publicData=next;
 if(autoDemo&&publicData.people.length){autoDemo=false;setMode('public',true)}else if(changed&&mode==='public'){if(!person(selected)){selected=null;$('scope').value='all'}render(false)}
 $('sync').textContent=mode==='local'?'Taller privado: los cambios no se publican automáticamente.':'Archivo público comprobado a las '+new Date().toLocaleTimeString('es-MX')+' · actualización cada minuto.';
 }catch(err){$('sync').textContent='No se pudo actualizar el archivo público. Se conserva la última versión disponible.';console.warn('FamTree: actualización pública fallida',err)}
 finally{refreshing=false}
}
async function init(){render(true);try{demoData=validate(await readJSON('data/demo.json'))}catch(err){console.warn('FamTree: ejemplo no disponible',err)}await refreshPublic();if(mode==='public'&&!publicData.people.length&&!selected&&demoData.people.length){autoDemo=true;setMode('demo',true)}else render(true);setInterval(refreshPublic,60000)}
init();
