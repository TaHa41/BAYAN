const CACHE="bayan-shell-v2";
const SHELL=["/","/manifest.json","/logo.svg","/styles.css","/app.js","/content-data.js","/ad-manager.js"];
const CACHEABLE=new Set(SHELL);
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
 const u=new URL(event.request.url);
 if(u.origin!==location.origin||event.request.method!=="GET"||u.pathname.startsWith("/api/")) return;
 if(!CACHEABLE.has(u.pathname)&&!u.pathname.startsWith("/assets/")) return;
 event.respondWith(fetch(event.request).then(r=>{const copy=r.clone();if(r.ok)caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(event.request).then(r=>r||caches.match("/"))));
});
