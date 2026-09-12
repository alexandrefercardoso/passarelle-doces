import { useState, type CSSProperties } from "react";
import { Download } from "lucide-react";

import { cn } from "@/lib/utils";
import { usePwaInstall } from "@/hooks/use-pwa-install";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InstallStepsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const pwa = usePwaInstall();
  const steps = pwa.isIos
    ? [
        "Abra o Safari e toque no botão Compartilhar (quadrado com seta para cima).",
        'Role a lista e toque em "Adicionar à Tela de Início".',
        'Toque em "Adicionar" e abra o ícone na tela inicial.',
      ]
    : [
        "No navegador, abra o menu ⋮ (ou o ícone de instalar na barra de endereço).",
        'Toque em "Instalar app" ou "Adicionar à tela inicial".',
        "Confirme e abra o ícone na tela inicial.",
      ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-chocolate ring-1 ring-gold/50">
              <span className="font-display text-xl font-black italic text-gold">P</span>
            </span>
            <DialogTitle className="font-display text-lg font-black text-chocolate-dark">
              Instalar o app da Passarelli
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Passos para adicionar a Passarelli Doces à tela inicial:
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-2">
          {steps.map((step, index) => (
            <li key={step} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-chocolate-dark">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="rounded-xl bg-gold-soft px-3 py-2.5 text-xs leading-relaxed text-chocolate-dark">
          Depois de instalar, toque e segure o ícone do app para ver os atalhos{" "}
          <strong>PDV Mobile</strong> e <strong>Admin</strong> sem precisar digitar o endereço.
        </p>

        {pwa.canPrompt && (
          <button
            type="button"
            onClick={async () => {
              const ok = await pwa.install();
              if (ok) onOpenChange(false);
            }}
            className="rounded-full bg-gradient-to-b from-gold to-gold-dark px-4 py-2.5 text-sm font-bold text-chocolate-dark transition hover:brightness-105"
          >
            Instalar app agora
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function InstallAppButton({
  label = "Instalar app",
  icon = true,
  className,
  style,
}: {
  label?: string;
  icon?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const pwa = usePwaInstall();
  const [open, setOpen] = useState(false);

  if (pwa.installed) return null;

  const handleClick = async () => {
    if (pwa.canPrompt) {
      const ok = await pwa.install();
      if (!ok) setOpen(true);
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={cn("flex items-center gap-2.5", className)}
        style={style}
      >
        {icon && <Download className="h-4 w-4" />}
        <span>{label}</span>
      </button>
      <InstallStepsDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
