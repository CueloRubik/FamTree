function blank(){return {version:1,title:"Mi árbol familiar",people:[],relations:[]}}

function safeLink(v){return typeof v==="string"&&/^https:\/\/(?:www\.)?familysearch\.org\/(?:[a-z]{2}\/)?(?:tree\/person\/(?:details|about|sources|memories|timeline)\/[A-Za-z0-9-]+|ark:\/61903\/[A-Za-z0-9:._/-]+)\/?$/.test(v)?v:""}

function validate(raw){
 if(!raw||raw.version!==1||!Array.isArray(raw.people)||!Array.isArray(raw.relations))throw Error("Formato FamTree v1 inválido.");
 if(raw.people.length>2000||raw.relations.length>6000)throw Error("Límite: 2000 personas y 6000 relaciones.");
 const str=(v,max)=>typeof v==="string"?v.trim().slice(0,max):"";
 const people=raw.people.map(p=>{
 if(!p||typeof p.id!=="string"||!/^[A-Za-z0-9_-]{1,80}$/.test(p.id)||!str(p.name,160))throw Error("Persona sin ID o nombre válido.");
 const familysearch=str(p.familysearch,1000);if(familysearch&&!safeLink(familysearch))throw Error("Enlace FamilySearch inválido: "+p.name);
 return {id:p.id,name:str(p.name,160),birth:str(p.birth,80),death:str(p.death,80),place:str(p.place,160),status:["living","deceased","unknown"].includes(p.status)?p.status:"unknown",publish:p.status==="deceased"&&p.publish===true,familysearch:safeLink(familysearch),notes:str(p.notes,10000),sources:str(p.sources,5000)};
 });
 const ids=new Set(people.map(p=>p.id));if(ids.size!==people.length)throw Error("IDs duplicados.");
 const seen=new Set(),children=new Map(people.map(p=>[p.id,[]])),indegree=new Map(people.map(p=>[p.id,0]));
 const relations=raw.relations.map(r=>{
 if(!r||!["parent","partner"].includes(r.type)||!ids.has(r.from)||!ids.has(r.to)||r.from===r.to)throw Error("Relación inválida.");
 let {from,to,type}=r;if(type==="partner"&&from>to)[from,to]=[to,from];
 const key=type+":"+from+":"+to;if(seen.has(key))throw Error("Relación duplicada.");seen.add(key);
 if(type==="parent"){children.get(from).push(to);indegree.set(to,indegree.get(to)+1)}return {type,from,to};
 });
 const q=people.filter(p=>indegree.get(p.id)===0).map(p=>p.id);
 for(let i=0;i<q.length;i++)for(const c of children.get(q[i])){indegree.set(c,indegree.get(c)-1);if(!indegree.get(c))q.push(c)}
 if(q.length!==people.length)throw Error("Una persona no puede ser su propio antepasado.");
 return {version:1,title:str(raw.title,120)||"Mi árbol familiar",people,relations};
}

function publicCopy(raw){
 const d=validate(raw),selected=d.people.filter(p=>p.status==="deceased"&&p.publish),ids=new Set(selected.map(p=>p.id)),map=new Map(selected.map((p,i)=>[p.id,"p"+(i+1)]));
 return validate({version:1,title:"Archivo genealógico",people:selected.map(p=>({id:map.get(p.id),name:p.name,birth:p.birth,death:p.death,place:p.place,status:"deceased",publish:true,familysearch:p.familysearch})),relations:d.relations.filter(r=>ids.has(r.from)&&ids.has(r.to)).map(r=>({type:r.type,from:map.get(r.from),to:map.get(r.to)}))});
}

function validatePublic(raw){
 const d=validate(raw);
 if(d.people.some(p=>p.status!=="deceased"||!p.publish||p.notes||p.sources))throw Error("El archivo público contiene registros no autorizados o notas privadas.");
 return d;
}

function removePerson(raw,id){return validate({...raw,people:raw.people.filter(p=>p.id!==id),relations:raw.relations.filter(r=>r.from!==id&&r.to!==id)})}

function related(raw,id,direction){
 const adj=new Map(raw.people.map(p=>[p.id,[]]));
 for(const r of raw.relations)if(r.type==="parent"){const a=direction==="ancestors"?r.to:r.from,b=direction==="ancestors"?r.from:r.to;adj.get(a).push(b)}
 const out=new Set([id]),queue=[id];for(let i=0;i<queue.length;i++)for(const n of adj.get(queue[i])||[])if(!out.has(n)){out.add(n);queue.push(n)}return out;
}

function searchPeople(raw,query){const norm=s=>String(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();const words=norm(query).trim().split(/\s+/);return raw.people.filter(p=>words.every(w=>norm([p.name,p.birth,p.death,p.place].join(" ")).includes(w)))}

function layout(raw,only=null){
 const people=raw.people.filter(p=>!only||only.has(p.id)),ids=new Set(people.map(p=>p.id)),edges=raw.relations.filter(r=>ids.has(r.from)&&ids.has(r.to)),parents=new Map(people.map(p=>[p.id,[]])),children=new Map(people.map(p=>[p.id,[]])),partners=new Map(people.map(p=>[p.id,[]]));
 for(const r of edges){if(r.type==="parent"){parents.get(r.to).push(r.from);children.get(r.from).push(r.to)}else{partners.get(r.from).push(r.to);partners.get(r.to).push(r.from)}}
 const depth=new Map(),pending=new Map(people.map(p=>[p.id,parents.get(p.id).length])),q=people.filter(p=>!pending.get(p.id)).map(p=>p.id);
 q.forEach(id=>depth.set(id,0));for(let i=0;i<q.length;i++){const id=q[i];for(const c of children.get(id)){depth.set(c,Math.max(depth.get(c)||0,depth.get(id)+1));pending.set(c,pending.get(c)-1);if(!pending.get(c))q.push(c)}}
 const rows=new Map();for(const p of people){const d=depth.get(p.id)||0;if(!rows.has(d))rows.set(d,[]);rows.get(d).push(p)}
 const positions=new Map(),width=Math.max(680,...Array.from(rows.values(),row=>row.length*218+120));
 for(const [d,row] of [...rows].sort((a,b)=>a[0]-b[0])){
 const bary=p=>{const ps=parents.get(p.id).map(id=>positions.get(id)).filter(Boolean);return ps.length?ps.reduce((s,x)=>s+x.x,0)/ps.length:width/2};
 row.sort((a,b)=>bary(a)-bary(b)||a.name.localeCompare(b.name,"es"));
 const ordered=[],left=new Set(row.map(p=>p.id)),byId=new Map(row.map(p=>[p.id,p]));
 for(const p of row)if(left.has(p.id)){ordered.push(p);left.delete(p.id);for(const n of partners.get(p.id))if(left.has(n)){ordered.push(byId.get(n));left.delete(n)}}
 ordered.forEach((p,i)=>positions.set(p.id,{x:(width-(ordered.length-1)*218)/2+i*218,y:110+d*176,depth:d}));
 }
 return {people,edges,positions,width,height:Math.max(400,240+Math.max(0,...rows.keys())*176),generations:rows.size};
}

export {blank,safeLink,validate,publicCopy,validatePublic,removePerson,related,searchPeople,layout};
