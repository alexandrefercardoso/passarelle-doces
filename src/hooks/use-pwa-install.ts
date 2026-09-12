import { useCallback, useEffect, useMemo, useState } from "react";

import { registerServiceWorker } from "@/lib/pwa";

/*
 * Dependência de manifest por rota:
 *  - / (loja)            -> <link rel="manifest" href="/site.webmanifest">   (head em _store.tsx)
 *  - /pdv-mobile (PDV)   -> <link rel="manifest" href="/pdv.webmanifest">    (head em pdv-mobile.tsx)
 *  - /admin (admin)      -> <link rel="manifest" href="/admin.webmanifest">  (head em _admin.tsx)
 * O navegador usa o manifest ativo da rota atual para o beforeinstallprompt.
 * Este hook é agnóstico: ele apenas reage ao evento que o navegador dispara
 * com base no manifest vigente. Se uma rota não declarar manifest, o Chrome
 * simplesmente não oferece instalação ali — não corrigir acessando manifest por
 * aqui; declarar no head() da rota.
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export const DISMISS_SESSION_KEY = "pwa-install-dismissed";
export const INSTALLED_STORAGE_KEY = "pwa-installed";

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function isIosDevice(): boolean {
  try {
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}

export function isStandaloneMode(): boolean {
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  } catch {
    /* matchMedia indisponível */
  }
  return false;
}

export function usePwaInstall() {
  const [promptAvailable, setPromptAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    setPromptAvailable(deferredPrompt !== null);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferredPrompt = event as BeforeInstallPromptEvent;
      setPromptAvailable(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    try {
      setDismissed(sessionStorage.getItem(DISMISS_SESSION_KEY) === "1");
    } catch {
      /* ignore */
    }

    if (isStandaloneMode()) setInstalled(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
    setDismissed(true);
  }, []);

  const install = useCallback(async () => {
    const promptEvent = deferredPrompt;
    if (!promptEvent) return false;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    deferredPrompt = null;
    setPromptAvailable(false);
    if (choice.outcome === "accepted") {
      setInstalled(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      return true;
    }
    return false;
  }, []);

  const value = useMemo(
    () => ({
      canPrompt: promptAvailable,
      installed,
      dismissed,
      canInstall: promptAvailable && !installed && !dismissed,
      isIos: isIosDevice(),
      dismiss,
      install,
    }),
    [promptAvailable, installed, dismissed, dismiss, install],
  );

  return value;
}
