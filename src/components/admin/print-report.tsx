import { formatCurrency } from "@/lib/format";
import type { Order } from "@/lib/types";

const PAYMENT_LABEL: Record<string, string> = {
  credit: "Crédito",
  debit: "Débito",
  pix: "Pix",
  money: "Dinheiro",
  boleto: "Boleto",
};

const STATUS_LABEL: Record<string, string> = {
  aguardando_pagamento: "Aguardando",
  confirmado: "Confirmado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

type ReportOptions = {
  title: string;
  subtitle: string;
  orders: Order[];
  format: "a4" | "cupom";
};

function buildA4HTML(opts: ReportOptions): string {
  const { title, subtitle, orders } = opts;
  const total = orders.reduce((a, o) => a + o.total, 0);
  const pdv = orders.filter((o) => o.source === "pdv");
  const site = orders.filter((o) => o.source === "site");

  const rows = orders
    .map(
      (o) => `
      <tr>
        <td>${o.id.slice(0, 18)}</td>
        <td>${o.createdAt.slice(0, 10).split("-").reverse().join("/")}</td>
        <td>${o.source === "pdv" ? "PDV" : "Site"}</td>
        <td>${o.customer.name}</td>
        <td>${o.customer.phone ?? "-"}</td>
        <td>${o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</td>
        <td class="right">${formatCurrency(o.total)}</td>
        <td>${STATUS_LABEL[o.status] ?? o.status}</td>
        <td>${PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</td>
      </tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9pt; color: #1a1a1a; }
  .header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #3c2415; padding-bottom: 8px; margin-bottom: 12px; }
  .header h1 { font-size: 16pt; color: #3c2415; }
  .header p { font-size: 9pt; color: #666; }
  .summary { display: flex; gap: 24px; margin-bottom: 14px; }
  .summary .box { border: 1px solid #ddd; border-radius: 6px; padding: 8px 14px; }
  .summary .box .label { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.08em; color: #888; }
  .summary .box .value { font-size: 13pt; font-weight: bold; color: #3c2415; }
  .summary .box .hint { font-size: 7pt; color: #999; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #3c2415; color: #fff; font-size: 7.5pt; text-transform: uppercase; letter-spacing: 0.06em; padding: 5px 6px; text-align: left; }
  td { padding: 4px 6px; border-bottom: 1px solid #eee; font-size: 8.5pt; }
  tr:nth-child(even) td { background: #faf7f4; }
  .right { text-align: right; }
  .footer { margin-top: 14px; text-align: center; font-size: 7pt; color: #aaa; border-top: 1px solid #ddd; padding-top: 6px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${title}</h1>
      <p>${subtitle}</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:8pt;color:#999">Emitido em: ${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}</p>
    </div>
  </div>

  <div class="summary">
    <div class="box">
      <div class="label">Total de pedidos</div>
      <div class="value">${orders.length}</div>
      <div class="hint">${pdv.length} PDV · ${site.length} Site</div>
    </div>
    <div class="box">
      <div class="label">Receita total</div>
      <div class="value">${formatCurrency(total)}</div>
    </div>
    <div class="box">
      <div class="label">Ticket médio</div>
      <div class="value">${orders.length > 0 ? formatCurrency(total / orders.length) : formatCurrency(0)}</div>
    </div>
    <div class="box">
      <div class="label">Receita PDV</div>
      <div class="value">${formatCurrency(pdv.reduce((a, o) => a + o.total, 0))}</div>
    </div>
    <div class="box">
      <div class="label">Receita Site</div>
      <div class="value">${formatCurrency(site.reduce((a, o) => a + o.total, 0))}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Pedido</th>
        <th>Data</th>
        <th>Origem</th>
        <th>Cliente</th>
        <th>Telefone</th>
        <th>Itens</th>
        <th class="right">Total</th>
        <th>Status</th>
        <th>Pagamento</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    Passarelli Doces — Relatório gerado automaticamente
  </div>
</body>
</html>`;
}

function buildCupomHTML(opts: ReportOptions): string {
  const { title, subtitle, orders } = opts;
  const total = orders.reduce((a, o) => a + o.total, 0);
  const pdv = orders.filter((o) => o.source === "pdv");
  const site = orders.filter((o) => o.source === "site");

  const lines = orders
    .map(
      (o) => `
      <tr>
        <td>${o.createdAt.slice(8, 10)}/${o.createdAt.slice(5, 7)}</td>
        <td>${o.source === "pdv" ? "PDV" : "Site"}</td>
        <td class="ellipsis">${o.customer.name.slice(0, 18)}</td>
        <td class="r">${formatCurrency(o.total)}</td>
      </tr>`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: 80mm auto; margin: 2mm 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 9pt;
    color: #000;
    width: 72mm;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .double-line { border-top: 2px solid #000; margin: 4px 0; }
  h1 { font-size: 11pt; text-align: center; margin-bottom: 2px; }
  .sub { font-size: 7pt; text-align: center; color: #555; margin-bottom: 4px; }
  .meta { font-size: 7pt; color: #888; text-align: center; margin-bottom: 4px; }
  .summary-box { margin: 4px 0; }
  .summary-row { display: flex; justify-content: space-between; font-size: 8pt; padding: 1px 0; }
  .summary-row.total { font-size: 10pt; font-weight: bold; border-top: 1px dashed #000; padding-top: 3px; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { font-size: 7pt; text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
  td { font-size: 8pt; padding: 2px 0; border-bottom: 1px dotted #ccc; }
  .r { text-align: right; }
  .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 28mm; }
  .footer { margin-top: 6px; text-align: center; font-size: 7pt; color: #888; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>PASSARELLI DOCES</h1>
  <div class="sub">${title}</div>
  <div class="sub">${subtitle}</div>
  <div class="meta">${new Date().toLocaleDateString("pt-BR")} ${new Date().toLocaleTimeString("pt-BR")}</div>

  <div class="line"></div>

  <div class="summary-box">
    <div class="summary-row"><span>Total de pedidos:</span><span class="bold">${orders.length}</span></div>
    <div class="summary-row"><span>Pedidos PDV:</span><span>${pdv.length}</span></div>
    <div class="summary-row"><span>Pedidos Site:</span><span>${site.length}</span></div>
    <div class="summary-row"><span>Ticket médio:</span><span>${orders.length > 0 ? formatCurrency(total / orders.length) : formatCurrency(0)}</span></div>
    <div class="summary-row total"><span>RECEITA TOTAL:</span><span>${formatCurrency(total)}</span></div>
  </div>

  <div class="double-line"></div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Orig.</th>
        <th>Cliente</th>
        <th class="r">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${lines}
    </tbody>
  </table>

  <div class="double-line"></div>
  <div class="footer">Obrigado pela preferência!</div>
</body>
</html>`;
}

export function printReport(opts: ReportOptions) {
  const html = opts.format === "a4" ? buildA4HTML(opts) : buildCupomHTML(opts);
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) {
    window.alert("Permita pop-ups para imprimir o relatório.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

const PAYMENT_LABEL_FULL: Record<string, string> = {
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  pix: "Pix",
  money: "Dinheiro",
  boleto: "Boleto",
};

const STATUS_LABEL_FULL: Record<string, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  confirmado: "Pagamento confirmado",
  preparando: "Em preparo",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export function printOrderReceipt(order: Order) {
  const items = order.items
    .map(
      (i) => `
      <tr>
        <td class="r">${i.quantity}×</td>
        <td>${i.name}</td>
        <td class="r">${formatCurrency(i.unitPrice * i.quantity)}</td>
      </tr>`,
    )
    .join("\n");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Pedido ${order.id}</title>
<style>
  @page { size: 80mm auto; margin: 2mm 4mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 9pt;
    color: #000;
    width: 72mm;
  }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .line { border-top: 1px dashed #000; margin: 4px 0; }
  .double-line { border-top: 2px solid #000; margin: 6px 0; }
  h1 { font-size: 11pt; text-align: center; margin-bottom: 1px; }
  .sub { font-size: 7pt; text-align: center; color: #555; margin-bottom: 4px; }
  .order-id { font-size: 10pt; font-weight: bold; text-align: center; margin: 4px 0; }
  .info-block { margin: 4px 0; font-size: 8pt; }
  .info-row { display: flex; justify-content: space-between; padding: 1px 0; }
  .info-label { color: #666; }
  .info-value { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 4px; }
  th { font-size: 7pt; text-align: left; border-bottom: 1px solid #000; padding: 2px 0; }
  td { font-size: 8pt; padding: 2px 0; border-bottom: 1px dotted #ccc; }
  .r { text-align: right; }
  .total-row { font-size: 10pt; font-weight: bold; border-top: 2px solid #000; padding-top: 4px; margin-top: 4px; display: flex; justify-content: space-between; }
  .footer { margin-top: 6px; text-align: center; font-size: 7pt; color: #888; }
  .status-badge { display: inline-block; border: 1px solid #000; padding: 1px 4px; font-size: 7pt; font-weight: bold; margin-top: 2px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <h1>PASSARELLI DOCES</h1>
  <div class="sub">${order.source === "pdv" ? "Pedido PDV" : "Pedido Online"}</div>

  <div class="order-id">#${order.id.slice(0, 18)}</div>

  <div class="line"></div>

  <div class="info-block">
    <div class="info-row">
      <span class="info-label">Data:</span>
      <span class="info-value">${order.createdAt.slice(8, 10)}/${order.createdAt.slice(5, 7)}/${order.createdAt.slice(0, 4)} ${order.createdAt.slice(11, 16)}</span>
    </div>
  </div>

  <div class="line"></div>

  <div class="info-block">
    <p style="font-weight:bold;margin-bottom:2px;">CLIENTE</p>
    <div class="info-row">
      <span class="info-label">Nome:</span>
      <span class="info-value">${order.customer.name}</span>
    </div>
    ${order.customer.phone ? `<div class="info-row"><span class="info-label">Telefone:</span><span class="info-value">${order.customer.phone}</span></div>` : ""}
    ${order.customer.email ? `<div class="info-row"><span class="info-label">E-mail:</span><span class="info-value">${order.customer.email}</span></div>` : ""}
    ${order.customer.document ? `<div class="info-row"><span class="info-label">CPF/CNPJ:</span><span class="info-value">${order.customer.document}</span></div>` : ""}
  </div>

  ${
    order.customer.address || order.customer.city
      ? `
  <div class="line"></div>
  <div class="info-block">
    <p style="font-weight:bold;margin-bottom:2px;">ENDEREÇO</p>
    ${order.customer.address ? `<div class="info-row"><span class="info-value">${order.customer.address}${order.customer.number ? `, ${order.customer.number}` : ""}${order.customer.complement ? ` - ${order.customer.complement}` : ""}</span></div>` : ""}
    ${order.customer.neighborhood ? `<div class="info-row"><span class="info-value">${order.customer.neighborhood}</span></div>` : ""}
    ${order.customer.city || order.customer.state ? `<div class="info-row"><span class="info-value">${order.customer.city}${order.customer.state ? `/${order.customer.state}` : ""}</span></div>` : ""}
    ${order.customer.zipCode ? `<div class="info-row"><span class="info-label">CEP:</span><span class="info-value">${order.customer.zipCode}</span></div>` : ""}
  </div>`
      : ""
  }

  <div class="double-line"></div>

  <table>
    <thead>
      <tr>
        <th class="r">Qtd</th>
        <th>Produto</th>
        <th class="r">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${items}
    </tbody>
  </table>

  <div class="line"></div>

  <div class="info-block">
    <div class="info-row"><span class="info-label">Subtotal:</span><span>${formatCurrency(order.subtotal)}</span></div>
    ${order.discount > 0 ? `<div class="info-row"><span class="info-label">Desconto:</span><span>-${formatCurrency(order.discount)}</span></div>` : ""}
    <div class="info-row"><span class="info-label">Frete:</span><span>${order.shipping === 0 ? "Grátis" : formatCurrency(order.shipping)}</span></div>
  </div>

  <div class="total-row">
    <span>TOTAL</span>
    <span>${formatCurrency(order.total)}</span>
  </div>

  <div class="double-line"></div>

  <div class="info-block">
    <div class="info-row">
      <span class="info-label">Pagamento:</span>
      <span class="info-value">${PAYMENT_LABEL_FULL[order.paymentMethod] ?? order.paymentMethod}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Status:</span>
      <span class="status-badge">${STATUS_LABEL_FULL[order.status] ?? order.status}</span>
    </div>
  </div>

  <div class="double-line"></div>
  <div class="footer">Obrigado pela preferência!</div>
</body>
</html>`;

  const w = window.open("", "_blank", "width=400,height=600");
  if (!w) {
    window.alert("Permita pop-ups para imprimir o cupom.");
    return;
  }
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}
