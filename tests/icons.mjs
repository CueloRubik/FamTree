import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
for(const name of ['icon','document']){
 const icns=readFileSync('build/'+name+'.icns'),ico=readFileSync('build/'+name+'.ico'),png=readFileSync('build/'+name+'.png');
 assert.equal(icns.toString('ascii',0,4),'icns');assert.equal(icns.readUInt32BE(4),icns.length);assert.equal(ico.readUInt16LE(2),1);assert.equal(ico.readUInt16LE(4),6);
 for(let i=0;i<6;i++){const p=6+i*16,offset=ico.readUInt32LE(p+12),size=ico.readUInt32LE(p+8);assert.ok(offset+size<=ico.length);assert.equal(ico[offset],137);}
 assert.equal(png.readUInt32BE(16),512);assert.equal(png.readUInt32BE(20),512);
}
assert.notDeepEqual(readFileSync('build/icon.ico'),readFileSync('build/document.ico'));assert.notDeepEqual(readFileSync('build/icon.icns'),readFileSync('build/document.icns'));
console.log('Iconos: ICNS e ICO válidos estructuralmente y distintos.');
