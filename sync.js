(function(){
var CK='monzer_sync',busy=false,tm=null,kc={};
function cfg(){try{return JSON.parse(localStorage.getItem(CK))}catch(e){return null}}
function setCfg(c){try{if(c)localStorage.setItem(CK,JSON.stringify(c));else localStorage.removeItem(CK)}catch(e){}}
function b64(u){var s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)}
function ub(s){var r=atob(s),u=new Uint8Array(r.length);for(var i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u}
async function key(p,salt){var id=p+'|'+salt;if(kc[id])return kc[id];var te=new TextEncoder(),b=await crypto.subtle.importKey('raw',te.encode(p),'PBKDF2',false,['deriveKey']);return kc[id]=await crypto.subtle.deriveKey({name:'PBKDF2',salt:te.encode(salt),iterations:100000,hash:'SHA-256'},b,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function enc(o,k){var iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(JSON.stringify(o))));return b64(iv)+'.'+b64(ct)}
async function dec(s,k){var a=s.split('.');return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(a[0])},k,ub(a[1]))))}
function strip(o){var c=Object.assign({},o);delete c._ym;delete c._ts;return c}
function merge(A,B){
 var d=Object.assign({},B.del||{},A.del||{}),nw=(A._ts||0)>=(B._ts||0)?A:B,M={salary:nw.salary,quota:nw.quota,del:d,att:{},leaves:[],ot:[],work:[]};
 function un(a,b,kf){var o={};(b||[]).concat(a||[]).forEach(function(x){o[x.id]=x});return Object.keys(o).map(function(k){return o[k]}).filter(function(x){return !d[kf(x)]})}
 M.leaves=un(A.leaves,B.leaves,function(x){return 'l:'+(x.gid||x.id)});
 M.ot=un(A.ot,B.ot,function(x){return 'o:'+x.id});
 M.work=un(A.work,B.work,function(x){return 'w:'+x.id});
 Object.keys(Object.assign({},B.att,A.att)).forEach(function(k){if(d['a:'+k])return;var a=(A.att||{})[k]||{},b=(B.att||{})[k]||{};M.att[k]={in:a.in||b.in,out:a.out||b.out}});
 return M}
function st(t){var e=document.getElementById('sst');if(e)e.textContent=t}
async function doSync(){
 var c=cfg();if(!c||!navigator.onLine||busy)return;busy=true;st('⏳ جارٍ المزامنة...');
 try{
  var k=await key(c.p,c.i),u=c.u+'/monzer/'+c.i+'.json',r=await fetch(u);if(!r.ok)throw new Error('get');
  var rem=await r.json(),changed=false;
  if(rem&&rem.d){var m=merge(S,await dec(rem.d,k));if(JSON.stringify(strip(m))!==JSON.stringify(strip(S))){m._ym=S._ym;m._ts=Date.now();S=m;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}changed=true}}
  var up=await fetch(u,{method:'PUT',body:JSON.stringify({t:Date.now(),d:await enc(strip(S),k)})});if(!up.ok)throw new Error('put');
  c.l=Date.now();setCfg(c);if(changed)render();else st('✅ تمت المزامنة')
 }catch(e){st('⚠️ تعذرت المزامنة، تأكد من الرابط وكلمة السر والإنترنت')}
 busy=false}
function sched(){if(!cfg())return;clearTimeout(tm);tm=setTimeout(doSync,2500)}
function code(c){return btoa(unescape(encodeURIComponent(JSON.stringify({u:c.u,i:c.i,p:c.p}))))}
function act(a){
 var e=document.getElementById('sst');
 if(a=='syn'){var u=V('fu').trim().replace(/\/+$/,''),p=V('fp');if(u.indexOf('https://')!==0||p.length<6){st('أدخل رابط قاعدة البيانات (يبدأ بـ https://) وكلمة سر من 6 أحرف على الأقل');return}
  var ra=crypto.getRandomValues(new Uint8Array(16)),id='';for(var i=0;i<ra.length;i++)id+=ra[i].toString(36);setCfg({u:u,i:id,p:p,l:0});render();doSync()}
 else if(a=='syj'){try{var o=JSON.parse(decodeURIComponent(escape(atob(V('fc').trim()))));if(!o.u||!o.i||!o.p)throw 0;setCfg({u:o.u,i:o.i,p:o.p,l:0});render();doSync()}catch(x){st('رمز الربط غير صحيح، انسخه كاملاً')}}
 else if(a=='syc'){var c=cfg(),t=document.getElementById('sco');if(c&&t){t.style.display='block';t.value=code(c);t.select();st('انسخ هذا الرمز وأرسله لنفسك فقط، فهو يفتح بياناتك')}}
 else if(a=='synow'){doSync()}
 else if(a=='syx'){setCfg(null);render()}}
window.schedSync=sched;window.syncAct=act;window.syncNow=doSync;window.monzerMerge=merge;window.__enc=enc;window.__dec=dec;window.__key=key;
window.addEventListener('online',sched);
document.addEventListener('visibilitychange',function(){if(!document.hidden)sched()});
setTimeout(doSync,1500);
})();
