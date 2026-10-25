const CACHE='nsm-v8-shell-18';
const ASSETS=['./NSM_Shop_Manager_V8_Neon.html','./v8.js?v=release18','./NSM-Designs-banner.png','./projects.js?v=release18','./manifest-v8.webmanifest','./favicon-v8.ico','./icons/nsm-v8-16.png','./icons/nsm-v8-32.png','./icons/nsm-v8-180.png','./icons/nsm-v8-192.png','./icons/nsm-v8-512.png','./icons/nsm-v8-maskable-192.png','./icons/nsm-v8-maskable-512.png'];
const urls=new Set(ASSETS.map(p=>{const url=new URL(p,self.location);url.search='';return url.href}));
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async cache=>{await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));await self.skipWaiting()})));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
// Only V8 static assets are cached. Account data and all API requests use the existing app engine.
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;const url=new URL(e.request.url);url.search='';if(!urls.has(url.href))return;e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(e.request,{cache:'no-store'});if(!response.ok)throw Error('App file unavailable');await cache.put(url.href,response.clone());return response}catch(err){const saved=await cache.match(url.href,{ignoreSearch:true});if(saved)return saved;throw err}})());});
