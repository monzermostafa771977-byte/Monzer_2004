var CACHE_NAME = 'monzer-pwa-v3';
var ASSETS_TO_CACHE = [
  './',
  './index.html',
  './sync.js',
  './auth.js',
  './notifications.js',
  './chat.js',
  './chat-config.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

// 1. مرحلة التثبيت وتخزين كافة الملفات محلياً فوراً
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// 2. تفعيل التخزين وحذف النسخ القديمة فوراً والسيطرة على الصفحات
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// 3. استراتيجية Cache-First (الجلب من الذاكرة المحلية أولاً وقبل كل شيء)
self.addEventListener('fetch', function(event) {
  // تجاهل طلبات قاعدة البيانات أو الـ Firebase أو الطلبات غير GET
  if (
    event.request.url.includes('firebaseio.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('gstatic.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(function(cachedResponse) {
      if (cachedResponse) {
        // إذا وجد الملف مخزناً محلياً، قم بإرجاعه فوراً وبدون أي انتظار للإنترنت
        return cachedResponse;
      }
      // إذا لم يكن موجوداً محلياً، حاول جلبه من الشبكة كخيار ثانٍ وتخزينه
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          var responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(function() {
        // إذا فشلت الشبكة (لا يوجد إنترنت)، أرجع index.html الرئيسي للتنقل
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
