let registered = false;

export function registerServiceWorker(): void {
  if (registered || !("serviceWorker" in navigator)) return;

  const onLoad = () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        registered = true;
        console.debug("Service worker registrado", reg.scope);
      })
      .catch((err) => {
        console.warn("Falha ao registrar o service worker", err);
      });
  };

  if (document.readyState === "complete") {
    onLoad();
  } else {
    window.addEventListener("load", onLoad);
  }
}
