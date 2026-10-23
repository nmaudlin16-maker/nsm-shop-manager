const CACHE='nsm-v8-shell-16';
const ASSETS=['./NSM_Shop_Manager_V8_Neon.html','./v8.js?v=picker16','./NSM-Designs-banner.png','./projects.js?v=picker16','./manifest-v8.webmanifest','./favicon-v8.ico','./icons/nsm-v8-16.png','./icons/nsm-v8-32.png','./icons/nsm-v8-180.png','./icons/nsm-v8-192.png','./icons/nsm-v8-512.png','./icons/nsm-v8-maskable-192.png','./icons/nsm-v8-maskable-512.png'];
const urls=new Set(ASSETS.map(p=>{const url=new URL(p,self.location);url.search='';return url.href}));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
// Only V8 static assets are cached. Account data and all API requests use the existing app engine.
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);url.search='';if(!urls.has(url.href))return;e.respondWith(fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}return response}).catch(()=>caches.match(e.request,{ignoreSearch:true})));});
