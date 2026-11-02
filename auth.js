(function(){
// تفعيل الحفظ الدائم للجلسة لعدم مطالبة المستخدم بتسجيل الدخول مراراً وتكراراً
if (typeof firebase !== 'undefined' && firebase.auth) {
  firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .catch(function(error) {
      console.error("خطأ في حفظ الجلسة:", error);
    });
}

function loginWithGoogle() {
  if (typeof firebase === 'undefined') {
    alert('مكتبة Firebase غير متصلة.');
    return;
  }
  
  // تغذية بصرية فورية للاستجابة السريعة عند الضغط
  var btn = document.querySelector('[data-a="gin"]');
  if(btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ جاري تحويلك لصفحة Google الرسمية...';
  }

  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithRedirect(provider).catch(function(error) {
    alert('تعذر تسجيل الدخول: ' + error.message);
    if(btn) {
      btn.disabled = false;
      btn.innerHTML = '🔑 تسجيل الدخول بحساب Google';
    }
  });
}

function logoutGoogle() {
  if (typeof firebase === 'undefined') return;
  firebase.auth().signOut().then(function() {
    currentUser = null;
    if (typeof render === 'function') render();
  });
}

window.loginWithGoogle = loginWithGoogle;
window.logoutGoogle = logoutGoogle;
})();
