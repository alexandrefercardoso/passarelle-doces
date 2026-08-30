"use client";

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Loader2, Lock, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/redefinir-senha")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: "Redefinir senha — Passarelli Doces" }],
  }),
});

type Stage = "processing" | "form" | "done" | "error";

function extractCodeFromUrl(): {
  code?: string;
  tokenHash?: string;
  error?: string;
} {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);

  const errorDescription = query.get("error_description") ?? hash.get("error_description");
  if (errorDescription) return { error: errorDescription };

  const code = query.get("code") ?? hash.get("code");
  if (code) return { code };

  const tokenHash = query.get("token_hash") ?? hash.get("token_hash");
  const type = query.get("type") ?? hash.get("type");
  if (tokenHash && type === "recovery") return { tokenHash };

  return {};
}

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>("processing");
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      const { code, tokenHash, error: urlError } = extractCodeFromUrl();
      if (urlError) {
        setError(urlError);
        setStage("error");
        return;
      }

      if (tokenHash) {
        // Fluxo legacy com token_hash: verifica o OTP de recuperação.
        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (!mounted) return;
        if (verifyError) {
          setError(verifyError.message);
          setStage("error");
          return;
        }
        setStage("form");
        return;
      }

      if (code) {
        // Fluxo PKCE: troca o code por uma sessão.
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!mounted) return;
        if (exchangeError) {
          setError(exchangeError.message);
          setStage("error");
          return;
        }
        setStage("form");
        try {
          const url = new URL(window.location.href);
          url.search = "";
          url.hash = "";
          window.history.replaceState({}, "", url.toString());
        } catch {
          // Ignora falha ao limpar a URL.
        }
        return;
      }

      // Sem code na URL: confia na sessão de recuperação (fluxo PASSWORD_RECOVERY).
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (data.session) {
        setStage("form");
      } else {
        setError(
          "Nenhuma sessão de recuperação de senha encontrada. Solicite um novo link e tente novamente.",
        );
        setStage("error");
      }
    };

    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Senha muito curta", {
        description: "A senha precisa ter pelo menos 6 caracteres.",
      });
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem", { description: "Confira os dois campos de senha." });
      return;
    }
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      await supabase.auth.signOut().catch(() => void 0);
      setStage("done");
      toast.success("Senha redefinida com sucesso!", {
        description: "Agora você pode entrar com a nova senha.",
      });
    } catch (err) {
      setBusy(false);
      const message = err instanceof Error ? err.message : "Não foi possível redefinir a senha.";
      toast.error("Ops!", { description: message });
    }
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8">
          {stage === "processing" && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-gold-dark" />
              <p className="font-display text-lg font-extrabold text-foreground">
                Processando seu link de recuperação...
              </p>
              <p className="text-sm text-muted-foreground">Aguarde um instante.</p>
            </div>
          )}

          {stage === "form" && (
            <>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-gold-dark" />
                <h1 className="font-display text-2xl font-extrabold text-foreground">
                  Definir nova senha
                </h1>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Escolha uma nova senha para sua conta. Use pelo menos 6 caracteres.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="h-11 w-full rounded-xl border border-border pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Confirmar nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="h-11 w-full rounded-xl border border-border pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/30"
                      disabled={busy}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || password.length < 6 || confirm.length < 6}
                  className="h-11 w-full rounded-full text-base font-semibold bg-chocolate text-cream hover:bg-chocolate-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> Salvando...
                    </>
                  ) : (
                    "Salvar nova senha"
                  )}
                </button>
              </form>
            </>
          )}

          {stage === "done" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                Senha redefinida!
              </h1>
              <p className="text-sm text-muted-foreground">
                Sua senha foi alterada com sucesso. Agora você pode entrar no painel com a nova
                senha.
              </p>
              <Link
                to="/admin"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-chocolate font-semibold text-cream transition-colors hover:bg-chocolate-dark"
              >
                Ir para o painel
              </Link>
            </div>
          )}

          {stage === "error" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <ShieldAlert className="h-12 w-12 text-red-500" />
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                Link inválido ou expirado
              </h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Link
                to="/admin"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-chocolate font-semibold text-cream transition-colors hover:bg-chocolate-dark"
              >
                Voltar ao painel
              </Link>
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-right" richColors />
    </>
  );
}
