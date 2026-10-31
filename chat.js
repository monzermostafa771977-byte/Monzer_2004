(function(){
var CF=window.MONZER_CHAT||{},LK='monzer_ck',OK='monzer_owner',MK='monzer_msgs',NK='monzer_cname',TK='monzer_oth',busy=false,sel=null,showO=false;
function J(k,d){try{var v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}}
function W(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
function b64(u){var s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)}
function ub(s){var r=atob(s),u=new Uint8Array(r.length);for(var i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u}
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function db(){return (CF.db||'').replace(/\/+$/,'')}
function ready(){return !!(db()&&CF.owner)}
function isOwner(){var o=J(OK,null);return !!(o&&o.priv&&CF.owner&&o.priv.n===CF.owner.n)}
async function get(p){var r=await fetch(db()+p+'.json');if(!r.ok)throw new Error('g');return r.json()}
function put(p,v){return fetch(db()+p+'.json',{method:'PUT',body:JSON.stringify(v)})}
async function putOnce(p,v){var r=await put(p,v);if(r.ok)return true;try{return (await get(p))!=null}catch(e){return false}}
function mid(){return Date.now().toString(36)+('0'+Math.floor(Math.random()*1296).toString(36)).slice(-2)}
var RSA={name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},RH={name:'RSA-OAEP',hash:'SHA-256'};
async function genKeys(){var k=await crypto.subtle.generateKey(RSA,true,['encrypt','decrypt']);return{pub:await crypto.subtle.exportKey('jwk',k.publicKey),priv:await crypto.subtle.exportKey('jwk',k.privateKey)}}
async function hEnc(text,pub){var pk=await crypto.subtle.importKey('jwk',pub,RH,false,['encrypt']),ak=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']),iv=crypto.getRandomValues(new Uint8Array(12)),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},ak,new TextEncoder().encode(text)),raw=await crypto.subtle.exportKey('raw',ak),wk=await crypto.subtle.encrypt({name:'RSA-OAEP'},pk,raw);return{k:b64(new Uint8Array(wk)),i:b64(iv),c:b64(new Uint8Array(ct))}}
async function hDec(e,priv){var sk=await crypto.subtle.importKey('jwk',priv,RH,false,['decrypt']),raw=await crypto.subtle.decrypt({name:'RSA-OAEP'},sk,ub(e.k)),ak=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['decrypt']);return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(e.i)},ak,ub(e.c)))}
async function ident(){var me=J(LK,null);if(me&&me.uid)return me;var k=await genKeys(),r=crypto.getRandomValues(new Uint8Array(12)),id='';for(var i=0;i<r.length;i++)id+=('0'+r[i].toString(16)).slice(-2);me={uid:id,pub:k.pub,priv:k.priv,reg:0};W(LK,me);return me}
function has(a,k){return a.some(function(x){return x.id==k})}
function badge(){var n=0;if(isOwner()){var T=J(TK,{});for(var u in T)T[u].msgs.forEach(function(m){if(m.n)n++})}else J(MK,[]).forEach(function(m){if(m.n)n++});var e=document.getElementById('cbd');if(e)e.textContent=n?(' '+n):''}
function refresh(){badge();if(typeof tab!=='undefined'&&tab=='chat'){var a=document.getElementById('cmsg'),v=a?a.value:'';render();var b=document.getElementById('cmsg');if(b&&v)b.value=v}}
async function uSync(){
 if(!ready()||!navigator.onLine||busy||isOwner())return;busy=true;
 try{var me=await ident();
  if(!me.reg){if(await putOnce('/index/'+me.uid+'/pub',JSON.stringify(me.pub))){me.reg=1;W(LK,me)}else throw 0}
  var ms=J(MK,[]),ch=false;
  for(var i=0;i<ms.length;i++){var m=ms[i];if(m.f=='u'&&!m.s){var e=await hEnc(JSON.stringify({x:m.x,n:J(NK,'')}),CF.owner);if(await putOnce('/chat/'+me.uid+'/'+m.id,{f:'u',t:m.t,e:e})){m.s=1;ch=true;await put('/index/'+me.uid+'/last',m.t)}else throw 0}}
  var rem=(await get('/chat/'+me.uid))||{};
  for(var k in rem){var v=rem[k];if(v.f=='o'&&!has(ms,k)){try{ms.push({id:k,f:'o',t:v.t,x:await hDec(v.e,me.priv),s:1,n:1});ch=true}catch(e2){}}}
  ms.sort(function(a,b){return a.t-b.t});W(MK,ms);if(ch)refresh()
 }catch(e){}
 busy=false}
async function oSync(){
 if(!ready()||!navigator.onLine||busy||!isOwner())return;busy=true;
 try{var o=J(OK),idx=(await get('/index'))||{},T=J(TK,{}),ch=false;
  for(var uid in idx){var ent=idx[uid],th=T[uid]=T[uid]||{pub:ent.pub,n:'',msgs:[],fetched:0};th.pub=ent.pub||th.pub;
   for(var i=0;i<th.msgs.length;i++){var m=th.msgs[i];if(m.f=='o'&&!m.s&&th.pub){var e=await hEnc(m.x,JSON.parse(th.pub));if(await putOnce('/chat/'+uid+'/'+m.id,{f:'o',t:m.t,e:e})){m.s=1;ch=true}}}
   if((ent.last||0)>(th.fetched||0)){var rem=(await get('/chat/'+uid))||{};
    for(var k in rem){var v=rem[k];if(v.f=='u'&&!has(th.msgs,k)){try{var d=JSON.parse(await hDec(v.e,o.priv));th.msgs.push({id:k,f:'u',t:v.t,x:d.x,n:1});if(d.n)th.n=d.n;ch=true}catch(e2){}}}
    th.fetched=ent.last||0}
   th.msgs.sort(function(a,b){return a.t-b.t})}
  W(TK,T);if(ch)refresh()
 }catch(e){}
 busy=false}
function sync(){return isOwner()?oSync():uSync()}
function bub(m,mine){return '<div class="bub '+(m.f==mine?'me':'th')+'">'+esc(m.x)+'<small>'+new Date(m.t).toLocaleString('ar-EG')+(m.f==mine&&!m.s?' • ⏳ في الانتظار':'')+'</small></div>'}
function ownerSetup(){return '<div class="card"><h2>🛠️ إعداد المطوّر</h2><div class="sub">للمطوّر فقط. أدخل رابط قاعدة بيانات Firebase ثم أنشئ رمز الإعداد.</div><label>رابط قاعدة البيانات</label><input id="odb" placeholder="https://xxxx-default-rtdb.firebaseio.com" value="'+esc(CF.db||'')+'"><button data-c="ogen">إنشاء رمز الإعداد</button><textarea id="oout" rows="4" style="display:none"></textarea><button data-c="okey" class="sec">عرض المفتاح السري للنسخ الاحتياطي</button><label>استرجاع مفتاح سري محفوظ</label><textarea id="opk" rows="2"></textarea><button data-c="orest" class="sec">استرجاع</button><div id="omsg" class="sub"></div></div>'}
function userView(){var ms=J(MK,[]);ms.forEach(function(m){m.n=0});W(MK,ms);
 return '<div class="card"><div class="sub">اكتب ملاحظاتك أو مشاكلك أو أفكارك لتطوير التطبيق. رسالتك تصل للمطوّر <b>مشفّرة</b> ولا يقرؤها غيره. لا تكتب كلمات سر أو أرقاماً حساسة. التطبيق يعمل بدون إنترنت، وتُرسل رسائلك عند عودة الاتصال.</div><label>اسمك (اختياري)</label><input id="cname" maxlength="40" value="'+esc(J(NK,''))+'"></div><div class="card"><h2>المحادثة</h2>'+(ms.length?ms.map(function(m){return bub(m,'u')}).join(''):'<div class="empty">لا توجد رسائل بعد</div>')+'<textarea id="cmsg" rows="3" maxlength="1000" placeholder="اكتب رسالتك..."></textarea><button data-c="send">إرسال</button></div><button class="sec" data-c="otog">إعدادات المطوّر</button>'+(showO?ownerSetup():'')}
function ownerView(){var T=J(TK,{});
 if(sel&&T[sel]){var th=T[sel];th.msgs.forEach(function(m){m.n=0});W(TK,T);
  return '<div class="card"><button class="sec" data-c="back" style="margin:0 0 10px">⬅️ رجوع</button><h2>'+esc(th.n||('مستخدم '+sel.slice(0,6)))+'</h2>'+th.msgs.map(function(m){return bub(m,'o')}).join('')+'<textarea id="cmsg" rows="3" placeholder="اكتب ردك..."></textarea><button data-c="send">إرسال الرد</button></div>'}
 function last(t){return t.msgs.length?t.msgs[t.msgs.length-1].t:0}
 var ids=Object.keys(T).sort(function(a,b){return last(T[b])-last(T[a])});
 var h='<div class="card"><h2>صندوق الوارد (مطوّر)</h2><div class="sub">'+ids.length+' محادثة</div>';
 h+=ids.length?ids.map(function(u){var t=T[u],un=t.msgs.filter(function(m){return m.n}).length,lm=t.msgs[t.msgs.length-1];return '<div class="li" data-c="open" data-u="'+u+'" style="cursor:pointer"><span><b>'+esc(t.n||('مستخدم '+u.slice(0,6)))+'</b><br><small style="color:var(--mu)">'+esc(lm?lm.x.slice(0,50):'')+'</small></span><span>'+(un?'🔴 '+un:'')+'</span></div>'}).join(''):'<div class="empty">لا توجد رسائل بعد</div>';
 return h+'</div><button class="sec" data-c="otog">إعدادات المطوّر</button>'+(showO?ownerSetup():'')}
window.vChat=function(){var h='<h1>💬 التواصل مع المطوّر</h1>';
 if(!ready())return h+'<div class="card"><div class="sub">الدردشة لم تُفعَّل بعد في هذه النسخة.</div></div>'+ownerSetup();
 return h+(isOwner()?ownerView():userView())};
function say(t){var e=document.getElementById('omsg');if(e)e.textContent=t}
document.addEventListener('click',async function(ev){var b=ev.target.closest('[data-c]');if(!b)return;var c=b.dataset.c;
 if(c=='send'){var x=V('cmsg').trim().slice(0,1000);if(!x)return;
  if(isOwner()){var T=J(TK,{});if(!sel||!T[sel])return;T[sel].msgs.push({id:mid(),f:'o',t:Date.now(),x:x,s:0});W(TK,T)}
  else{W(NK,V('cname'));var ms=J(MK,[]);ms.push({id:mid(),f:'u',t:Date.now(),x:x,s:0});W(MK,ms)}
  var a=document.getElementById('cmsg');if(a)a.value='';render();sync()}
 else if(c=='open'){sel=b.dataset.u;render();window.scrollTo(0,0)}
 else if(c=='back'){sel=null;render()}
 else if(c=='otog'){showO=!showO;render()}
 else if(c=='ogen'){var u=V('odb').trim().replace(/\/+$/,'');if(u.indexOf('https://')!==0){say('أدخل رابط قاعدة البيانات أولاً (يبدأ بـ https://)');return}
  var o=J(OK,null);if(!o||!o.priv){var k=await genKeys();o={priv:k.priv,pub:k.pub};W(OK,o)}
  var pub={kty:o.priv.kty,n:o.priv.n,e:o.priv.e,alg:'RSA-OAEP-256',ext:true,key_ops:['encrypt']};
  var t=document.getElementById('oout');t.style.display='block';t.value=btoa(unescape(encodeURIComponent(JSON.stringify({db:u,owner:pub}))));t.select();say('انسخ هذا الرمز كاملاً وأرسله لمن يجهّز لك الحزمة. هو لا يحتوي على أي سر.')}
 else if(c=='okey'){var o2=J(OK,null);if(!o2){say('لم تُنشئ مفتاحاً بعد');return}var t2=document.getElementById('oout');t2.style.display='block';t2.value=JSON.stringify(o2.priv);t2.select();say('احتفظ بهذا المفتاح سراً. بدونه لا تُقرأ الرسائل القديمة على هاتف جديد.')}
 else if(c=='orest'){try{var pv=JSON.parse(V('opk').trim());if(!pv.n||!pv.d)throw 0;W(OK,{priv:pv});say('تم الاسترجاع');render();sync()}catch(e){say('المفتاح غير صحيح')}}
});
window.chatBadge=badge;window.__chatSync=sync;
window.addEventListener('online',sync);
var n=0;setInterval(function(){if(document.hidden)return;n++;if(typeof tab!=='undefined'&&tab=='chat'||n%3==0)sync()},20000);
setTimeout(function(){sync();badge()},2500);
})();
