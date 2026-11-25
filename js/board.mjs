import {layout} from './model.mjs';
export function boardLayout(data,only=null){
 const g=layout(data),positions=new Map(),fixed=new Map(),own=(id)=>Object.prototype.hasOwnProperty.call(data.positions||{},id);
 const maxDepth=Math.max(0,...[...g.positions.values()].map(p=>p.depth));
 for(const [id,p] of g.positions)if(own(id)){const q=data.positions[id];fixed.set(id,{...p,x:q.x,y:q.y});}
 const occupied=[...fixed.values()];
 for(const [id,p] of g.positions){if(fixed.has(id)){positions.set(id,fixed.get(id));continue;}const x0=(p.x-g.width/2)*.90,y=-p.depth*205;let x=x0;
 for(let i=0;occupied.some(q=>Math.abs(q.x-x)<174&&Math.abs(q.y-y)<100)&&i<4000;i++)x=x0+(i%2===0?1:-1)*Math.ceil((i+1)/2)*198;
 const next={...p,x,y};positions.set(id,next);occupied.push(next);}
 if(only){const people=g.people.filter(p=>only.has(p.id)),edges=g.edges.filter(r=>only.has(r.from)&&only.has(r.to));return {...g,people,edges,positions:new Map([...positions].filter(([id])=>only.has(id))),maxDepth};}
 return {...g,positions,maxDepth};
}
function controls(a,b){const dx=b.x-a.x,dy=b.y-a.y,bend=Math.max(35,Math.min(160,Math.abs(dy)*.59)),direction=dy>0?1:-1;return [{x:a.x+dx*.10,y:a.y+direction*bend},{x:b.x-dx*.20,y:b.y-direction*bend*.45}];}
export function branchPath(a,b,partner=false){
 if(partner){const bend=Math.min(45,Math.hypot(b.x-a.x,b.y-a.y)*.13);return 'M '+a.x+' '+a.y+' Q '+((a.x+b.x)/2)+' '+((a.y+b.y)/2+bend)+' '+b.x+' '+b.y;}
 const [c,d]=controls(a,b);return 'M '+a.x+' '+a.y+' C '+c.x+' '+c.y+', '+d.x+' '+d.y+', '+b.x+' '+b.y;
}
export function branchShape(a,b,width=8){
 const [c,d]=controls(a,b),normal=(x,y)=>{const l=Math.hypot(x,y)||1;return {x:-y/l,y:x/l};},n0=normal(c.x-a.x,c.y-a.y),n1=normal(b.x-d.x,b.y-d.y),mid=normal(b.x-a.x,b.y-a.y);
 const p=(v,n,w)=> (v.x+n.x*w)+' '+(v.y+n.y*w),w=width/2,t=Math.max(1.5,w*.36);
 return 'M '+p(a,n0,w)+' C '+p(c,mid,w*.8)+', '+p(d,mid,t*1.3)+', '+p(b,n1,t)+' L '+p(b,n1,-t)+' C '+p(d,mid,-t*1.3)+', '+p(c,mid,-w*.8)+', '+p(a,n0,-w)+' Z';
}
export function fitCamera(positions,w,h){const p=[...positions.values()];if(!p.length)return {x:w/2,y:h/2,z:1};const left=Math.min(...p.map(p=>p.x))-90,right=Math.max(...p.map(p=>p.x))+90,top=Math.min(...p.map(p=>p.y))-95,bottom=Math.max(...p.map(p=>p.y))+150;const z=Math.max(.002,Math.min(1.2,(w-30)/(right-left),(h-30)/(bottom-top)));return {x:w/2-(left+right)/2*z,y:h/2-(top+bottom)/2*z,z};}
