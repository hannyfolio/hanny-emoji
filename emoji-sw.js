// 캐시 버전 — 배포할 때마다 자동 갱신되도록 빌드 시 교체됨 (없으면 sw 파일 변경만으로 갱신)
const VERSION = '__BUILD_ID__';
const CACHE = `emoji-picker-${VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './emoji-manifest.json',
  './assets/app-icon.jpg',
  './assets/background.jpg',
  './assets/concept1.jpg',
  './assets/concept2.jpg',
  './assets/concept3.jpg',
  './assets/concept4.gif',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// HTML/JSON은 network-first (항상 최신 우선), 이미지는 cache-first (속도 우선)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isHTML = e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  const isJSON = url.pathname.endsWith('.json') || url.pathname.endsWith('.js');

  if (isHTML || isJSON) {
    e.respondWith(
      fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached ||
        fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
      )
    );
  }
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
