"use client";

import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS } from "@/lib/constants";
import { AdminDataProvider } from "@/hooks/use-admin-data";
import { AdminLoginForm } from "@/components/admin/login-form";
import { PdvMobilePage } from "@/components/admin/pdv-mobile";
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
      <Toaster position="top-right" richColors />
    </AdminDataProvider>
  );
}
