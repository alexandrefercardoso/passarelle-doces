"use client";

import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, createFileRoute } from "@tanstack/react-router";
import {
  BadgePercent,
  BarChart3,
  Candy,
  DollarSign,
  Home,
  Instagram,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Tags,
  Users,
} from "lucide-react";
import { AdminDataProvider } from "@/hooks/use-admin-data";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AdminLoginForm } from "@/components/admin/login-form";
import { InstallAppButton } from "@/components/install-app-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin")({
  head: () => ({
    links: [{ rel: "manifest", href: "/admin.webmanifest" }],
  }),
  component: AdminLayout,
});

type AdminUser = { email: string };

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    title: "Visão geral",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "Catálogo",
    items: [
      { to: "/admin/produtos", label: "Produtos", icon: Package },
      { to: "/admin/categorias", label: "Categorias", icon: Tags },
    ],
  },
  {
    title: "Conteúdo",
    items: [
      { to: "/admin/banners", label: "Banners", icon: BadgePercent },
      { to: "/admin/instagram-posts", label: "Instagram", icon: Instagram },
    ],
  },
  {
    title: "Vendas",
    items: [
      { to: "/admin/pdv", label: "PDV", icon: ShoppingCart },
      { to: "/admin/pdv-mobile", label: "PDV Mobile", icon: Smartphone },
      { to: "/admin/pedidos", label: "Pedidos", icon: ReceiptText },
      { to: "/admin/clientes", label: "Clientes", icon: Users },
      { to: "/admin/financeiro", label: "Financeiro", icon: DollarSign },
      { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
    ],
  },
  {
    title: "Preferências",
    items: [{ to: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: true }],
  },
];

function SidebarNav({
  isAdmin,
  onNavigate,
  onLogout,
}: {
  isAdmin: boolean;
  onNavigate?: () => void;
  onLogout?: () => void;
}) {
  const pathname = useLocation().href;

  return (
    <div className="relative flex h-full flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gold/10 to-transparent" />
      <div className="pointer-events-none absolute -right-16 top-24 h-40 w-40 rounded-full bg-gold/5 blur-2xl" />

      <div className="relative shrink-0 border-b border-cream/10 px-6 py-6">
        <Link to="/admin" onClick={onNavigate} className="group flex items-center gap-3">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-gold-dark font-display text-2xl font-black italic text-chocolate-dark shadow-lg shadow-gold/20 transition-transform group-hover:scale-105">
            P
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] text-[8px] text-white shadow">
              <Sparkles className="h-2 w-2" />
            </span>
          </span>
          <div className="leading-none">
            <p className="font-display text-lg font-black uppercase tracking-wide">Passarelli</p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
              Painel Admin
            </p>
          </div>
        </Link>
      </div>

      <nav className="relative min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-5">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1.5 flex items-center gap-2 px-3 text-[10px] font-bold uppercase tracking-[0.25em] text-cream/40">
              <span className="h-px flex-1 bg-cream/10" />
              {group.title}
              <span className="h-px flex-1 bg-cream/10" />
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to as never}
                    onClick={onNavigate}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                      active
                        ? "bg-gradient-to-r from-gold to-gold-dark text-chocolate-dark shadow-md shadow-gold/10"
                        : "text-cream/70 hover:bg-cream/[0.07] hover:text-cream",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gold-dark" />
                    )}
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                        active ? "bg-chocolate-dark/15" : "bg-cream/[0.06] group-hover:bg-gold/10",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="relative shrink-0 border-t border-cream/10 p-4">
        <div className="mb-3 overflow-hidden rounded-2xl bg-gradient-to-br from-chocolate to-chocolate-dark p-3 ring-1 ring-gold/20">
          <div className="flex items-center gap-2 text-gold">
            <Candy className="h-4 w-4" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Loja aberta</p>
          </div>
          <p className="mt-1.5 text-xs text-cream/70">
            Gerencie suas criações e fascine seus clientes.{" "}
            <span className="text-gold">Bom apetite! 🍰</span>
          </p>
        </div>

        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-cream/80 transition-colors hover:bg-cream/10"
        >
          <Home className="h-4 w-4" />
          Ver a loja
        </Link>

        <InstallAppButton
          label="Instalar app"
          className="w-full items-center rounded-xl bg-cream/[0.06] px-4 py-2.5 text-sm text-cream/80 transition-colors hover:bg-gold/10 hover:text-gold"
        />

        {isAdmin && (
          <button
            type="button"
            onClick={() => onLogout?.()}
            className="flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm text-cream/80 transition-colors hover:bg-cream/10"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        )}
      </div>
    </div>
  );
}

function AdminLayout() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleLogout = () => {
    void supabase.auth.signOut().then(() => {
      setUser(null);
      setMenuOpen(false);
    });
  };

  return (
    <AdminDataProvider>
      <div className="flex min-h-dvh">
        {/* Sidebar desktop */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-chocolate-dark/60 bg-chocolate-dark text-cream lg:flex">
          <SidebarNav isAdmin={isAdmin} onLogout={handleLogout} />
        </aside>

        {/* Conteúdo */}
        <div className="flex min-h-dvh flex-1 flex-col lg:pl-72">
          {/* Topbar */}
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:justify-end lg:px-8">
            <div className="flex items-center gap-2 lg:hidden">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="Abrir menu"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card text-chocolate-dark shadow-sm transition-colors hover:border-gold hover:text-gold-dark"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[82%] max-w-[300px] border-chocolate-dark/60 bg-chocolate-dark p-0 text-cream sm:w-72"
                >
                  <SidebarNav
                    isAdmin={isAdmin}
                    onNavigate={() => setMenuOpen(false)}
                    onLogout={handleLogout}
                  />
                </SheetContent>
              </Sheet>
              <Link to="/admin" className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-chocolate font-display text-sm font-black italic text-gold">
                  P
                </span>
                <span className="font-display text-sm font-black uppercase tracking-wide text-chocolate-dark">
                  Painel
                </span>
              </Link>
            </div>

            <Link
              to="/"
              className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-chocolate-dark lg:ml-0"
            >
              <Home className="h-4 w-4" /> Loja
            </Link>
          </header>

          <main className="min-h-0 flex-1 p-4 sm:p-6 lg:p-8">
            {!isAdmin ? <AdminLoginForm onSuccess={(email) => setUser({ email })} /> : <Outlet />}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </AdminDataProvider>
  );
}
