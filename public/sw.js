/* Service Worker Passarelli Doces
 * Estratégias:
 *  - Navegação (HTML SSR): sempre network-first, nunca em cache -> evita servir HTML
 *    com dados de sessão desatualizados ou de outro usuário.
 *  - Supabase: network-first -> nunca mostrar dados desatualizados no PDV/loja.
 *  - Assets estáticos da origem (JS/CSS/imagens/fontes próprias): cache-first.
 *  - Google Fonts: CSS stale-while-revalidate, arquivos de fonte cache-first.
 *  - Sem rede: fallback para /offline.html nas navegações.
 */
var VERSION = "passarelli-v1.0.1";
var CACHES = {
  core: VERSION + "-core",
  assets: VERSION + "-assets",
  api: VERSION + "-api",
  fonts: VERSION + "-fonts",
};
var OFFLINE_PATH = "/offline.html";

var SUPABASE_HOSTS = new Set(["sapxjmmbodqyryfmhied.supabase.co"]);

var PRECACHE_URLS = [
  "/offline.html",
  "/site.webmanifest",
  "/favicon.ico",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon-pdv-96.png",
  "/icons/icon-admin-96.png",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHES.core)
      .then(function (cache) {
        return Promise.all(
          PRECACHE_URLS.map(function (url) {
            return cache.add(url).catch(function () {
              /* ignora falha pontual de pré-cache */
            });
          }),
        );
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        var active = Object.keys(CACHES).map(function (k) {
          return CACHES[k];
        });
        return Promise.all(
          keys
            .filter(function (key) {
              return active.indexOf(key) === -1;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

function trimCache(cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    return cache.keys().then(function (keys) {
      if (keys.length <= max) return;
      return Promise.all(
        keys.slice(0, keys.length - max).map(function (key) {
          return cache.delete(key);
        }),
      );
    });
  });
}

function cacheFirst(request, cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    return cache.match(request, { ignoreSearch: false }).then(function (cached) {
      if (cached) return cached;
      return fetch(request).then(function (response) {
        if (response && (response.status === 200 || response.type === "opaque")) {
          cache.put(request, response.clone()).then(function () {
            if (max) return trimCache(cacheName, max);
          });
        }
        return response;
      });
    });
  });
}

function networkFirst(request, cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    return fetch(request)
      .then(function (response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone()).then(function () {
            if (max) return trimCache(cacheName, max);
          });
        }
        return response;
      })
      .catch(function () {
        return cache.match(request).then(function (cached) {
          if (cached) return cached;
          return caches.match(OFFLINE_PATH).then(function (offline) {
            return offline;
          });
        });
      });
  });
}

function staleWhileRevalidate(request, cacheName, max) {
  return caches.open(cacheName).then(function (cache) {
    var cachedPromise = cache.match(request);
    var networkPromise = fetch(request)
      .then(function (response) {
        if (response && response.status === 200) {
          cache.put(request, response.clone()).then(function () {
            if (max) return trimCache(cacheName, max);
          });
        }
        return response;
      })
      .catch(function () {
        return null;
      });
    return cachedPromise.then(function (cached) {
      if (cached) return cached;
      return networkPromise;
    });
  });
}

function navigationHandler(request) {
  return fetch(request).catch(function () {
    return caches.match(OFFLINE_PATH).then(function (offline) {
      if (offline) return offline;
      return new Response("Sem conexão com a internet.", {
        status: 503,
        statusText: "Offline",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    });
  });
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") return;
  if (request.headers.get("range") !== null) return; /* streaming de vídeo etc */

  var url = new URL(request.url);

  /* Supabase: sempre dados atualizados, com cache como reserva offline */
  if (SUPABASE_HOSTS.has(url.hostname)) {
    event.respondWith(networkFirst(request, CACHES.api, 200));
    return;
  }

  /* Navegação HTML: nunca servida do cache */
  if (request.mode === "navigate") {
    event.respondWith(navigationHandler(request));
    return;
  }

  /* Arquivos de fonte (conteudo com hash): cache-first */
  if (url.hostname === "fonts.gstatic.com") {
    event.respondWith(cacheFirst(request, CACHES.fonts, 60));
    return;
  }

  /* CSS do Google Fonts: stale-while-revalidate */
  if (url.hostname === "fonts.googleapis.com") {
    event.respondWith(staleWhileRevalidate(request, CACHES.fonts, 30));
    return;
  }

  /* Assets estaticos da propria origem: cache-first */
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, CACHES.assets, 200));
  }
});
