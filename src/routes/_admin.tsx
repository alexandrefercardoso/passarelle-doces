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
  Settings,
  Tags,
  Wrench,
  Loader2,
  Lock,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";
import { AdminDataProvider } from "@/hooks/use-admin-data";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS, DEFAULT_SETTINGS } from "@/lib/constants";
import { buildWhatsAppLink } from "@/lib/format";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: true },
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
            {!isAdmin ? <AdminLoginForm onSuccess={(email) => setUser({ email })} /> : <Outlet />}
          </main>
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </AdminDataProvider>
  );
}
