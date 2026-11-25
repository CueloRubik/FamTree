import {blank,safeLink,validate,removePerson,related,searchPeople,layout} from '../js/model.mjs';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
const demo=JSON.parse(readFileSync(new URL('../data/demo.json',import.meta.url),'utf8'));
test("empty",()=>assert.ok((()=>validate(blank()).people.length===0)()));
test("sample",()=>assert.ok((()=>validate(demo).people.length===10)()));
test("generations",()=>assert.ok((()=>layout(demo).generations===4)()));
test("ancestors",()=>assert.ok((()=>related(demo,"i","ancestors").size===7)()));
test("descendants",()=>assert.ok((()=>related(demo,"a","descendants").size===7)()));
test("search accents",()=>assert.ok((()=>searchPeople(demo,"julian").length===1)()));
test("no overlap",()=>assert.ok((()=>new Set([...layout(demo).positions.values()].map(p=>p.x+","+p.y)).size===10)()));
test("remove links",()=>assert.ok((()=>removePerson(demo,"a").relations.every(r=>r.from!=="a"&&r.to!=="a"))()));
test("cycle",()=>assert.ok((()=>{try{validate({...demo,relations:[...demo.relations,{type:"parent",from:"i",to:"a"}]});return false}catch{return true}})()));
test("duplicate",()=>assert.ok((()=>{try{validate({...demo,people:[...demo.people,demo.people[0]]});return false}catch{return true}})()));
test("dangling",()=>assert.ok((()=>{try{validate({...demo,relations:[...demo.relations,{type:"parent",from:"a",to:"missing"}]});return false}catch{return true}})()));
test("bad URL",()=>assert.ok((()=>!safeLink("javascript:alert(1)")&&!safeLink("https://familysearch.org.evil.com/tree/person/details/ABCD-123")&&!safeLink("https://familysearch.org/tree/person/details/ABCD-123?token=abc"))()));
test("good URL",()=>assert.ok((()=>!!safeLink("https://www.familysearch.org/tree/person/details/ABCD-123"))()));
test("partner duplicate",()=>assert.ok((()=>{try{validate({...demo,relations:[...demo.relations,{type:"partner",from:"b",to:"a"}]});return false}catch{return true}})()));

test('partners align when consistent',()=>{const l=layout(demo);assert.equal(l.positions.get('c').depth,l.positions.get('d').depth);assert.equal(l.positions.get('g').depth,l.positions.get('h').depth)});
test('parent depth increases even with contradictory partner links',()=>{const d=validate({...demo,relations:[...demo.relations,{type:'partner',from:'a',to:'i'}]});const l=layout(d);for(const r of d.relations.filter(r=>r.type==='parent'))assert.ok(l.positions.get(r.from).depth<l.positions.get(r.to).depth)});


test('personal records keep notes regardless of life status',()=>{const d=validate({...blank(),people:[{id:'a',name:'Ejemplo',status:'living',notes:'Una nota',sources:'Una referencia'}]});assert.equal(d.people[0].notes,'Una nota');assert.equal(d.people[0].sources,'Una referencia');});
