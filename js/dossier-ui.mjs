import {certaintyValues,certaintyNames,kinds,kindNames,eventTypes,eventNames,claimFields,claimNames,limits,cleanProfile,cleanRelation} from './profile.mjs';
const make=(tag,cls='',text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
const action=(text,fn,cls='small-tool')=>{const b=make('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
function field(label,value='',options={}){const wrap=make('label','dossier-field',label),el=make(options.area?'textarea':'input');if(!options.area)el.type='text';else el.rows=options.rows||3;el.setAttribute('aria-label',label);el.value=value;el.maxLength=options.max||1000;wrap.append(el);return {wrap,el};}
function choice(label,value,values,names){const wrap=make('label','dossier-field',label),el=make('select');for(const key of values){const o=make('option','',names[key]);o.value=key;el.append(o);}el.setAttribute('aria-label',label);el.value=value||values[0];wrap.append(el);return {wrap,el};}
function check(label,value){const wrap=make('label','check'),el=make('input');el.type='checkbox';el.setAttribute('aria-label',label);el.checked=!!value;wrap.append(el,document.createTextNode(label));return {wrap,el};}
function sourceEditor(initial=[]){
 const box=make('div','evidence-list'),list=make('div'),records=[];box.append(make('h4','','Fuentes de este dato'),list);
 function add(source={}){if(records.length>=limits.sources)return;const row=make('div','evidence-source'),title=field('Título de la fuente',source.title,{max:300}),reference=field('Referencia, archivo o URL',source.reference,{max:1000}),quote=field('Transcripción o explicación',source.quote,{max:2000,area:true,rows:2});const record={row,title,reference,quote};row.append(title.wrap,reference.wrap,quote.wrap,action('Quitar fuente',()=>{records.splice(records.indexOf(record),1);row.remove();},'small-tool danger'));records.push(record);list.append(row);}
 for(const s of initial)add(s);box.append(action('+ Añadir fuente',()=>add()));
 return {box,read:()=>records.map(s=>({title:s.title.el.value,reference:s.reference.el.value,quote:s.quote.el.value}))};
}
function recordsEditor(type,initial,uid){
 const box=make('div','records-editor'),list=make('div'),records=[],event=type==='event',max=event?limits.events:limits.claims;
 box.append(make('p','muted',event?'Registra acontecimientos sin modificar automáticamente las fechas principales.':'Registra cada versión de un dato y sus fuentes. Pueden coexistir valores distintos.'),list);
 function add(r={}){if(records.length>=max)return;const card=make('details','record-editor');card.open=!r.id;const summary=make('summary','',event?'Acontecimiento':'Afirmación');card.append(summary);
 const category=choice(event?'Tipo de acontecimiento':'Dato investigado',event?r.type:r.field,event?eventTypes:claimFields,event?eventNames:claimNames);
 const certainty=choice('Certeza',r.certainty,certaintyValues,certaintyNames);
 const fields=event?{date:field('Fecha (exacta, aproximada o intervalo)',r.date,{max:80}),place:field('Lugar',r.place,{max:160}),description:field('Descripción',r.description,{max:1000,area:true})}:{value:field('Valor encontrado',r.value,{max:1000,area:true})};
 const sources=sourceEditor(r.sources),record={id:r.id||uid(),card,category,certainty,fields,sources};
 const refresh=()=>{summary.textContent=(event?eventNames[category.el.value]:claimNames[category.el.value])+' · '+(event?fields.date.el.value:fields.value.el.value).slice(0,80)+' · '+certaintyNames[certainty.el.value];};
 card.append(category.wrap,...Object.values(fields).map(f=>f.wrap),certainty.wrap,sources.box,action(event?'Quitar acontecimiento':'Quitar afirmación',()=>{records.splice(records.indexOf(record),1);card.remove();},'small-tool danger'));for(const f of [category,certainty,...Object.values(fields)])f.el.addEventListener('input',refresh);refresh();records.push(record);list.append(card);
 }
 for(const r of initial||[])add(r);
 box.append(action(event?'+ Nuevo acontecimiento':'+ Nueva afirmación',()=>add()));
 return {box,read:()=>records.map(r=>({id:r.id,[event?'type':'field']:r.category.el.value,...Object.fromEntries(Object.entries(r.fields).map(([k,v])=>[k,v.el.value])),certainty:r.certainty.el.value,sources:r.sources.read()}))};
}
async function preparePhoto(file){
 if(!file||!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024)throw Error('Elige una foto PNG, JPEG o WebP menor de 12 MiB.');
 const url=URL.createObjectURL(file),img=new Image();try{await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('No se pudo leer la foto.'));img.src=url;});if(!img.naturalWidth||!img.naturalHeight||img.naturalWidth*img.naturalHeight>40000000)throw Error('Resolución de imagen demasiado grande.');const canvas=document.createElement('canvas'),ratio=Math.min(1,512/Math.max(img.naturalWidth,img.naturalHeight));canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);for(const q of [.86,.7,.5,.35]){const result=canvas.toDataURL('image/jpeg',q);if(result.length<=Math.ceil(limits.portrait/3)*4+22)return result;}throw Error('La foto no cabe en el expediente.');}finally{URL.revokeObjectURL(url);}
}
export function createDossier({getPerson,savePerson,saveRelation,uid}){
 const dlg=make('dialog','dossier-dialog');dlg.id='dossierDialog';document.body.append(dlg);
 const relationDlg=make('dialog','dossier-dialog');relationDlg.id='relationshipDetailDialog';document.body.append(relationDlg);
 function header(dialog,title){const bar=make('div','dialog-head');bar.append(make('h2','',title),action('Cerrar',()=>dialog.close(),'small-tool'));return bar;}
 function open(p,editable){
  dlg.replaceChildren(header(dlg,'Expediente · '+p.name));const nav=make('div','dossier-tabs'),content=make('div','dossier-content'),error=make('p','error');error.id='dossierError';error.setAttribute('role','alert');
  const info=make('section'),photo=make('section'),events=recordsEditor('event',p.events,uid),claims=recordsEditor('claim',p.claims,uid);
  const aliases=field('Otros nombres (uno por renglón)',(p.aliases||[]).join('\n'),{area:true,max:5152}),tags=field('Etiquetas (una por renglón)',(p.tags||[]).join('\n'),{area:true,max:1952}),occupation=field('Ocupación',p.occupation,{max:160}),bio=field('Biografía',p.bio,{area:true,max:5000,rows:5}),bookmark=check('Marcar como persona importante',p.bookmark);
  aliases.el.id='dossierAliases';tags.el.id='dossierTags';occupation.el.id='dossierOccupation';bookmark.el.id='dossierBookmark';
  info.append(aliases.wrap,occupation.wrap,tags.wrap,bookmark.wrap,bio.wrap);
  let portrait=p.portrait||'',photoBusy=false,sequence=0;const image=make('img','portrait-preview'),caption=make('p','muted','Foto local, incluida dentro del archivo .ftree.'),input=make('input');input.id='dossierPortrait';input.type='file';input.accept='image/jpeg,image/png,image/webp';const refresh=()=>{image.hidden=!portrait;if(portrait)image.src=portrait;else image.removeAttribute('src');};refresh();photo.append(caption,image,input,action('Quitar retrato',()=>{sequence++;photoBusy=false;portrait='';refresh();}));
  input.addEventListener('change',async()=>{const current=++sequence;photoBusy=true;error.textContent='';try{const next=await preparePhoto(input.files[0]);if(current===sequence){portrait=next;refresh();}}catch(e){if(current===sequence)error.textContent=e.message;}finally{if(current===sequence)photoBusy=false;input.value='';}});
  const panes=[['Datos adicionales',info],['Acontecimientos',events.box],['Certeza y fuentes',claims.box],['Retrato',photo]];
  function select(index){for(let i=0;i<panes.length;i++){panes[i][1].hidden=i!==index;nav.children[i].classList.toggle('active',i===index);nav.children[i].setAttribute('aria-pressed',String(i===index));}}
  for(const [i,[name,pane]] of panes.entries()){nav.append(action(name,()=>select(i),'dossier-tab'));content.append(pane);}select(0);
  if(!editable)for(const control of content.querySelectorAll('input,textarea,select,button'))control.disabled=true;
  const footer=make('div','dialog-actions');if(editable){const save=action('Guardar expediente',()=>{try{if(photoBusy)throw Error('La foto aún se está procesando.');const original=getPerson(p.id);if(!original)throw Error('La persona ya no existe.');const lines=el=>el.value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const updated={...original,aliases:lines(aliases.el),tags:lines(tags.el),occupation:occupation.el.value,bio:bio.el.value,bookmark:bookmark.el.checked,portrait,events:events.read(),claims:claims.read()};cleanProfile(updated);savePerson(updated);dlg.close();}catch(e){error.textContent=e.message;}},'primary');save.id='saveDossier';footer.append(save);}
  dlg.append(nav,content,error,footer);dlg.showModal();
 }
 function relationship(edge,other,editable){
  relationDlg.replaceChildren(header(relationDlg,'Vínculo con '+other));const kind=choice('Tipo de filiación',edge.kind,kinds,kindNames),certainty=choice('Certeza del parentesco',edge.certainty,certaintyValues,certaintyNames),sources=sourceEditor(edge.sources),error=make('p','error');kind.el.id='relationKindDetail';certainty.el.id='relationCertaintyDetail';
  if(edge.type==='parent')relationDlg.append(kind.wrap);relationDlg.append(certainty.wrap,sources.box,error);if(!editable){for(const el of relationDlg.querySelectorAll('input,textarea,select,.evidence-list button'))el.disabled=true;}
  else{const save=action('Guardar vínculo',()=>{try{const next={...edge,kind:edge.type==='parent'?kind.el.value:'unknown',certainty:certainty.el.value,sources:sources.read()};cleanRelation(next);saveRelation(edge,next);relationDlg.close();}catch(e){error.textContent=e.message;}},'primary');save.id='saveRelationshipDetail';relationDlg.append(save);}relationDlg.showModal();
 }
 return {open,relationship};
}
