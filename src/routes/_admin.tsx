"use client";

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, createFileRoute } from "@tanstack/react-router";
import {
  BadgePercent,
  Home,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
  Tags,
  Wrench,
} from "lucide-react";
import { AdminDataProvider } from "@/hooks/use-admin-data";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS, DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin")({
  component: AdminLayout,
});

type AdminUser = { email: string };

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package },
  { to: "/admin/categorias", label: "Categorias", icon: Tags },
  { to: "/admin/banners", label: "Banners", icon: BadgePercent },
  { to: "/admin/pedidos", label: "Pedidos", icon: ReceiptText },
];

function AdminLayout() {
  const pathname = useLocation().href;
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const res = await supabase.auth.getSession();
        if (!mounted) return;
        const email = res.data.session?.user?.email;
        setUser(email && ADMINS.includes(email) ? { email } : null);
      } catch {
        setUser(null);
      }
    };
    void hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  const isAdmin = !!user;

  return (
    <AdminDataProvider>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-chocolate-dark text-cream lg:flex">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 border-b border-cream/10 px-6 py-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cream font-display text-xl font-black italic text-chocolate-dark">
              P
            </span>
            <div className="leading-none">
              <p className="font-display text-base font-black uppercase tracking-wide">
                Passarelli
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold">
                Painel Admin
              </p>
            </div>
          </Link>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-gold text-chocolate-dark shadow-sm"
                      : "text-cream/80 hover:bg-cream/10 hover:text-cream",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-cream/10 p-4">
            <a
              href={buildWhatsAppLink(DEFAULT_SETTINGS.whatsapp)}
              target="_blank"
              rel="noreferrer"
              className="mb-2 flex items-center gap-2 rounded-xl bg-[#25D366]/15 px-4 py-2.5 text-xs font-semibold text-[#6ee7a0] transition-colors hover:bg-[#25D366]/25"
            >
              Suporte Passarelli
            </a>
            <Link
              to="/"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-cream/80 transition-colors hover:bg-cream/10"
            >
              <Home className="h-4 w-4" />
              Ver a loja
            </Link>
            {isAdmin && (
              <button
                type="button"
                onClick={() => void supabase.auth.signOut()}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm text-cream/80 transition-colors hover:bg-cream/10"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>
            )}
          </div>
        </aside>

        {/* Conteúdo */}
        <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
          {/* Topbar mobile */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-chocolate font-display text-sm font-black italic text-gold">
                P
              </span>
              <span className="font-display text-sm font-black uppercase tracking-wide text-chocolate-dark">
                Painel Admin
              </span>
            </Link>
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-chocolate-dark"
            >
              <Home className="h-4 w-4" /> Loja
            </Link>
          </header>

          {/* Nav mobile */}
          <nav className="no-scrollbar flex gap-1 overflow-x-auto border-b border-border bg-background px-3 py-2 lg:hidden">
            {navItems.map((item) => {
              const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to as never}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "bg-chocolate text-cream"
                      : "border border-border text-muted-foreground",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {!isAdmin && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-gold/40 bg-gold-soft/50 p-4 text-sm">
                <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-gold-dark" aria-hidden />
                <div>
                  <p className="font-semibold text-chocolate-dark">Faça login como administrador</p>
                  <p className="mt-0.5 text-chocolate-dark/70">
                    Para editar produtos, categorias, banners e pedidos, acesse{" "}
                    <span className="font-medium">/conta</span> com um e-mail administrador
                    cadastrado no banco.
                  </p>
                </div>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </AdminDataProvider>
  );
}
