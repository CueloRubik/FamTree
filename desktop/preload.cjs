const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('famDesktop',{
 open:()=>ipcRenderer.invoke('famtree:open'),
 save:(bytes,token,name,saveAs=false)=>ipcRenderer.invoke('famtree:save',bytes,token,name,saveAs),
 printPDF:name=>ipcRenderer.invoke('famtree:pdf',name),
 profile:()=>ipcRenderer.invoke('famtree:profile'),
 onDocument:fn=>{ipcRenderer.on('famtree:document',(_e,doc)=>fn(doc));},
 onCommand:fn=>{ipcRenderer.on('famtree:command',(_e,cmd)=>fn(cmd));},
 ready:()=>ipcRenderer.send('famtree:ready')
});
