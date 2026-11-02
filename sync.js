(function(){
var CK='monzer_sync',busy=false,tm=null,kc={};
var DB_URL = "https://monzer-771977-default-rtdb.europe-west1.firebasedatabase.app";

// Initialize Firebase if not initialized
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp({
    databaseURL: DB_URL,
    authDomain: "monzer-771977.firebaseapp.com",
    projectId: "monzer-771977"
  });
}

function b64(u){var s='';for(var i=0;i<u.length;i++)s+=String.fromCharCode(u[i]);return btoa(s)}
function ub(s){var r=atob(s),u=new Uint8Array(r.length);for(var i=0;i<r.length;i++)u[i]=r.charCodeAt(i);return u}
async function key(p,salt){var id=p+'|'+salt;if(kc[id])return kc[id];var te=new TextEncoder(),b=await crypto.subtle.importKey('raw',te.encode(p),'PBKDF2',false,['deriveKey']);return kc[id]=await crypto.subtle.deriveKey({name:'PBKDF2',salt:te.encode(salt),iterations:100000,hash:'SHA-256'},b,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function enc(o,k){var iv=crypto.getRandomValues(new Uint8Array(12)),ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv:iv},k,new TextEncoder().encode(JSON.stringify(o))));return b64(iv)+'.'+b64(ct)}
async function dec(s,k){var a=s.split('.');return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:ub(a[0])},k,ub(a[1]))))}
function so(x){var r={};Object.keys(x||{}).sort().forEach(function(k){r[k]=x[k]});return r}
function sig(o){return JSON.stringify([o.salary||0,so(o.quota),so(o.rates),so(o.del),so(o.att),o.leaves||[],o.ot||[],o.work||[],o.shifts||[]])}
function strip(o){var c=Object.assign({},o);delete c._ym;delete c._ts;return c}
function merge(A,B){
 var d=Object.assign({},B.del||{},A.del||{}),nw=(A._ts||0)>=(B._ts||0)?A:B,M={salary:nw.salary,quota:nw.quota,rates:nw.rates,shifts:[],del:d,att:{},leaves:[],ot:[],work:[]};
 function un(a,b,kf){var o={};(b||[]).concat(a||[]).forEach(function(x){o[x.id]=x});return Object.keys(o).map(function(k){return o[k]}).filter(function(x){return !d[kf(x)]})}
 M.leaves=un(A.leaves,B.leaves,function(x){return 'l:'+(x.gid||x.id)});
 M.ot=un(A.ot,B.ot,function(x){return 'o:'+x.id});
 M.work=un(A.work,B.work,function(x){return 'w:'+x.id});
 M.shifts=un(A.shifts,B.shifts,function(x){return 's:'+x.id});
 Object.keys(Object.assign({},B.att,A.att)).forEach(function(k){if(d['a:'+k])return;var a=(A.att||{})[k]||{},b=(B.att||{})[k]||{};M.att[k]={in:a.in||b.in,out:a.out||b.out}});
 return M}
function st(t){var e=document.getElementById('sst');if(e)e.textContent=t}

async function doSync(){
 if(!currentUser||!navigator.onLine||busy)return;busy=true;st('⏳ جارٍ المزامنة السحابية بإيميلك...');
 try{
  var passKey = currentUser.uid.slice(0, 16);
  var k=await key(passKey, currentUser.uid);
  var u=DB_URL+'/users/'+currentUser.uid+'.json';
  var r=await fetch(u);if(!r.ok)throw new Error('get');
  var rem=await r.json(),changed=false;
  if(rem&&rem.d){
    var R=await dec(rem.d,k);R._ts=rem.t||0;
    var m=merge(S,R);
    if(sig(m)!==sig(S)){m._ym=S._ym;m._ts=Math.max(S._ts||0,rem.t||0);S=m;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}changed=true}
  }
  var up=await fetch(u,{method:'PUT',body:JSON.stringify({t:S._ts||Date.now(),email:currentUser.email,d:await enc(strip(S),k)})});if(!up.ok)throw new Error('put');
  if(changed)render();else st('✅ تمت المزامنة بنجاح وحفظ بياناتك سحابياً')
 }catch(e){st('⚠️ تعذرت المزامنة، تأكد من الاتصال بالإنترنت')}
 busy=false}

function sched(){if(!currentUser)return;clearTimeout(tm);tm=setTimeout(doSync,2500)}

// Auth State Change Listener
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged(function(user) {
    currentUser = user;
    if (typeof render === 'function') render();
    if (user) doSync();
  });
}

window.schedSync=sched;window.syncNow=doSync;window.monzerMerge=merge;
window.doSync=doSync;
window.addEventListener('online',sched);
document.addEventListener('visibilitychange',function(){if(!document.hidden)sched()});
})();
