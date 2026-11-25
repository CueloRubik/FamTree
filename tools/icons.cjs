const fs=require('node:fs'),zlib=require('node:zlib'),path=require('node:path');
const dir=path.join(__dirname,'..','build');fs.mkdirSync(dir,{recursive:true});
function crc(b){let c=0xffffffff;for(const x of b){c^=x;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function chunk(t,b){const a=Buffer.alloc(b.length+12);a.writeUInt32BE(b.length);a.write(t,4);b.copy(a,8);a.writeUInt32BE(crc(a.subarray(4,-4)),a.length-4);return a;}
function segment(x,y,a,b,c,d){const q=Math.max(0,Math.min(1,((x-a)*(c-a)+(y-b)*(d-b))/((c-a)**2+(d-b)**2)));return Math.hypot(x-a-q*(c-a),y-b-q*(d-b));}
function rounded(x,y,cx,cy,w,h,r){return Math.hypot(Math.max(Math.abs(x-cx)-(w-r),0),Math.max(Math.abs(y-cy)-(h-r),0))<=r;}
function pixel(x,y,doc){
 let col=[0,0,0,0];
 if(doc){
  if(x<.18||x>.83||y<.08||y>.92||x+y*0<0||x>.65&&y<.08+x-.65)return col;
  col=[248,247,237,255];if(x>.65&&y<.26)col=[211,224,206,255];
  if(x<.195||x>.815||y>.905||y<.095)col=[175,190,173,255];
  if(y>.735&&y<.89&&x>.19&&x<.82)col=[48,100,67,255];
  x=(x-.5)*1.35+.5;y=(y-.45)*1.35+.5;
 }else{
  if(!rounded(x,y,.5,.5,.44,.44,.19))return col;
  col=[Math.round(238-12*y),Math.round(244-9*y),Math.round(234-12*y),255];
  if(!rounded(x,y,.5,.5,.427,.427,.178))col=[163,186,158,255];
 }
 const brown=[122,79,47,255],greens=[[39,103,60,255],[65,133,78,255],[83,147,77,255]],leaves=[[.50,.25,.105,0],[.27,.40,.093,1],[.73,.40,.093,0],[.38,.55,.081,2],[.62,.55,.081,1]];
 if(segment(x,y,.5,.79,.5,.27)<.019||segment(x,y,.5,.61,.27,.40)<.015||segment(x,y,.5,.61,.73,.40)<.015||segment(x,y,.5,.72,.38,.55)<.012||segment(x,y,.5,.72,.62,.55)<.012)col=brown;
 for(const [a,b,r,c] of leaves)if(Math.hypot(x-a,y-b)<r)col=greens[c];
 return col;
}
function png(n,doc){const raw=Buffer.alloc(n*(n*4+1)),samples=n<=64?4:1;
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const k=j*(n*4+1)+1+i*4;if(samples===1){raw.set(pixel((i+.5)/n,(j+.5)/n,doc),k);continue;}const sums=[0,0,0,0];for(const dy of [.25,.75])for(const dx of [.25,.75]){const p=pixel((i+dx)/n,(j+dy)/n,doc);for(let c=0;c<3;c++)sums[c]+=p[c]*p[3];sums[3]+=p[3];}for(let c=0;c<3;c++)raw[k+c]=sums[3]?Math.round(sums[c]/sums[3]):0;raw[k+3]=Math.round(sums[3]/4);}
 const ih=Buffer.alloc(13);ih.writeUInt32BE(n);ih.writeUInt32BE(n,4);ih[8]=8;ih[9]=6;return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ih),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);}
function icns(images){const entries=[];for(const [type,size] of [['ic07',128],['ic08',256],['ic09',512],['ic10',1024]]){const b=images.get(size),h=Buffer.alloc(8);h.write(type);h.writeUInt32BE(b.length+8,4);entries.push(h,b);}const all=Buffer.concat(entries),h=Buffer.alloc(8);h.write('icns');h.writeUInt32BE(all.length+8,4);return Buffer.concat([h,all]);}
function ico(images){const sizes=[16,32,48,64,128,256],head=Buffer.alloc(6+16*sizes.length),chunks=[];head.writeUInt16LE(1,2);head.writeUInt16LE(sizes.length,4);let offset=head.length;for(let i=0;i<sizes.length;i++){const size=sizes[i],b=images.get(size),p=6+i*16;head[p]=head[p+1]=size===256?0:size;head.writeUInt16LE(1,p+4);head.writeUInt16LE(32,p+6);head.writeUInt32LE(b.length,p+8);head.writeUInt32LE(offset,p+12);offset+=b.length;chunks.push(b);}return Buffer.concat([head,...chunks]);}
for(const [name,doc] of [['icon',false],['document',true]]){const images=new Map([16,32,48,64,128,256,512,1024].map(n=>[n,png(n,doc)]));fs.writeFileSync(path.join(dir,name+'.png'),images.get(512));fs.writeFileSync(path.join(dir,name+'.icns'),icns(images));fs.writeFileSync(path.join(dir,name+'.ico'),ico(images));}
console.log('Iconos de aplicación y documentos creados (PNG, ICNS e ICO).');
