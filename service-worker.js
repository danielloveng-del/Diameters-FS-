// اسم النسخة - غيّره عند أي تحديث مستقبلي للملفات حتى يعيد المتصفح تحميلها
const CACHE_NAME = 'rb-generator-cache-v1';

// كل الملفات المطلوبة لعمل التطبيق بدون إنترنت
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

// عند التثبيت: نحمّل ونخزّن كل الملفات المطلوبة
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// عند التفعيل: نحذف أي نسخ تخزين قديمة لا نحتاجها
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// عند أي طلب: أعطِ النسخة المخزنة أولاً (سريعة وتعمل بدون إنترنت)
// ولو ما كانت موجودة بالتخزين، جرّب الإنترنت، وخزّنها لاستخدامها لاحقًا
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // خزّن نسخة من الاستجابة الجديدة للاستخدام القادم بدون إنترنت
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // لا يوجد إنترنت ولا يوجد نسخة مخزنة لهذا الطلب
        return new Response('غير متصل بالإنترنت ولا توجد نسخة محفوظة لهذا الملف.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
