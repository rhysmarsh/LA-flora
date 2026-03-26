const CACHE_NAME='la-plant-guide-v3.013';
const ASSETS=['/','/index.html','/species-data.json','/manifest.json','/icons/icon-128.png','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-1024.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
e.respondWith(
fetch(e.request).then(r=>{
if(r&&r.status===200&&r.type==='basic'){const rc=r.clone();caches.open(CACHE_NAME).then(c=>c.put(e.request,rc));}
return r;
}).catch(()=>caches.match(e.request))
);
});