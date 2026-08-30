"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, LogOut, Package, ShoppingBag, Sparkles, UserRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_store/conta")({
  component: AccountPage,
  head: () => ({
    meta: [{ title: "Minha Conta — Passarelli Doces" }],
  }),
});

function AccountPage() {
  const [user, setUser] = useState<null | { email: string; name: string }>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const hydrate = async () => {
      try {
        const res = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(
          res.data.session?.user
            ? {
                email: res.data.session.user.email ?? "",
                name:
                  (res.data.session.user.user_metadata?.["name"] as string) ??
                  res.data.session.user.email?.split("@")[0] ??
                  "Cliente",
              }
            : null,
        );
      } catch {
        // Sem conexão com o banco: trata como deslogado.
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void hydrate();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const nextUser = session?.user
        ? {
            email: session.user.email ?? "",
            name:
              (session.user.user_metadata?.["name"] as string) ??
              session.user.email?.split("@")[0] ??
              "Cliente",
          }
        : null;
      setUser(nextUser);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="h-96 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
      {user ? (
        <AccountDashboard user={user} onLogout={() => setUser(null)} />
      ) : (
        <AuthForm setUser={setUser} />
      )}
    </div>
  );
}

function AccountDashboard({
  user,
  onLogout,
}: {
  user: { email: string; name: string };
  onLogout: () => void;
}) {
  const logout = async () => {
    await supabase.auth.signOut().catch(() => void 0);
    onLogout();
    toast("Você saiu da sua conta", {
      description: "Até logo! Não esqueça dos doces. 🍬",
    });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-card">
      <div className="bg-gradient-to-br from-chocolate to-chocolate-dark p-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">Área do cliente</p>
        <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold capitalize text-cream">
          <UserRound className="h-6 w-6 text-gold" /> {user.name}
        </h1>
        <p className="mt-1 text-sm text-cream/80">{user.email}</p>
      </div>

      <div className="p-5">
        <p className="text-sm text-muted-foreground">
          Bom te ver por aqui! Continue onde parou e aproveite todas as suas doçuras favoritas.
        </p>

        <nav className="mt-5 grid gap-2">
          <AccountLink to="/pedidos" icon={<Package className="h-4 w-4" />}>
            Meus Pedidos
          </AccountLink>
          <AccountLink to="/favoritos" icon={<Heart className="h-4 w-4" />}>
            Meus Favoritos
          </AccountLink>
          <AccountLink to="/carrinho" icon={<ShoppingBag className="h-4 w-4" />}>
            Meu Carrinho
          </AccountLink>
        </nav>

        <Button variant="outline" className="mt-5 w-full rounded-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}

function AccountLink({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to as never}
      className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-gold hover:bg-gold-soft/40"
    >
      <span className="text-gold-dark">{icon}</span>
      {children}
    </Link>
  );
}

function AuthForm({ setUser }: { setUser: (u: { email: string; name: string }) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          toast.success("Conta criada!", {
            description: "Verifique seu e-mail para confirmar o cadastro.",
          });
          return;
        }
        setUser({
          email,
          name: name || (email.split("@")[0] ?? "Cliente"),
        });
        toast.success("Bem-vindo(a) à Passarelli Doces! 🍬");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (!data.user) throw new Error("Falha no login");
        setUser({
          email: data.user.email ?? email,
          name: (data.user.user_metadata?.["name"] as string) ?? email.split("@")[0] ?? "Cliente",
        });
        toast.success("Login realizado com sucesso!");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível continuar.";
      toast.error("Ops!", { description: message });
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) throw error;
      toast.success("Link enviado!", {
        description: `Verifique sua caixa de entrada em ${email}.`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar o link.";
      toast.error("Ops!", { description: message });
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-gold-dark" />
        <h1 className="font-display text-2xl font-extrabold text-foreground">
          {mode === "login" ? "Entrar na minha conta" : "Criar minha conta"}
        </h1>
      </div>

      <div className="mt-5 flex rounded-full bg-cream p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
              mode === m
                ? "bg-chocolate text-cream shadow-sm"
                : "text-muted-foreground hover:text-chocolate-dark"
            }`}
          >
            {m === "login" ? "Entrar" : "Criar conta"}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Senha</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="h-11 rounded-xl border border-border px-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
          />
        </div>

        {mode === "login" && (
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
        )}

        <Button
          type="submit"
          disabled={busy || password.length < 6}
          className="h-11 w-full rounded-full text-base font-semibold"
        >
          {busy ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" /> Aguarde...
            </>
          ) : mode === "login" ? (
            "Entrar"
          ) : (
            "Criar conta"
          )}
        </Button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        A criação de conta permite acompanhar pedidos e sincronizar favoritos.
      </p>
    </div>
  );
}
