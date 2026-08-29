/** Converte um id de categoria (ex.: "cat-chocolates") em slug amigável. */
export function cleanCategorySlug(categoryId: string): string {
  return categoryId.toLowerCase().replace(/^cat-/, "").replace(/_/g, "-");
}

/** Atalho para montar mensagem de pedido no WhatsApp. */
export function cartWhatsAppMessage(itemNames: string[]): string {
  const lines = itemNames.map((n) => `• ${n}`);
  return `Olá! Quero fazer um pedido na PASSARELLI DOCES:${lines.length ? `\n${lines.join("\n")}` : ""}`;
}
