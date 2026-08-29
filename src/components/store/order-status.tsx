export const statusLabel: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmado: "Pagamento confirmado",
  preparando: "Em preparo",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function statusColorClass(status: string): string {
  switch (status) {
    case "cancelado":
      return "bg-destructive/10 text-destructive";
    case "entregue":
      return "bg-chocolate/10 text-chocolate";
    case "enviado":
      return "bg-gold-soft text-gold-dark";
    case "preparando":
      return "bg-blush text-rose";
    case "confirmado":
      return "bg-cream text-chocolate-dark";
    default:
      return "bg-gold-soft text-gold-dark";
  }
}

export function paymentLabel(method: string): string {
  switch (method) {
    case "pix":
      return "PIX";
    case "cartao":
      return "Cartão de crédito";
    case "boleto":
      return "Boleto bancário";
    default:
      return method;
  }
}

export function statusPaymentLabel(status: string): string {
  switch (status) {
    case "aprovado":
      return "Aprovado";
    case "recusado":
      return "Recusado";
    case "cancelado":
      return "Cancelado";
    default:
      return "Pendente";
  }
}
