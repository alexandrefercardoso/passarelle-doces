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
  Sparkles,
  Tags,
  Users,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminDataProvider } from "@/hooks/use-admin-data";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS } from "@/lib/constants";
import { Toaster } from "@/components/ui/sonner";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_admin")({
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

function AdminLoginForm({ onSuccess }: { onSuccess: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const [sendingReset, setSendingReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.user) throw new Error("Falha no login");
      const userEmail = data.user.email ?? email;
      if (!ADMINS.includes(userEmail)) {
        await supabase.auth.signOut();
        throw new Error("Este e-mail não tem permissão de administrador");
      }
      onSuccess(userEmail);
      toast.success("Login de administrador realizado!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao fazer login";
      toast.error("Ops!", { description: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.error("Informe seu e-mail", {
        description: "Preencha o campo de e-mail para receber o link de redefinição.",
      });
      return;
    }
    setSendingReset(true);
    try {
      const redirectTo = `${window.location.origin}/redefinir-senha`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      if (error) throw error;
      toast.success("Link enviado!", {
        description: `Verifique sua caixa de entrada em ${email}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Não foi possível enviar o link";
      toast.error("Ops!", { description: msg });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <Lock className="h-5 w-5 text-gold-dark" />
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          Acesso ao Painel Admin
        </h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Entre com seu e-mail de administrador para gerenciar a loja.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alejandrecardoso@gmail.com"
              className="h-11 w-full rounded-xl border border-border pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              disabled={busy}
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Senha</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11 w-full rounded-xl border border-border pl-10 pr-12 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => void handleForgot()}
            disabled={sendingReset}
            className="text-xs font-semibold text-gold-dark hover:text-chocolate-dark disabled:opacity-60"
          >
            {sendingReset ? "Enviando link..." : "Esqueci minha senha"}
          </button>
        </div>

        <button
          type="submit"
          disabled={busy || password.length < 6}
          className="h-11 w-full rounded-full text-base font-semibold bg-chocolate text-cream hover:bg-chocolate-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Entrando...
            </>
          ) : (
            "Entrar no painel"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Apenas e-mails cadastrados como administradores podem acessar.
      </p>
    </div>
  );
}

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
      <div className="flex min-h-screen">
        {/* Sidebar desktop */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-chocolate-dark/60 bg-chocolate-dark text-cream lg:flex">
          <SidebarNav isAdmin={isAdmin} onLogout={handleLogout} />
        </aside>

        {/* Conteúdo */}
        <div className="flex min-h-screen flex-1 flex-col lg:pl-72">
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

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {!isAdmin ? <AdminLoginForm onSuccess={(email) => setUser({ email })} /> : <Outlet />}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </AdminDataProvider>
  );
}
