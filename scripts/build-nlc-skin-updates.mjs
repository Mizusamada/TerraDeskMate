/** Build resource-only updates from the canonical workspace. Keeping the
 * payload allow-listed prevents development caches and private profiles from
 * leaking into four public editions or overwriting older role assets. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';

const roles=[['Shu','源远流长'],['Blaze the Igniting Spark','夜行烛火'],['Swire the Elegant Wit','盛世之象']];
const catalogs=['model-catalog.json','model-render-index.json','role-reference-catalog.json','role-transcript-catalog.json'];
const overlays=['native-textures','all-role-battle-textures','battle-texture-overrides'];
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write=(file,data)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');};
const copy=(src,dst)=>{fs.mkdirSync(path.dirname(dst),{recursive:true});fs.copyFileSync(src,dst);};
function walk(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(e=>{const p=path.join(root,e.name);if(e.isSymbolicLink())throw Error('Symlink in release source: '+p);return e.isDirectory()?walk(p):[p]});}
const normalized=file=>file.split(path.sep).join('/');

export async function buildNlcSkinUpdates(workspace,output){
 const root=path.resolve(workspace),out=path.resolve(output),builtin=path.join(root,'assets/builtin');
 if(fs.existsSync(out)){
  if(fs.readdirSync(out).length)throw Error('Refusing to overwrite nonempty output '+out);
 }else fs.mkdirSync(out,{recursive:true});
 const source=JSON.parse(fs.readFileSync(path.join(root,'docs/sources/2026-10-19-nlc-skins.json'),'utf8'));
 if(source.files.length!==27)throw Error('Expected exactly nine complete skin triplets');
 // The public provenance manifest is a checksum gate, not an untrusted copy list.
 for(const entry of source.files){
  const relative=entry.path.replaceAll('\\','/');
  if(!relative.startsWith('干员模型/')||relative.includes('..')||path.isAbsolute(relative))throw Error('Unsafe source path '+relative);
  const file=path.resolve(builtin,relative);
  if(!file.startsWith(builtin+path.sep)||sha(file)!==entry.sha256||fs.statSync(file).size!==entry.size)throw Error('Source fingerprint changed '+relative);
 }
 const resourceFiles=[...source.files.map(f=>f.path),...roles.map(([role])=>`干员模型/${role}/_meta.json`),'model-catalog.json','model-render-index.json'];
 const editions=[];
 for(const edition of ['full','plus','standard']){
  const dir=path.join(out,edition),files=[];
  for(const relative of resourceFiles){
   const destination='dist/assets/builtin/'+relative,relativePayload='payload/runtime/'+destination;
   const from=path.join(builtin,relative),to=path.join(dir,relativePayload);
   copy(from,to);files.push({path:normalized(relativePayload),kind:'runtime',destination:normalized(destination),sha256:sha(from),sizeBytes:fs.statSync(from).size});
  }
  write(path.join(dir,'UPDATE-MANIFEST.json'),{schemaVersion:1,edition,version:'0.3.2',requiresBaseVersion:'0.3.0 or later',resourceRoles:434,resourceModels:2862,preserves:['settings','API keys','chat','memory','custom characters','imported models','training inputs','speech runtime','existing voice weights'],files});
  copy(path.join(root,'scripts/apply-public-update.ps1'),path.join(dir,'应用更新.ps1'));
  fs.writeFileSync(path.join(dir,'使用说明.txt'),`Terra DeskMate ${edition} 0.3.2 皮肤资源更新。先关闭软件，解压整个 ZIP，用 Windows PowerShell 运行：powershell -NoProfile -ExecutionPolicy Bypass -File "应用更新.ps1" -Target "现有安装目录"。此包不是首次安装包，不含密钥、聊天、训练权重或私人数据。\n`);
  editions.push(edition);
 }
 // Light does not bundle these operators. Ship complete role packages so a
 // previously installed role is atomically replaced with all old and new skins.
 const light=path.join(out,'light','role-packs');
 const catalogData=Object.fromEntries(catalogs.map(name=>[name,JSON.parse(fs.readFileSync(path.join(builtin,name),'utf8'))]));
 for(const [role] of roles){
  const packageRoot=path.join(light,role),content=path.join(packageRoot,'content');
  for(const category of ['干员模型','干员语音','干员档案']){
   const from=path.join(builtin,category,role);
   if(fs.existsSync(from))for(const file of walk(from))copy(file,path.join(content,category,role,path.relative(from,file)));
  }
  for(const [name,data] of Object.entries(catalogData)){
   const field=data.models?'models':'roles';
   const entries=Object.fromEntries(Object.entries(data[field]||{}).filter(([key])=>field==='roles'?key===role:key.startsWith(`干员模型/${role}/`)));
   write(path.join(content,name),{...data,[field]:entries});
  }
  // Include only the existing same-role texture overlays. Their original
  // hashes and files remain intact, so updating a skin does not downgrade it.
  for(const overlay of overlays){
   const data=JSON.parse(fs.readFileSync(path.join(builtin,overlay,'index.json'),'utf8'));
   const entries=Object.fromEntries(Object.entries(data.entries||{}).filter(([key])=>key.startsWith(`干员模型/${role}/`)));
   const referenced=new Set();
   function collect(value){if(typeof value==='string'&&value.replaceAll('\\','/').startsWith(overlay+'/'))referenced.add(value.replaceAll('\\','/'));else if(value&&typeof value==='object')Object.values(value).forEach(collect)}
   collect(entries);
   for(const relative of referenced){const src=path.resolve(builtin,relative);if(!src.startsWith(builtin+path.sep))throw Error('Overlay path escape '+relative);copy(src,path.join(content,relative));}
   write(path.join(content,overlay,'index.json'),{...data,entries});
  }
  write(path.join(content,'character.json'),{schemaVersion:1,id:role,displayName:role,kind:'builtin',persona:{displayName:role},model:{defaultActionGroup:'基建'},autoConfigure:{roleId:role,ownReferences:true,spawnOnImport:false},validation:'not_run'});
  fs.writeFileSync(path.join(packageRoot,'使用说明.md'),`# ${role} 0.3.2\n\n在 Light 的下载管理中选择本目录（含 manifest.json）导入。重新导入只替换该角色资源包，不修改个人记录或其他角色。\n`);
  const files=walk(packageRoot).filter(file=>path.basename(file)!=='manifest.json').map(file=>({path:path.relative(packageRoot,file),sizeBytes:fs.statSync(file).size,sha256:sha(file)})).sort((a,b)=>a.path.localeCompare(b.path));
  const bytes=files.reduce((n,file)=>n+file.sizeBytes,0),metadata=JSON.parse(fs.readFileSync(path.join(builtin,'干员模型',role,'_meta.json'),'utf8'));
  write(path.join(packageRoot,'manifest.json'),{schemaVersion:1,roleId:role,displayName:metadata.name,kind:'base',version:'0.3.2',source:'managed',installSizeBytes:bytes,downloadSizeBytes:bytes,sha256:createHash('sha256').update(JSON.stringify(files)).digest('hex'),files,includes:['own-role-models-all-skins','official-originals','own-archive','public-reference-index'],excludes:['speech-runtime','trained-voices','user-data']});
 }
 fs.writeFileSync(path.join(out,'light','使用说明.txt'),'Light 0.3.2 可选角色皮肤包：逐个解压角色文件夹，在软件的下载管理选择含 manifest.json 的角色文件夹导入。不要选择上层 role-packs。先关闭正在显示的对应桌宠。不会自动显示或更改个人数据。\n');
 editions.push('light');return {editions,roles:roles.map(([role])=>role)};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const out=path.resolve(process.argv[2]||'.build/nlc-release-0.3.2'),result=await buildNlcSkinUpdates(process.cwd(),out);
 const seven='D:/Software/Compression/7-Zip/7z.exe';
 for(const edition of result.editions){const zip=path.join(out,`TerraDeskMate-${edition}-NLC-0.3.2.zip`);execFileSync(seven,['a','-tzip','-mx=5','-bd',zip,'.'],{cwd:path.join(out,edition),windowsHide:true,stdio:'ignore'});execFileSync(seven,['t',zip],{windowsHide:true,stdio:'ignore'});console.log(edition,fs.statSync(zip).size,sha(zip));}
}
