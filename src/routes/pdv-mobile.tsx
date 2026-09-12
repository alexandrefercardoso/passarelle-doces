"use client";

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS } from "@/lib/constants";
import { AdminDataProvider } from "@/hooks/use-admin-data";
import { AdminLoginForm } from "@/components/admin/login-form";
import { PdvMobilePage } from "@/components/admin/pdv-mobile";
import { InstallAppButton } from "@/components/install-app-button";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/pdv-mobile")({
  component: PdvMobileStandalone,
});

function PdvMobileStandalone() {
  const [user, setUser] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const res = await supabase.auth.getSession();
        if (!mounted) return;
        const email = res.data.session?.user?.email;
        setUser(email && ADMINS.includes(email) ? email : null);
      } catch {
        setUser(null);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-chocolate border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-8">
        <AdminLoginForm onSuccess={(email) => setUser(email)} />
        <Toaster position="top-right" richColors />
      </div>
    );
  }

  return (
    <AdminDataProvider>
      <div className="min-h-dvh bg-background p-4">
        <PdvMobilePage />
      </div>
      <InstallAppButton
        label="Instalar PDV"
        className="fixed right-3 z-40 items-center rounded-full border border-gold/40 bg-chocolate px-3 py-1.5 text-[11px] font-semibold text-cream shadow-xl shadow-black/40 backdrop-blur transition-colors hover:bg-chocolate-dark"
        style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 5.5rem)" }}
      />
      <Toaster position="top-right" richColors />
    </AdminDataProvider>
  );
}
