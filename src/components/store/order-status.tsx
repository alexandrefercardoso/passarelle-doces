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
  const labels: Record<string, string> = {
    pix: "PIX",
    cartao: "Cartão de crédito",
    cartao_debito: "Cartão de débito",
    boleto: "Boleto bancário",
    dinheiro: "Dinheiro",
    cheque: "Cheque",
    caderneta: "Caderneta",
  };
  return labels[method] ?? method;
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
