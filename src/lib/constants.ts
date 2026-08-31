import type { SiteSettings } from "./types";

/**
 * Configurações institucionais da PASSARELLI DOCES.
 * Futuramente podem ser gerenciadas pelo painel administrativo
 * (tabela site_settings no Supabase).
 */
export const SITE_NAME = "PASSARELLI DOCES";
export const SITE_TAGLINE = "Doces especiais para momentos especiais";

export const DEFAULT_SETTINGS: SiteSettings = {
  // Identidade
  name: "PASSARELLI DOCES",
  tagline: "Doces especiais para momentos especiais",
  primaryColor: "#2a1510",
  secondaryColor: "#c9a84c",
  history:
    "A PASSARELLI DOCES nasceu do amor pela confeitaria artesanal e do desejo de transformar ingredientes simples em memórias doces. Fundada em 2019, nossa jornada começou na cozinha de casa, testando receitas de família e criando novas combinações de sabores. Hoje, cada doce que sai da nossa produção carrega a mesma dedicação do primeiro brigadeiro: ingredientes selecionados, processo artesanal e muito carinho.",
  mission:
    "Levar alegria e doçura para a vida das pessoas através de doces artesanais de qualidade excepcional, feitos com ingredientes selecionados e carinho em cada detalhe.",
  vision:
    "Ser a referência em doces artesanais no Brasil, reconhecida pela qualidade, inovação nos sabores e experiência única de atendimento.",
  values: [
    { title: "Artesanal", description: "Cada peça é feita à mão, com tempo e dedicação." },
    { title: "Qualidade", description: "Ingredientes selecionados e fornecedores de confiança." },
    { title: "Carinho", description: "Do preparo à entrega, tudo feito com amor." },
    { title: "Inovação", description: "Sabores únicos que surpreendem e encantam." },
  ],
  productsPageBanner: "",
  productsPageBannerAlt: "Nossos doces artesanais",
  // Contato
  email: "contato@passarellidoces.com.br",
  phone: "(11) 98765-4321",
  whatsapp: "5511987654321",
  address: "Rua dos Doces, 123 - Centro · São Paulo/SP",
  hours: "Segunda a sábado, das 09h às 19h",
  mapUrl: "https://www.google.com/maps/embed?pb=...",
  cnpj: "00.000.000/0000-00",
  // Redes sociais
  social: [
    { platform: "instagram", url: "https://instagram.com/passarellidoces", label: "Instagram" },
    { platform: "facebook", url: "https://facebook.com/passarellidoces", label: "Facebook" },
    { platform: "whatsapp", url: "https://wa.me/5511987654321", label: "WhatsApp" },
  ],
  // WhatsApp flutuante
  whatsappNumber: "5511987654321",
  whatsappMessage: "Olá! Gostaria de fazer um pedido 🍬",
  // Armazenamento de imagens (preenchido no painel admin)
  imageProvider: {
    cloudName: "",
    uploadPreset: "",
    folder: "produtos",
  },
  // Páginas institucionais
  pages: {
    quemSomos: {
      title: "Quem Somos",
      subtitle: "Conheça nossa história",
      content:
        "<p>A <strong>PASSARELLI DOCES</strong> nasceu do amor pela confeitaria artesanal e do desejo de transformar ingredientes simples em memórias doces. Fundada em 2019, nossa jornada começou na cozinha de casa, testando receitas de família e criando novas combinações de sabores.</p><p>Hoje, cada doce que sai da nossa produção carrega a mesma dedicação do primeiro brigadeiro: ingredientes selecionados, processo artesanal e muito carinho. Não vendemos apenas doces — entregamos experiências, celebrações e momentos especiais.</p><p>Nossa equipe é formada por confeiteiros apaixonados que acreditam que o melhor ingrediente de qualquer receita é o carinho com que ela é feita.</p>",
    },
    nossaMissao: {
      title: "Nossa Missão",
      subtitle: "O que nos move",
      content:
        "<p><strong>Levar alegria e doçura para a vida das pessoas</strong> através de doces artesanais de qualidade excepcional, feitos com ingredientes selecionados e carinho em cada detalhe.</p><p>Acreditamos que um doce bem feito tem o poder de transformar um dia comum em uma celebração, de aproximar pessoas e criar memórias que duram para sempre.</p><ul><li>Ingredientes frescos e de qualidade</li><li>Produção artesanal, sem conservantes</li><li>Receitas exclusivas e testadas</li><li>Atendimento personalizado</li></ul>",
    },
    formasPagamento: {
      title: "Formas de Pagamento",
      subtitle: "Escolha a melhor opção para você",
      content:
        "<p>Oferecemos diversas opções para sua comodidade:</p><ul><li><strong>PIX</strong> — Aprovação imediata com 5% de desconto</li><li><strong>Cartão de crédito</strong> — Até 3x sem juros (Visa, Mastercard, Elo, Amex)</li><li><strong>Boleto bancário</strong> — Compensação em até 3 dias úteis</li><li><strong>Dinheiro</strong> — Para retirada na loja</li></ul><p>Todas as transações são processadas com segurança. Não armazenamos dados de cartão de crédito.</p>",
    },
    trocasDevolucoes: {
      title: "Trocas e Devoluções",
      subtitle: "Sua satisfação é nossa prioridade",
      content:
        "<p>Por se tratar de produtos alimentícios artesanais e perecíveis, as trocas e devoluções seguem regras específicas:</p><ul><li><strong>Produtos com defeito de fabricação:</strong> Troca imediata ou reembolso integral (notificar em até 24h após recebimento com fotos)</li><li><strong>Produto errado entregue:</strong> Coleta e envio do correto por nossa conta</li><li><strong>Arrependimento:</strong> Não aceitamos devolução por arrependimento por se tratar de alimento perecível (CDC Art. 18)</li></ul><p>Para solicitar troca, entre em contato pelo WhatsApp com o número do pedido e fotos do produto.</p>",
    },
    politicaPrivacidade: {
      title: "Política de Privacidade",
      subtitle: "Seus dados protegidos",
      content:
        "<p>Esta política descreve como coletamos, usamos e protegemos suas informações.</p><h3>Dados coletados</h3><ul><li>Dados de cadastro: nome, e-mail, telefone, endereço</li><li>Dados de pedido: itens, valores, forma de pagamento</li><li>Dados de navegação: cookies, IP, páginas visitadas</li></ul><h3>Uso dos dados</h3><ul><li>Processar e entregar pedidos</li><li>Enviar atualizações de status</li><li>Com seu consentimento, ofertas promocionais</li></ul><h3>Compartilhamento</h3><p>Não vendemos seus dados. Compartilhamos apenas com parceiros essenciais (entrega, pagamento) sob contratos de confidencialidade.</p><h3>Seus direitos</h3><p>Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail contato@passarellidoces.com.br.</p>",
    },
  },
  // Promo
  promoMessage: "Doces especiais para deixar seu dia ainda mais doce 🍬",
};

export const ADMINS = ["alejandrecardoso@gmail.com"];

export const MENU_HIGHLIGHTED_CATEGORIES = [
  "doces-tradicionais",
  "doces-gourmet",
  "chocolates",
  "bolos",
];

export const SHIPPING_METHODS = [
  {
    id: "retirada",
    name: "Retirada na loja",
    price: 0,
    estimate: "Pronto no mesmo dia",
  },
  {
    id: "express",
    name: "Entrega expressa (capital)",
    price: 19.9,
    estimate: "2 a 5 dias úteis",
  },
  {
    id: "normal",
    name: "Encomenda (demais regiões)",
    price: 29.9,
    estimate: "5 a 10 dias úteis",
  },
];

export const FREE_SHIPPING_THRESHOLD = 199;
