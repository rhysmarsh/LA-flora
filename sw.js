const CACHE_NAME='la-plant-guide-v3.032';
const APP_SHELL=['/','/index.html','/species-data.json','/manifest.json','/icons/icon-128.png','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-1024.png','/icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
if(e.request.method!=='GET')return;
const url=new URL(e.request.url);
if(url.origin!==self.location.origin)return;
e.respondWith(
caches.open(CACHE_NAME).then(cache=>
cache.match(e.request).then(cached=>{
const net=fetch(e.request).then(r=>{
if(r&&r.status===200)cache.put(e.request,r.clone());
return r;
}).catch(()=>null);
return cached||net;
})
)
);
});
