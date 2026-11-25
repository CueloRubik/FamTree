export const certaintyValues=['unknown','probable','confirmed','contradictory'];
export const certaintyNames={unknown:'Sin verificar',probable:'Probable',confirmed:'Confirmado',contradictory:'Contradictorio'};
export const kinds=['unknown','biological','adoptive','step','foster'];
export const kindNames={unknown:'Tipo sin registrar',biological:'Biológico',adoptive:'Adoptivo',step:'Padrastro o madrastra',foster:'Acogida'};
export const eventTypes=['birth','death','baptism','marriage','divorce','residence','migration','occupation','burial','other'];
export const eventNames={birth:'Nacimiento',death:'Fallecimiento',baptism:'Bautismo',marriage:'Matrimonio',divorce:'Divorcio',residence:'Residencia',migration:'Migración',occupation:'Ocupación',burial:'Sepultura',other:'Otro acontecimiento'};
export const claimFields=['name','birth','death','place','occupation','relationship','other'];
export const claimNames={name:'Nombre',birth:'Nacimiento',death:'Fallecimiento',place:'Lugar',occupation:'Ocupación',relationship:'Parentesco',other:'Otro dato'};
export const limits={aliases:32,tags:32,events:100,claims:100,sources:20,portrait:262144};
const str=(v,n)=>{if(v==null)return '';if(typeof v!=='string'||v.length>n)throw Error('Texto inválido o demasiado largo.');return v.trim();};
const arr=(v,n)=>{if(v==null)return [];if(!Array.isArray(v)||v.length>n)throw Error('Lista inválida o demasiado extensa.');return v;};
const en=(v,values,fallback)=>{if(v==null||v==='')return fallback;if(!values.includes(v))throw Error('Categoría desconocida.');return v;};
const id=v=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(v))throw Error('ID de expediente inválido.');return v;};
const unique=xs=>{if(new Set(xs.map(x=>x.id)).size!==xs.length)throw Error('Identificadores de expediente duplicados.');return xs;};
export function cleanSources(v){return arr(v,limits.sources).map(s=>{if(!s||typeof s!=='object')throw Error('Fuente inválida.');const title=str(s.title,300),reference=str(s.reference,1000),quote=str(s.quote,2000);if(!title&&!reference&&!quote)throw Error('La fuente está vacía.');return {title,reference,quote};});}
function strings(v,n,max){return [...new Set(arr(v,n).map(x=>str(x,max)).filter(Boolean))];}
function portrait(v){if(!v)return '';if(typeof v!=='string'||v.length>Math.ceil(limits.portrait/3)*4+32||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(v))throw Error('Retrato inválido o demasiado grande.');const b64=v.slice(v.indexOf(',')+1);let bytes;try{bytes=atob(b64);}catch{throw Error('Retrato inválido.');}if(bytes.length>limits.portrait||!bytes.length)throw Error('Retrato demasiado grande.');const type=v.slice(11,v.indexOf(';')),ok=type==='png'?bytes.startsWith('\x89PNG\r\n\x1a\n'):type==='jpeg'?bytes.startsWith('\xff\xd8\xff'):bytes.startsWith('RIFF')&&bytes.slice(8,12)==='WEBP';if(!ok)throw Error('Tipo de imagen incorrecto.');return v;}
export function cleanProfile(p){
 const out={},aliases=strings(p.aliases,limits.aliases,160),tags=strings(p.tags,limits.tags,60),occupation=str(p.occupation,160),bio=str(p.bio,5000),photo=portrait(p.portrait);
 if(aliases.length)out.aliases=aliases;if(tags.length)out.tags=tags;if(occupation)out.occupation=occupation;if(bio)out.bio=bio;if(photo)out.portrait=photo;if(p.bookmark===true)out.bookmark=true;
 const events=unique(arr(p.events,limits.events).map(e=>{if(!e||typeof e!=='object')throw Error('Evento inválido.');return {id:id(e.id),type:en(e.type,eventTypes,'other'),date:str(e.date,80),place:str(e.place,160),description:str(e.description,1000),certainty:en(e.certainty,certaintyValues,'unknown'),sources:cleanSources(e.sources)};}));
 const claims=unique(arr(p.claims,limits.claims).map(e=>{if(!e||typeof e!=='object')throw Error('Afirmación inválida.');const value=str(e.value,1000);if(!value)throw Error('La afirmación necesita un valor.');return {id:id(e.id),field:en(e.field,claimFields,'other'),value,certainty:en(e.certainty,certaintyValues,'unknown'),sources:cleanSources(e.sources)};}));
 if(events.length)out.events=events;if(claims.length)out.claims=claims;return out;
}
export function cleanRelation(r){const out={},kind=en(r.kind,kinds,'unknown'),certainty=en(r.certainty,certaintyValues,'unknown'),sources=cleanSources(r.sources);if(r.type==='partner'&&kind!=='unknown')throw Error('El tipo de filiación solo corresponde a padres e hijos.');if(kind!=='unknown')out.kind=kind;if(certainty!=='unknown')out.certainty=certainty;if(sources.length)out.sources=sources;return out;}
export function hasExtensions(p){return Object.keys(cleanProfile(p)).length>0;}
export function hasRelationExtensions(r){return Object.keys(cleanRelation(r)).length>0;}
