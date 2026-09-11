"use client";

import { useState } from "react";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ADMINS } from "@/lib/constants";
import { toast } from "sonner";

export function AdminLoginForm({ onSuccess }: { onSuccess: (email: string) => void }) {
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
