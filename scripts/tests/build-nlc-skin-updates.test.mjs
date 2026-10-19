import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {buildNlcSkinUpdates} from '../build-nlc-skin-updates.mjs';
import {readResourceManifest,installOfflineResourcePackage} from '../../services/core/src/roleResourceManager.ts';
import {AssetLibrary} from '../../services/core/src/assets.ts';

test('edition updates contain only owned NLC resources and Light packs install all three skins',async()=>{
 const out=mkdtempSync(path.join(tmpdir(),'terra-nlc-release-'));
 const data=mkdtempSync(path.join(tmpdir(),'terra-nlc-import-'));
 try{
  const result=await buildNlcSkinUpdates(path.resolve('.'),out);
  assert.equal(result.editions.length,4);
  for(const edition of ['full','plus','standard']){
   const manifest=JSON.parse(fs.readFileSync(path.join(out,edition,'UPDATE-MANIFEST.json'),'utf8'));
   assert.equal(manifest.edition,edition);
   assert.equal(manifest.resourceModels,2862);
   assert.equal(manifest.files.length,32);
   assert.ok(manifest.files.every(f=>f.kind==='runtime'&&f.destination.startsWith('dist/assets/builtin/')));
   assert.ok(manifest.files.every(f=>!/(?:trained-voices|speech-runtime|user-data|secrets)/i.test(f.destination)));
  }
  // Design reason: an empty bundled root prevents the full workspace assets
  // from masking a broken Light package during the real import/scan path.
  const emptyBuiltin=path.join(data,'empty-builtin');fs.mkdirSync(emptyBuiltin);
  const lib=new AssetLibrary(emptyBuiltin,data).scan();
  for(const [role,skin] of [['Shu','源远流长'],['Blaze the Igniting Spark','夜行烛火'],['Swire the Elegant Wit','盛世之象']]){
   const folder=path.join(out,'light','role-packs',role);
   const manifest=await readResourceManifest(folder);
   assert.equal(manifest.roleId,role);
   await installOfflineResourcePackage(data,folder);
   lib.scan();
   assert.equal(lib.bundles.filter(b=>b.operatorId===role&&b.skin.includes(skin)).length,3);
   assert.equal(lib.bundles.filter(b=>b.operatorId===role).length,9);
  }
 }finally{fs.rmSync(out,{recursive:true,force:true});fs.rmSync(data,{recursive:true,force:true});}
});
