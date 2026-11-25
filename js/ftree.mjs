import {validate} from './model.mjs';
import {certaintyValues,kinds,eventTypes,claimFields,limits,hasExtensions,hasRelationExtensions} from './profile.mjs';
export const MAX_BYTES=64*1024*1024;
const magic=[70,84,82,69,69,13,10,26], fields=['id','name','birth','death','place','familysearch','notes','sources'], states=['unknown','living','deceased'];
const utf=new TextEncoder(), decoder=new TextDecoder('utf-8',{fatal:true});
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
export function project(raw){
 const d=validate(raw), entries=[];
 for(const p of d.people){const v=raw.positions&&own(raw.positions,p.id)?raw.positions[p.id]:null;if(v!=null){if(!Number.isFinite(v.x)||!Number.isFinite(v.y)||Math.abs(v.x)>1e7||Math.abs(v.y)>1e7)throw Error('Posición fuera del rango permitido.');entries.push([p.id,{x:v.x,y:v.y}]);}}
 return {...d,positions:Object.fromEntries(entries)};
}
function crc32(bytes){let c=0xffffffff;for(const b of bytes){c^=b;for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
class Writer{
 constructor(){this.chunks=[];this.size=0;}
 add(b){this.size+=b.length;if(this.size>MAX_BYTES-20)throw Error('El proyecto supera 64 MiB.');this.chunks.push(b);}
 u8(n){this.add(Uint8Array.of(n));}
 u32(n){const b=new Uint8Array(4);new DataView(b.buffer).setUint32(0,n,true);this.add(b);}
 f64(n){const b=new Uint8Array(8);new DataView(b.buffer).setFloat64(0,n,true);this.add(b);}
 str(s){const b=utf.encode(s);this.u32(b.length);this.add(b);}
 finish(){const b=new Uint8Array(this.size);let p=0;for(const x of this.chunks){b.set(x,p);p+=x.length;}return b;}
}
class Reader{
 constructor(b){this.b=b;this.v=new DataView(b.buffer,b.byteOffset,b.byteLength);this.p=0;}
 take(n){if(!Number.isSafeInteger(n)||n<0||this.p+n>this.b.length)throw Error('Archivo incompleto o dañado.');const start=this.p;this.p+=n;return start;}
 u8(){return this.v.getUint8(this.take(1));}
 u32(){return this.v.getUint32(this.take(4),true);}
 f64(){return this.v.getFloat64(this.take(8),true);}
 str(max){const n=this.u32();if(n>max*4)throw Error('Campo de texto demasiado largo.');const i=this.take(n);const s=decoder.decode(this.b.subarray(i,i+n));if(s.length>max)throw Error('Campo de texto demasiado largo.');return s;}
}

function count(r,max){const n=r.u32();if(n>max)throw Error('Demasiados registros en el expediente.');return n;}
function readEnum(r,values){const i=r.u8();if(i>=values.length)throw Error('Indicador de expediente inválido.');return values[i];}
function writeSources(w,sources){w.u32(sources.length);for(const s of sources){w.str(s.title);w.str(s.reference);w.str(s.quote);}}
function readSources(r){return Array.from({length:count(r,limits.sources)},()=>({title:r.str(300),reference:r.str(1000),quote:r.str(2000)}));}
function writeProfile(w,p){
 w.str(p.occupation||'');w.str(p.bio||'');w.u8(p.bookmark?1:0);
 for(const key of ['aliases','tags']){const list=p[key]||[];w.u32(list.length);for(const value of list)w.str(value);}
 const pic=p.portrait||'';if(!pic)w.u8(0);else{const type=pic.slice(11,pic.indexOf(';')),data=atob(pic.slice(pic.indexOf(',')+1));w.u8(['png','jpeg','webp'].indexOf(type)+1);w.u32(data.length);w.add(Uint8Array.from(data,x=>x.charCodeAt(0)));}
 const events=p.events||[];w.u32(events.length);for(const e of events){w.str(e.id);w.u8(eventTypes.indexOf(e.type));w.str(e.date);w.str(e.place);w.str(e.description);w.u8(certaintyValues.indexOf(e.certainty));writeSources(w,e.sources);}
 const claims=p.claims||[];w.u32(claims.length);for(const e of claims){w.str(e.id);w.u8(claimFields.indexOf(e.field));w.str(e.value);w.u8(certaintyValues.indexOf(e.certainty));writeSources(w,e.sources);}
}
function readProfile(r){
 const p={occupation:r.str(160),bio:r.str(5000)},b=r.u8();if(b>1)throw Error('Marcador inválido.');p.bookmark=!!b;p.aliases=Array.from({length:count(r,limits.aliases)},()=>r.str(160));p.tags=Array.from({length:count(r,limits.tags)},()=>r.str(60));
 const pic=r.u8();if(pic>3)throw Error('Formato de retrato inválido.');if(pic){const n=count(r,limits.portrait),start=r.take(n),data=r.b.subarray(start,start+n);let binary='';for(let i=0;i<data.length;i+=8192)binary+=String.fromCharCode(...data.subarray(i,i+8192));p.portrait='data:image/'+['png','jpeg','webp'][pic-1]+';base64,'+btoa(binary);}
 p.events=Array.from({length:count(r,limits.events)},()=>({id:r.str(80),type:readEnum(r,eventTypes),date:r.str(80),place:r.str(160),description:r.str(1000),certainty:readEnum(r,certaintyValues),sources:readSources(r)}));
 p.claims=Array.from({length:count(r,limits.claims)},()=>({id:r.str(80),field:readEnum(r,claimFields),value:r.str(1000),certainty:readEnum(r,certaintyValues),sources:readSources(r)}));return p;
}

export function encodeFTree(raw,{version=2}={}){
 const d=project(raw), w=new Writer(), indexes=new Map(d.people.map((p,i)=>[p.id,i]));
 if(![1,2].includes(version))throw Error('Versión de escritura desconocida.');if(version===1&&(d.people.some(hasExtensions)||d.relations.some(hasRelationExtensions)))throw Error('La versión 1 no admite expedientes ampliados.');
 w.str(d.title);w.u32(d.people.length);w.u32(d.relations.length);
 for(const p of d.people){for(const f of fields)w.str(p[f]);w.u8(states.indexOf(p.status));w.u8(p.publish?1:0);const pos=own(d.positions,p.id)?d.positions[p.id]:null;w.u8(pos?1:0);if(pos){w.f64(pos.x);w.f64(pos.y);}if(version===2)writeProfile(w,p);}
 for(const r of d.relations){w.u8(r.type==='parent'?0:1);w.u32(indexes.get(r.from));w.u32(indexes.get(r.to));if(version===2){w.u8(kinds.indexOf(r.kind||'unknown'));w.u8(certaintyValues.indexOf(r.certainty||'unknown'));writeSources(w,r.sources||[]);}}
 const body=w.finish(),out=new Uint8Array(20+body.length),v=new DataView(out.buffer);
 out.set(magic);v.setUint16(8,version,true);v.setUint16(10,0,true);v.setUint32(12,body.length,true);v.setUint32(16,crc32(body),true);out.set(body,20);return out;
}
export function decodeFTree(input){
 const bytes=input instanceof Uint8Array?input:new Uint8Array(input);
 if(bytes.length<20||bytes.length>MAX_BYTES||!magic.every((n,i)=>bytes[i]===n))throw Error('No es un archivo .ftree válido.');
 const h=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const version=h.getUint16(8,true);if(![1,2].includes(version)||h.getUint16(10,true)!==0)throw Error('Versión o características .ftree no compatibles.');
 const body=bytes.subarray(20);if(h.getUint32(12,true)!==body.length||h.getUint32(16,true)!==crc32(body))throw Error('Archivo .ftree dañado (longitud o CRC incorrectos).');
 const r=new Reader(body),title=r.str(120),n=r.u32(),m=r.u32(),people=[],relations=[],positions=[];
 if(n>2000||m>6000)throw Error('Demasiados registros.');
 const limits=[80,160,80,80,160,1000,10000,5000];
 for(let i=0;i<n;i++){const p={};for(let j=0;j<fields.length;j++)p[fields[j]]=r.str(limits[j]);const s=r.u8(),pub=r.u8(),pos=r.u8();if(s>2||pub>1||pos>1)throw Error('Indicadores binarios inválidos.');p.status=states[s];p.publish=!!pub;if(pos)positions.push([p.id,{x:r.f64(),y:r.f64()}]);if(version===2)Object.assign(p,readProfile(r));people.push(p);}
 for(let i=0;i<m;i++){const t=r.u8(),a=r.u32(),b=r.u32();if(t>1||a>=n||b>=n)throw Error('Referencia binaria inválida.');const edge={type:t?'partner':'parent',from:people[a].id,to:people[b].id};if(version===2){edge.kind=readEnum(r,kinds);edge.certainty=readEnum(r,certaintyValues);edge.sources=readSources(r);}relations.push(edge);}
 if(r.p!==body.length)throw Error('Datos adicionales inesperados.');
 return project({version:1,title,people,relations,positions:Object.fromEntries(positions)});
}
