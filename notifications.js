(function(){
// Notifications Module for Monzer PWA
var NOTIF_KEY = 'monzer_notifications_config';
function getConfig(){
  try{
    var c = localStorage.getItem(NOTIF_KEY);
    return c ? JSON.parse(c) : {inEn: true, inTime: '07:45', outEn: true, outTime: '15:45', otEn: true, otTime: '16:00'};
  }catch(e){
    return {inEn: true, inTime: '07:45', outEn: true, outTime: '15:45', otEn: true, otTime: '16:00'};
  }
}
function saveConfig(cfg){
  try{ localStorage.setItem(NOTIF_KEY, JSON.stringify(cfg)); }catch(e){}
}

function requestPermission(){
  if(!('Notification' in window)) {
    alert('متصفحك لا يدعم الإشعارات');
    return;
  }
  Notification.requestPermission().then(function(perm){
    if(perm === 'granted'){
      new Notification('Monzer PWA', { body: 'تم تفعيل الإشعارات بنجاح لتذكيرك بالمواعيد!', icon: 'icon-192.png' });
    } else {
      alert('تم رفض إذن الإشعارات.');
    }
    if(typeof render === 'function') render();
  });
}

function checkAlarms(){
  if(!('Notification' in window) || Notification.permission !== 'granted') return;
  var cfg = getConfig();
  var now = new Date();
  var hh = String(now.getHours()).padStart(2, '0');
  var mm = String(now.getMinutes()).padStart(2, '0');
  var curTime = hh + ':' + mm;
  var todayStr = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2, '0')+'-'+String(now.getDate()).padStart(2, '0');
  
  var lastTriggered = '';
  try{ lastTriggered = localStorage.getItem('monzer_last_trig') || ''; }catch(e){}

  if(cfg.inEn && curTime === cfg.inTime && lastTriggered !== todayStr+'_in'){
    new Notification('🕗 تنبيه حضور Monzer', { body: 'حان موعد تسجيل الحضور الآن (الموعد: 7:45 ص)', icon: 'icon-192.png' });
    localStorage.setItem('monzer_last_trig', todayStr+'_in');
  }
  if(cfg.outEn && curTime === cfg.outTime && lastTriggered !== todayStr+'_out'){
    new Notification('🕒 تنبيه انصراف Monzer', { body: 'حان موعد تسجيل الانصراف الآن (الموعد: 3:45 م)', icon: 'icon-192.png' });
    localStorage.setItem('monzer_last_trig', todayStr+'_out');
  }
  if(cfg.otEn && curTime === cfg.otTime && lastTriggered !== todayStr+'_ot'){
    new Notification('🌙 تنبيه سهر Monzer', { body: 'حان موعد تسجيل السهر والأعياد الآن (الموعد: 4:00 م)', icon: 'icon-192.png' });
    localStorage.setItem('monzer_last_trig', todayStr+'_ot');
  }
}

setInterval(checkAlarms, 30000);

window.monzerNotif = {
  getConfig: getConfig,
  saveConfig: saveConfig,
  requestPermission: requestPermission
};
})();
