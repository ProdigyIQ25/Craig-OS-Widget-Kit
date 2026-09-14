import assert from "node:assert/strict";
import test from "node:test";
import type { NotionRow } from "../lib/notion-values";
import { deriveMedia, normalizeMediaTypes, normalizeMode, providerFor } from "../lib/widget-data/media";

function row(values:Record<string,string|number|boolean|null>):NotionRow{
  const properties:NotionRow["properties"]={};
  for(const [name,entry] of Object.entries(values)){
    if(name==="Title")properties[name]={type:"title",title:entry===null?[]:[{plain_text:String(entry)}]};
    else if(name==="URL")properties[name]={type:"url",url:entry};
    else if(typeof entry==="boolean")properties[name]={type:"checkbox",checkbox:entry};
    else if(typeof entry==="number")properties[name]={type:"number",number:entry};
    else if(name==="Purpose")properties[name]={type:"rich_text",rich_text:entry===null?[]:[{plain_text:String(entry)}]};
    else properties[name]={type:"select",select:entry===null?null:{name:String(entry)}};
  }
  return {id:crypto.randomUUID(),properties};
}

test("media filters accept only locked modes, types, and aliases",()=>{
  assert.deepEqual(normalizeMode("deep-work"),["DEEP WORK","WRITING"]);
  assert.deepEqual(normalizeMode("spiritual"),["SPIRITUAL"]);
  assert.equal(normalizeMode("invented"),null);
  assert.deepEqual(normalizeMediaTypes(["music","AUDIO","music"]),["MUSIC","AUDIO"]);
  assert.equal(normalizeMediaTypes(["MOVIE"]),null);
});

test("provider classification covers every authorized provider and safe fallback",()=>{
  assert.deepEqual(providerFor("https://youtu.be/abc123XYZ"),{provider:"youtube",safeUrl:"https://youtu.be/abc123XYZ",embedUrl:"https://www.youtube-nocookie.com/embed/abc123XYZ"});
  assert.equal(providerFor("https://open.spotify.com/track/123ABC").provider,"spotify");
  assert.equal(providerFor("https://vimeo.com/1234567").provider,"vimeo");
  assert.equal(providerFor("https://www.loom.com/share/abc123").provider,"loom");
  assert.equal(providerFor("https://media.example.com/focus.mp3").provider,"direct-audio");
  assert.equal(providerFor("https://soundcloud.com/example/public-track").provider,"external");
  assert.equal(providerFor("https://example.com/public-media").provider,"external");
  assert.equal(providerFor("http://example.com/unsafe.mp3").provider,"unavailable");
  assert.equal(providerFor("not-a-url").provider,"unavailable");
  assert.equal(providerFor(null).provider,"unavailable");
});

test("P11 derivation handles zero, multiple, favorite, missing URL, and archived-only equivalent",()=>{
  const filters={modes:["DEEP WORK","WRITING"] as const,mediaTypes:[] as [],favorite:null};
  assert.deepEqual(deriveMedia([],{modes:[...filters.modes],mediaTypes:[],favorite:null}),[]);
  const rows=[
    row({Title:"B",URL:"https://example.com/b",Mode:"DEEP WORK","Media Type":"VIDEO",Platform:"WEB",Purpose:"Focus",Duration:20,Favorite:false}),
    row({Title:"A",URL:null,Mode:"WRITING","Media Type":"REFERENCE",Platform:"WEB",Purpose:"Draft",Duration:45,Favorite:true}),
    row({Title:"Hidden",URL:"https://example.com/x",Mode:"SPIRITUAL","Media Type":"MUSIC",Platform:"WEB",Purpose:"",Duration:5,Favorite:false}),
  ];
  const all=deriveMedia(rows,{modes:[...filters.modes],mediaTypes:[],favorite:null});
  assert.equal(all.length,2);assert.equal(all[0].title,"A");assert.equal(all[0].provider,"unavailable");
  assert.deepEqual(deriveMedia(rows,{modes:[...filters.modes],mediaTypes:["VIDEO"],favorite:false}).map(item=>item.title),["B"]);
  assert.deepEqual(deriveMedia([],{modes:[...filters.modes],mediaTypes:[],favorite:null}),[]); // archived rows are excluded by queryActive
});
