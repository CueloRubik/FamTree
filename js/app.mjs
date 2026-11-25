import {blank,validate,validatePublic,publicCopy,removePerson,related,searchPeople,layout} from './model.mjs';
import {project,encodeFTree,decodeFTree,MAX_BYTES} from './ftree.mjs';
import {listProjects,loadProject,saveProject,deleteProject} from './projects.mjs';
import {boardLayout,branchPath,branchShape,fitCamera} from './board.mjs';

const $=id=>document.getElementById(id);
const svgNS='http://www.w3.org/2000/svg';
const make=(tag,cls,txt)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e};
function icon(name){const e=document.createElementNS(svgNS,'svg');e.setAttribute('class','icon');e.setAttribute('aria-hidden','true');const u=document.createElementNS(svgNS,'use');u.setAttribute('href','assets/icons.svg#'+name);e.append(u);return e}
function svg(tag,attrs){const e=document.createElementNS(svgNS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e}
function button(label,ico,fn,cls='icon-button'){const b=make('button',cls);b.type='button';b.title=label;b.setAttribute('aria-label',label);b.append(icon(ico));if(cls!=='icon-button')b.append(document.createTextNode(label));b.addEventListener('click',fn);return b}
const statusNames={living:'Vive · privado',deceased:'Falleció',unknown:'Estado desconocido · privado'};
let mode='public',publicData=blank(),demoData=blank(),localData=null,selected=null,view='tree',zoom=1,graph=layout(blank()),history=[],future=[],editing=null,toastTimer,autoDemo=false,refreshing=false,dirty=false;
let camera={x:0,y:0,z:1},activeId=null,revision=new Map(),saveQueue=Promise.resolve(),saveSerial=0,pendingRelation=null,inspectorOpen=false,storageError=false;
const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
const data=()=>mode==='local'?localData:mode==='demo'?demoData:publicData;
function toast(message){$('toast').textContent=message;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,5000)}
function initials(p){return p.name.trim().split(/\s+/).slice(0,2).map(s=>Array.from(s)[0]||'').join('').toUpperCase()}
function dates(p){return [p.birth,p.death].filter(Boolean).join(' – ')||'Fechas sin registrar'}
function avatar(p,large=false){return make('span','avatar'+(large?' portrait':''),initials(p))}
function person(id){return data().people.find(p=>p.id===id)}
function downloadBytes(bytes,filename,type){const url=URL.createObjectURL(new Blob([bytes],{type}));const a=make('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function download(d,filename){downloadBytes(JSON.stringify(d,null,2)+'\n',filename,'application/json');}
function filename(){return (data().title.replace(/[\\/:*?"<>|]/g,'_').trim()||'FamTree')+'.ftree';}
function remember(id){try{if(id)localStorage.setItem('famtree-active',id);else localStorage.removeItem('famtree-active');}catch{}}
function status(s){$('sync').textContent=s;$('sync').title=s;}
function persist(){
 if(!activeId||!localData)return;const id=activeId,snapshot=localData,serial=++saveSerial;dirty=true;storageError=false;status('Guardando…');
 saveQueue=saveQueue.then(async()=>{try{const rev=await saveProject(id,snapshot,revision.get(id)??null);revision.set(id,rev);if(activeId===id&&serial===saveSerial){dirty=false;storageError=false;if(mode==='local')status('Guardado en este dispositivo');}}catch(e){if(activeId===id&&serial===saveSerial){dirty=true;storageError=true;if(mode==='local')status('No guardado: '+e.message);toast('No se pudo guardar. Exporta una copia .ftree. '+e.message);}}});
}
function setMode(next,automatic=false){
 if(next==='local'&&!localData)return;
 mode=next;if(!automatic)autoDemo=false;selected=null;inspectorOpen=false;$('query').value='';$('scope').value='all';view='tree';$('searchPanel').hidden=true;$('searchToggle').setAttribute('aria-expanded','false');$('sideMenu').hidden=true;$('menuToggle').setAttribute('aria-expanded','false');remember(next==='local'?activeId:null);render(true);status(next==='local'?(storageError?'No guardado: exporta una copia':dirty?'Guardando…':'Guardado en este dispositivo'):'Consulta pública · solo lectura');
}
function commit(next){if(mode!=='local')return;const validated=project(next);history.push(localData);if(history.length>60)history.shift();future=[];localData=validated;if(!person(selected))selected=null;persist();render(false);}
function undo(){if(mode!=='local'||!history.length)return;future.push(localData);localData=history.pop();if(!person(selected))selected=null;persist();render(false);}
function redo(){if(mode!=='local'||!future.length)return;history.push(localData);localData=future.pop();if(!person(selected))selected=null;persist();render(false);}
async function canSwitch(){await saveQueue;return !dirty||confirm('Hay cambios que no se guardaron. Exporta una copia antes de continuar. ¿Cambiar de proyecto de todos modos?');}
async function activate(id,d,rev=null,create=false){activeId=id;localData=project(d);revision.set(id,rev);history=[];future=[];dirty=false;storageError=false;setMode('local');if(create)persist();}
async function createProject(d){if(!await canSwitch())return;await activate(uid(),d,null,true);$('projectDialog').close();return true;}
async function showProjects(){if(!$('projectDialog').open)$('projectDialog').showModal();$('projectError').textContent='';const box=$('projectList');box.replaceChildren(make('p','muted','Cargando proyectos…'));await saveQueue;try{const rows=await listProjects();box.replaceChildren();if(!rows.length)box.append(make('p','muted','Todavía no hay proyectos guardados.'));for(const item of rows){const line=make('div','project-row'),b=make('button','result'),t=make('span');b.type='button';t.append(make('strong','',item.title),make('small','',item.count+' personas · '+new Date(item.updated).toLocaleDateString('es-MX')));b.append(t,icon('chevron'));b.addEventListener('click',async()=>{try{if(!await canSwitch())return;const row=await loadProject(item.id);await activate(row.id,row.data,row.revision);$('projectDialog').close();}catch(e){$('projectError').textContent=e.message;}});line.append(b,button('Renombrar '+item.title,'edit',async()=>{const name=prompt('Nuevo nombre del proyecto',item.title)?.trim();if(!name)return;try{await saveQueue;if(item.id===activeId&&mode==='local'){commit({...localData,title:name});await saveQueue;if(dirty)throw Error('No se guardó el nombre.');}else{const row=await loadProject(item.id);const d=project({...row.data,title:name});await saveProject(item.id,d,row.revision);if(item.id===activeId&&!dirty){localData=d;revision.set(item.id,row.revision+1);}}await showProjects();}catch(e){$('projectError').textContent=e.message;}}),button('Duplicar '+item.title,'copy',async()=>{try{if(!await canSwitch())return;const row=await loadProject(item.id);await activate(uid(),{...row.data,title:(row.title+' (copia)').slice(0,120)},null,true);$('projectDialog').close();}catch(e){$('projectError').textContent=e.message;}}),button('Eliminar '+item.title,'trash',async()=>{if(!confirm('¿Eliminar el proyecto local '+item.title+'? Esta acción no borra las copias descargadas.'))return;try{await saveQueue;await deleteProject(item.id,item.id===activeId?revision.get(item.id):item.revision);if(item.id===activeId){activeId=null;localData=null;dirty=false;storageError=false;history=[];future=[];setMode('demo');}await showProjects();}catch(e){$('projectError').textContent=e.message;}}));box.append(line);}}catch(e){box.replaceChildren();$('projectError').textContent='No se pudo acceder al almacenamiento local: '+e.message+'. Puedes editar y exportar .ftree, pero no guardar en el navegador.';}}
$('newProjectForm').addEventListener('submit',async e=>{e.preventDefault();const name=new FormData(e.currentTarget).get('title').trim();if(!name)return;await createProject({...blank(),title:name});$('newProjectForm').reset();});
$('copyCurrent').addEventListener('click',async()=>{const source=data();await createProject({...source,title:(source.title+' (copia)').slice(0,120)});});
$('closeProjects').addEventListener('click',()=>$('projectDialog').close());
$('importProject').addEventListener('click',()=>$('file').click());

function refreshControls(){
 const local=mode==='local';$('modeBadge').replaceChildren(icon(local?'lock':mode==='demo'?'leaf':'globe'),document.createTextNode(local?'Taller privado':mode==='demo'?'Ejemplo ficticio':'Archivo público'));
 for(const m of ['public','demo','local']){$(m+'Mode').classList.toggle('mode-active',mode===m);$(m+'Mode').setAttribute('aria-pressed',String(mode===m))}
 for(const id of ['add','export','publish','autoLayout'])$(id).disabled=!local;
 for(const id of ['quickChild','quickParent','quickLink'])$(id).disabled=!local||!selected;
 $('undo').disabled=!local||!history.length;$('redo').disabled=!local||!future.length;
 $('scope').disabled=!selected||view!=='tree';
 $('title').textContent=data().title;
 $('subtitle').textContent=local?'Edición privada · guardado local y copias .ftree.':mode==='demo'?'Diez personas inventadas para conocer FamTree.':'Explora las ramas y sus historias.';
 $('countPeople').textContent=data().people.length;$('countGen').textContent=layout(data()).generations;$('zoomBar').hidden=view!=='tree';$('countLinks').textContent=data().relations.length;
 for(const n of document.querySelectorAll('[data-view]')){const active=n.dataset.view===view;n.classList.toggle('active',active);if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current')}
 for(const v of ['tree','directory','timeline'])$(v+'View').hidden=v!==view;
}
function render(fit=false){const focused=document.activeElement?.dataset?.person;refreshControls();renderResults();if(view==='tree')renderTree(fit);else if(view==='directory')renderDirectory();else renderTimeline();renderDetail();if(focused&&view==='tree'){const node=[...$('nodes').children].find(n=>n.dataset.person===focused);if(node)node.focus({preventScroll:true})}}
function selectPerson(id,center=false){if(!person(id))return;selected=id;inspectorOpen=true;render(false);if(center&&view==='tree'){centerPerson(id);$('searchPanel').hidden=true;$('searchToggle').setAttribute('aria-expanded','false');}}
function matchSet(){return new Set(searchPeople(data(),$('query').value).map(p=>p.id))}
function renderResults(){
 const q=$('query').value.trim(),box=$('results');box.replaceChildren();box.hidden=!q||view!=='tree';if(box.hidden)return;
 const results=searchPeople(data(),q);if(!results.length){box.append(make('p','muted','Sin coincidencias.'));return}
 for(const p of results.slice(0,40)){const b=make('button','result');b.type='button';b.append(make('span','',p.name),icon('chevron'));b.addEventListener('click',()=>{ $('scope').value='all';selectPerson(p.id,true)});box.append(b)}
 if(results.length>40)box.append(make('p','muted','Mostrando 40 de '+results.length+' coincidencias.'));
}
let branchUpdates=new Map();
function drawBranches(){
 const branches=$('branches'),fragment=document.createDocumentFragment();branches.replaceChildren();branchUpdates=new Map(graph.people.map(p=>[p.id,[]]));
 const children=new Set(graph.edges.filter(r=>r.type==='parent').map(r=>r.to)),pairedToChild=new Set();
 for(const r of graph.edges)if(r.type==='partner'){if(children.has(r.from))pairedToChild.add(r.to);if(children.has(r.to))pairedToChild.add(r.from);}
 for(const [id,p] of graph.positions)if(!children.has(id)&&!pairedToChild.has(id)){
  const trunk=svg('path',{class:'trunk'}),twig=svg('path',{class:'twig'});const update=()=>{const x=p.x,y=p.y;trunk.setAttribute('d','M '+(x-8)+' '+(y+10)+' Q '+(x-12)+' '+(y+56)+' '+(x-24)+' '+(y+101)+' Q '+x+' '+(y+90)+' '+(x+24)+' '+(y+101)+' Q '+(x+10)+' '+(y+55)+' '+(x+8)+' '+(y+10)+' Z');twig.setAttribute('d','M '+(x-6)+' '+(y+75)+' Q '+(x-25)+' '+(y+90)+' '+(x-40)+' '+(y+94));};update();branchUpdates.get(id).push(update);fragment.append(trunk,twig);
 }
 for(const r of graph.edges){const a=graph.positions.get(r.from),b=graph.positions.get(r.to),partner=r.type==='partner',weight=partner?2.5:Math.max(3.5,10-a.depth*1.25);const path=svg('path',{class:(partner?'branch partner ':'branch-wood ')+(r.from===selected||r.to===selected?'highlight':''),'stroke-width':partner?weight:0});const update=()=>path.setAttribute('d',partner?branchPath(a,b,true):branchShape(a,b,weight));update();branchUpdates.get(r.from).push(update);branchUpdates.get(r.to).push(update);fragment.append(path);}
 branches.append(fragment);
}
function renderTree(fit){
 const scope=$('scope').value;graph=boardLayout(data(),selected&&scope!=='all'?related(data(),selected,scope):null);const nodes=$('nodes');nodes.replaceChildren();$('empty').hidden=graph.people.length>0;drawBranches();
 const matches=matchSet(),q=$('query').value.trim();
 for(const p of graph.people){const pos=graph.positions.get(p.id),b=make('button','leaf-node'+(p.id===selected?' selected':'')+(q?(matches.has(p.id)?' match':' dim'):''));b.type='button';b.style.left=pos.x+'px';b.style.top=pos.y+'px';b.dataset.person=p.id;b.title=p.name+' · '+dates(p);b.setAttribute('aria-label',p.name+', '+dates(p));b.setAttribute('aria-pressed',String(selected===p.id));const t=make('span','node-text');t.append(make('strong','',p.name),make('small','',dates(p)));b.append(avatar(p),t);b.addEventListener('click',e=>{if(e.detail===0)selectPerson(p.id);});nodes.append(b);}
 if(fit)fitTree();else paintCamera();
}
function paintCamera(){const {x,y,z}=camera;$('world').style.transform='translate('+x+'px,'+y+'px) scale('+z+')';$('viewport').style.backgroundPosition=x%22+'px '+y%22+'px';$('scaleText').textContent=Math.round(z*100)+'%';zoom=z;$('zoomIn').disabled=z>=3;$('zoomOut').disabled=z<=.002;}
function applyZoom(next,anchorX,anchorY){const v=$('viewport'),z=Math.max(.002,Math.min(3,next));const x=Number.isFinite(anchorX)?anchorX:v.clientWidth/2,y=Number.isFinite(anchorY)?anchorY:v.clientHeight/2;camera={x:x-(x-camera.x)*z/camera.z,y:y-(y-camera.y)*z/camera.z,z};paintCamera();}
function fitTree(){const v=$('viewport');if(!v.clientWidth||!v.clientHeight)return;camera=fitCamera(graph.positions,v.clientWidth,v.clientHeight);paintCamera();}
function centerPerson(id){const p=graph.positions.get(id),v=$('viewport');if(!p)return;const z=Math.max(.75,camera.z);camera={x:v.clientWidth/2-p.x*z,y:v.clientHeight/2-p.y*z,z};paintCamera();}

function row(p,sub){const b=make('button','person-row');b.type='button';const txt=make('span');txt.append(make('strong','',p.name),make('small','',sub));b.append(avatar(p),txt,icon('chevron'));b.addEventListener('click',()=>selectPerson(p.id,true));return b}
function renderDirectory(){const box=$('directory');box.replaceChildren();const people=searchPeople(data(),$('query').value).sort((a,b)=>a.name.localeCompare(b.name,'es'));if(!people.length)box.append(make('p','','No hay personas que mostrar.'));for(const p of people)box.append(row(p,dates(p)+(p.place?' · '+p.place:'')))}
function year(s){const m=s.match(/\b(\d{3,4})\b/);return m?Number(m[1]):null}
function renderTimeline(){const box=$('timeline');box.replaceChildren();const events=[];for(const p of searchPeople(data(),$('query').value))for(const [key,label] of [['birth','Nacimiento'],['death','Fallecimiento']])if(p[key])events.push({p,label,date:p[key],year:year(p[key])});events.sort((a,b)=>(a.year===null?Infinity:a.year)-(b.year===null?Infinity:b.year)||a.p.name.localeCompare(b.p.name,'es'));if(!events.length)box.append(make('p','','No hay acontecimientos con fecha.'));for(const e of events){const item=make('div','event'),t=make('time','',e.year===null?'Sin año':String(e.year));item.append(t,row(e.p,e.label+' · '+e.date));box.append(item)}}
function section(box,title){const s=make('section','detail-section');s.append(make('h3','',title));box.append(s);return s}
function fact(box,label,value){if(!value)return;const d=make('dl','fact');d.append(make('dt','',label),make('dd','',value));box.append(d)}
function renderDetail(){
 const box=$('detail'),p=person(selected);box.replaceChildren();$('clearSelection').disabled=!p;$('inspector').hidden=!p||!inspectorOpen;
 if(!p){const empty=make('div','detail-empty');empty.append(icon('leaf'),make('h3','','Cada rama tiene una historia'),make('p','','Selecciona a una persona para consultar sus fechas, vínculos y fuentes.'));box.append(empty);return}
 box.append(avatar(p,true),make('h2','',p.name),make('p','muted center',statusNames[p.status]));
 if(mode==='local'){const actions=make('div','detail-actions');actions.append(button('Editar','edit',()=>openPerson(p)),button('Añadir vínculo','link',openRelation),button('Eliminar persona','trash',()=>{if(confirm('¿Eliminar esta ficha y todos sus vínculos?')){commit({...removePerson(data(),p.id),positions:data().positions});toast('Ficha eliminada. Puedes deshacer.')}}));box.append(actions)}
 const details=section(box,'DATOS VITALES');fact(details,'Nacimiento',p.birth||'Sin registrar');fact(details,'Fallecimiento',p.death||'Sin registrar');fact(details,'Lugar',p.place);if(mode==='local')fact(details,'Publicación',p.publish?'Revisada para publicar':'No autorizada');
 if(p.familysearch){const a=make('a','detail-link');a.href=p.familysearch;a.target='_blank';a.rel='noopener noreferrer';a.append(icon('link'),document.createTextNode('Consultar en FamilySearch'),icon('arrow'));box.append(a)}
 const links=section(box,'VÍNCULOS FAMILIARES');const rs=data().relations.filter(r=>r.from===p.id||r.to===p.id);
 if(!rs.length)links.append(make('p','muted','No hay vínculos registrados.'));
 for(const r of rs){const other=person(r.from===p.id?r.to:r.from),label=r.type==='partner'?'Pareja':r.to===p.id?'Progenitor/a':'Hijo/a',line=make('div','relation-row'),b=make('button','result'),txt=make('span');b.type='button';txt.append(make('small','',label),make('strong','',other.name));b.append(txt,icon('chevron'));b.addEventListener('click',()=>{$('scope').value='all';selectPerson(other.id,true)});line.append(b);if(mode==='local')line.append(button('Eliminar vínculo con '+other.name,'close',()=>{if(confirm('¿Eliminar este vínculo?'))commit({...data(),relations:data().relations.filter(x=>x!==r)})}));links.append(line)}
 if(mode==='local'&&(p.notes||p.sources)){const notes=section(box,'INVESTIGACIÓN PRIVADA');fact(notes,'Notas',p.notes);fact(notes,'Fuentes',p.sources)}
}
function openPerson(p=null,relation=null){if(mode!=='local')return;pendingRelation=relation;editing=p?p.id:null;const f=$('personForm');f.reset();$('formTitle').textContent=p?'Editar persona':relation?(relation.type==='child'?'Nuevo descendiente':'Nuevo progenitor'):'Nueva persona';$('formError').textContent='';if(p)for(const k of ['name','birth','death','place','status','familysearch','notes','sources'])f.elements.namedItem(k).value=p[k]||'';f.elements.namedItem('publish').checked=!!(p&&p.publish);syncPublish();$('personDialog').showModal()}
function syncPublish(){const f=$('personForm'),check=f.elements.namedItem('publish');check.disabled=f.elements.namedItem('status').value!=='deceased';if(check.disabled)check.checked=false}
$('personForm').elements.namedItem('status').addEventListener('change',syncPublish);
$('personForm').addEventListener('submit',e=>{
 e.preventDefault();if(mode!=='local')return;try{const f=new FormData(e.currentTarget),id=editing||('p-'+(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2)));const p={id};for(const k of ['name','birth','death','place','status','familysearch','notes','sources'])p[k]=String(f.get(k)||'');p.publish=f.has('publish');const people=editing?data().people.map(x=>x.id===id?p:x):[...data().people,p];const relations=[...data().relations];if(!editing&&pendingRelation&&person(pendingRelation.id)){const r=pendingRelation;relations.push({type:'parent',from:r.type==='child'?r.id:id,to:r.type==='child'?id:r.id});}let positions=data().positions;if(!editing&&pendingRelation&&Object.keys(positions||{}).length){const g=boardLayout(data()),base=g.positions.get(pendingRelation.id);if(base){const y=base.y+(pendingRelation.type==='child'?-205:205);let x=base.x;for(let i=0;i<2000&&[...g.positions.values()].some(p=>Math.abs(p.x-x)<180&&Math.abs(p.y-y)<100);i++)x=base.x+(i%2===0?1:-1)*Math.ceil((i+1)/2)*198;positions={...positions,[id]:{x,y}};}}const first=!data().people.length;commit({...data(),people,relations,positions});selected=id;inspectorOpen=true;$('scope').value='all';render(first);if(!editing&&!first)centerPerson(id);$('personDialog').close();toast('Ficha guardada en el taller privado.')}catch(err){$('formError').textContent=err.message}
});
function openRelation(){if(mode!=='local'||!selected)return;const f=$('relationForm');f.reset();const other=f.elements.namedItem('other');other.replaceChildren();for(const p of [...data().people].filter(p=>p.id!==selected).sort((a,b)=>a.name.localeCompare(b.name,'es'))){const o=make('option','',p.name);o.value=p.id;other.append(o)}if(!other.options.length){toast('Añade otra persona antes de crear el vínculo.');return}$('relationError').textContent='';$('relationDialog').showModal()}
$('relationForm').addEventListener('submit',e=>{e.preventDefault();if(mode!=='local'||!selected)return;try{const f=new FormData(e.currentTarget),type=f.get('type'),other=String(f.get('other'));const r={type:type==='partner'?'partner':'parent',from:type==='parent'?other:selected,to:type==='parent'?selected:other};commit({...data(),relations:[...data().relations,r]});$('relationDialog').close();toast('Vínculo añadido.')}catch(err){$('relationError').textContent=err.message}});
for(const [id,dialog] of [['cancelPerson','personDialog'],['cancelRelation','relationDialog'],['closeHelp','helpDialog']])$(id).addEventListener('click',()=>$(dialog).close());
$('help').addEventListener('click',()=>$('helpDialog').showModal());
$('add').addEventListener('click',()=>openPerson());
$('quickChild').addEventListener('click',()=>openPerson(null,{id:selected,type:'child'}));$('quickParent').addEventListener('click',()=>openPerson(null,{id:selected,type:'parent'}));$('quickLink').addEventListener('click',openRelation);$('autoLayout').addEventListener('click',()=>{if(mode==='local'){commit({...data(),positions:{}});fitTree();}});
$('undo').addEventListener('click',undo);$('redo').addEventListener('click',redo);
$('publicMode').addEventListener('click',()=>{setMode('public');refreshPublic()});$('demoMode').addEventListener('click',()=>setMode('demo'));$('localMode').addEventListener('click',showProjects);$('projectMenu').addEventListener('click',showProjects);
function togglePanel(panel,trigger){const el=$(panel);el.hidden=!el.hidden;$(trigger).setAttribute('aria-expanded',String(!el.hidden));} $('menuToggle').addEventListener('click',()=>togglePanel('sideMenu','menuToggle'));$('searchToggle').addEventListener('click',()=>{togglePanel('searchPanel','searchToggle');if(!$('searchPanel').hidden)$('query').focus();});
$('clearSelection').addEventListener('click',()=>{selected=null;inspectorOpen=false;$('scope').value='all';render(false)});
$('query').addEventListener('input',()=>render(false));$('scope').addEventListener('change',()=>renderTree(true));
for(const b of document.querySelectorAll('[data-view]'))b.addEventListener('click',()=>{view=b.dataset.view;$('sideMenu').hidden=true;$('menuToggle').setAttribute('aria-expanded','false');render(true)});
$('zoomIn').addEventListener('click',()=>applyZoom(zoom*1.25));$('zoomOut').addEventListener('click',()=>applyZoom(zoom/1.25));$('fit').addEventListener('click',fitTree);
$('theme').addEventListener('click',()=>{const dark=document.documentElement.dataset.theme!=='dark';document.documentElement.dataset.theme=dark?'dark':'light';$('theme').replaceChildren(icon(dark?'sun':'moon'));try{localStorage.setItem('famtree-theme',dark?'dark':'light')}catch{}});
try{if(localStorage.getItem('famtree-theme')==='dark'){$('theme').click()}}catch{}
$('import').addEventListener('click',()=>$('file').click());
$('file').addEventListener('change',async()=>{const file=$('file').files[0];$('file').value='';if(!file)return;try{if(file.size>MAX_BYTES)throw Error('Archivo demasiado grande (64 MiB).');const bytes=new Uint8Array(await file.arrayBuffer());const binary=file.name.toLowerCase().endsWith('.ftree')||(bytes[0]===70&&bytes[1]===84);const next=binary?decodeFTree(bytes):project(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));if(await createProject(next))toast('Archivo leído. Se creó un proyecto independiente.');}catch(err){toast('No se pudo abrir: '+err.message);if($('projectDialog').open)$('projectError').textContent=err.message;}});
$('export').addEventListener('click',()=>{if(mode!=='local')return;try{downloadBytes(encodeFTree(localData),filename(),'application/octet-stream');toast('Copia .ftree preparada. No la publiques en GitHub.');}catch(e){toast(e.message);}});

$('publish').addEventListener('click',()=>{if(mode!=='local')return;const d=publicCopy(localData);if(!d.people.length){toast('No hay fichas fallecidas y revisadas para publicar.');return}if(confirm('Se exportarán '+d.people.length+' fichas de personas fallecidas marcadas como revisadas, sin notas ni fuentes privadas. Confirma que un adulto ha revisado nombres, fechas, lugares y enlaces. El archivo será público si lo subes a GitHub.')){download(d,'tree.json');toast('Revisa tree.json antes de reemplazar data/tree.json en Development.')}});
window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}});
const viewport=$('viewport');let drag=null,lastTap={id:null,time:0};
viewport.addEventListener('pointerdown',e=>{if(e.button!==0||!e.isPrimary)return;const node=e.target.closest('.leaf-node'),id=node?.dataset.person,p=id?graph.positions.get(id):null;drag={pointer:e.pointerId,x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,id,node,p:p?{...p}:null,move:false,editable:mode==='local'&&!!p};viewport.setPointerCapture(e.pointerId);viewport.classList.add('drag');});
viewport.addEventListener('pointermove',e=>{if(!drag||drag.pointer!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.move&&Math.hypot(dx,dy)<4)return;drag.move=true;if(drag.editable){const p=graph.positions.get(drag.id);p.x=Math.max(-1e7,Math.min(1e7,drag.p.x+dx/camera.z));p.y=Math.max(-1e7,Math.min(1e7,drag.p.y+dy/camera.z));drag.node.style.left=p.x+'px';drag.node.style.top=p.y+'px';for(const update of branchUpdates.get(drag.id)||[])update();}else if(!drag.id){camera.x=drag.cx+dx;camera.y=drag.cy+dy;paintCamera();}});
function finishDrag(e,cancel=false){if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;viewport.classList.remove('drag');if(cancel){if(d.editable)render(false);return;}if(d.editable&&d.move){const positions={...data().positions,...Object.fromEntries([...graph.positions].map(([id,p])=>[id,{x:p.x,y:p.y}]))};commit({...data(),positions});}else if(d.id&&!d.move){const now=Date.now();if(mode==='local'&&lastTap.id===d.id&&now-lastTap.time<350){lastTap={id:null,time:0};openPerson(person(d.id));}else{lastTap={id:d.id,time:now};selectPerson(d.id);}} }
viewport.addEventListener('pointerup',e=>finishDrag(e));viewport.addEventListener('pointercancel',e=>finishDrag(e,true));viewport.addEventListener('lostpointercapture',e=>finishDrag(e,true));
viewport.addEventListener('wheel',e=>{e.preventDefault();const r=viewport.getBoundingClientRect();applyZoom(camera.z*Math.exp(-Math.max(-150,Math.min(150,e.deltaY))*.002),e.clientX-r.left,e.clientY-r.top);},{passive:false});
window.addEventListener('resize',()=>{if(view==='tree')paintCamera();});

window.addEventListener('keydown',e=>{if(e.target.closest?.('input,textarea,select,dialog')||document.querySelector('dialog[open]'))return;if(e.key==='Escape'){$('sideMenu').hidden=true;$('menuToggle').setAttribute('aria-expanded','false');$('searchPanel').hidden=true;$('searchToggle').setAttribute('aria-expanded','false');inspectorOpen=false;render(false);return;}if(view==='tree'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if(e.key.toLowerCase()==='f'){e.preventDefault();fitTree();return;}const shift={ArrowLeft:[65,0],ArrowRight:[-65,0],ArrowUp:[0,65],ArrowDown:[0,-65]}[e.key];if(shift){e.preventDefault();camera.x+=shift[0];camera.y+=shift[1];paintCamera();return;}}if(mode!=='local')return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();$('export').click();return;}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}});
async function readJSON(path){const r=await fetch(path,{cache:'no-cache',credentials:'same-origin',referrerPolicy:'no-referrer'});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function refreshPublic(){
 if(refreshing)return;refreshing=true;
 try{const next=validatePublic(await readJSON('data/tree.json'));const changed=JSON.stringify(next)!==JSON.stringify(publicData),oldSelected=mode==='public'?person(selected):null;publicData=next;
 if(autoDemo&&publicData.people.length){autoDemo=false;setMode('public',true)}else if(changed&&mode==='public'){if(!person(selected)||!oldSelected||person(selected).name!==oldSelected.name){selected=null;$('scope').value='all'}render(false)}
 if(mode!=='local')status('Archivo público comprobado · '+new Date().toLocaleTimeString('es-MX'));
 }catch(err){if(mode!=='local')status('No se pudo actualizar el archivo público.');console.warn('FamTree: actualización pública fallida',err)}
 finally{refreshing=false}
}
async function init(){render(true);let previous=null;try{previous=localStorage.getItem('famtree-active');}catch{}if(previous){try{const row=await loadProject(previous);await activate(row.id,row.data,row.revision);}catch(e){remember(null);toast('No se pudo recuperar el proyecto: '+e.message);}}try{demoData=validate(await readJSON('data/demo.json'))}catch(err){console.warn('FamTree: ejemplo no disponible',err)}await refreshPublic();if(mode==='public'&&!publicData.people.length&&!selected&&demoData.people.length){autoDemo=true;setMode('demo',true)}else render(true);setInterval(refreshPublic,60000)}
init();
