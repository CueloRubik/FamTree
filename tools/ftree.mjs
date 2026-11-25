import {readFileSync,writeFileSync} from 'node:fs';
import {encodeFTree,decodeFTree,MAX_BYTES} from '../js/ftree.mjs';
try{
 const [mode,input,output]=process.argv.slice(2);
 if(!['encode','decode'].includes(mode)||!input||!output)throw Error('Uso: node tools/ftree.mjs encode|decode entrada salida');
 const b=readFileSync(input);if(b.length>MAX_BYTES)throw Error('Archivo demasiado grande.');
 const data=mode==='encode'?encodeFTree(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(b))):JSON.stringify(decodeFTree(b),null,2)+'\n';
 writeFileSync(output,data,{flag:'wx'});console.log('Archivo creado:',output);
}catch(e){console.error(e.message);process.exitCode=1;}
