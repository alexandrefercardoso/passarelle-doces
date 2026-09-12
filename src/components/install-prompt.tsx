import { useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";

import { registerServiceWorker } from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_SESSION_KEY = "pwa-install-dismissed";
const INSTALLED_STORAGE_KEY = "pwa-installed";

let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
  });
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  if ((navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  return false;
}

function hasDismissedThisSession(): boolean {
  try {
    return sessionStorage.getItem(DISMISS_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function markDismissed(): void {
  try {
    sessionStorage.setItem(DISMISS_SESSION_KEY, "1");
  } catch {
    /* storage indisponível — apenas não persiste */
  }
}

export function InstallPrompt() {
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [isIosGuide, setIsIosGuide] = useState(false);
  const [installable, setInstallable] = useState(false);

  const isPdv = location.pathname === "/pdv-mobile";

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (isStandalone() || hasDismissedThisSession()) return;

    if (isIos()) {
      setIsIosGuide(true);
      setInstallable(true);
      setVisible(true);
      return;
    }

    if (deferredPrompt) {
      setInstallable(true);
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      setVisible(false);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  if (!visible || !installable) return null;

  const handleInstall = async () => {
    const prompt = deferredPrompt;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      deferredPrompt = null;
      if (choice.outcome === "accepted") {
        setVisible(false);
        try {
          localStorage.setItem(INSTALLED_STORAGE_KEY, "1");
        } catch {
          /* ignore */
        }
      } else {
        markDismissed();
        setVisible(false);
      }
      return;
    }

    if (isIosGuide) {
      markDismissed();
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    markDismissed();
    setVisible(false);
  };

  const title = isPdv
    ? "Instalar PDV na tela inicial"
    : isIosGuide
      ? "Instale o app no seu iPhone/iPad"
      : "Instalar app";
  const description = isPdv
    ? "Rápido acesso do caixa com internet mais estável e abertura direto no PDV Mobile."
    : isIosGuide
      ? 'Toque em Compartilhar e escolha "Adicionar à Tela de Início" para instalar a Passarelli Doces.'
      : "Acesse a loja em tela cheia, direto da tela inicial do seu celular.";

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-md rounded-2xl border border-gold/40 bg-chocolate p-4 shadow-2xl shadow-black/40">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chocolate-dark ring-1 ring-gold/50">
            <span className="font-display text-xl font-black italic text-gold">P</span>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-tight text-cream">{title}</p>
            <p className="mt-0.5 text-xs leading-snug text-cream/70">{description}</p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Fechar aviso de instalação"
            className="shrink-0 rounded-full p-1 text-cream/50 transition-colors hover:bg-chocolate-dark hover:text-cream"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
        <button
          type="button"
          onClick={handleInstall}
          className="mt-3 w-full rounded-full bg-gradient-to-b from-gold-soft to-gold px-4 py-2.5 text-sm font-bold text-chocolate transition hover:brightness-105 active:scale-[0.99]"
        >
          {isPdv ? "Instalar PDV na tela inicial" : "Instalar app"}
        </button>
      </div>
    </div>
  );
}
