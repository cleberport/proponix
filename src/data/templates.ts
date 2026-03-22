import { Template, CanvasElement, DEFAULT_TEMPLATE_VALUES, DEFAULT_INPUT_FIELDS, DEFAULT_CALCULATED_FIELDS } from '@/types/template';
import { v4 as uuidv4 } from 'uuid';

const CANVAS_W = 595;
const CANVAS_H = 842;

function el(partial: Partial<CanvasElement> & { type: CanvasElement['type'] }): CanvasElement {
  return {
    id: uuidv4(),
    x: 40,
    y: 40,
    width: 200,
    height: 30,
    content: '',
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Inter',
    color: '#0F172A',
    alignment: 'left',
    isVisible: true,
    ...partial,
  };
}

function makeTemplate(
  id: string,
  name: string,
  category: string,
  description: string,
  elements: CanvasElement[],
  variables: string[],
  overrides?: {
    defaultValues?: Record<string, string>;
    inputFields?: string[];
    calculatedFields?: Record<string, string>;
    settings?: { taxRate: number; showTax: boolean; backgroundColor?: string };
    color?: string;
  }
): Template {
  return {
    id,
    name,
    category,
    description,
    thumbnail: '',
    color: overrides?.color,
    elements,
    variables: [...new Set([...variables, 'data_de_hoje'])],
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    defaultValues: overrides?.defaultValues || { ...DEFAULT_TEMPLATE_VALUES },
    inputFields: overrides?.inputFields || [...DEFAULT_INPUT_FIELDS],
    calculatedFields: overrides?.calculatedFields || { ...DEFAULT_CALCULATED_FIELDS },
    settings: overrides?.settings || { taxRate: 0.10, showTax: true },
  };
}

const allVars = ['client_name', 'event_name', 'event_date', 'location', 'subtotal', 'tax', 'total', 'service_name', 'price', 'tax_rate'];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — MINIMAL (Clean white, black, neutral tones)
// ─────────────────────────────────────────────────────────────────────────────
const minimalElements: CanvasElement[] = [
  // Logo area - text-based minimal logo
  el({ type: 'text', x: 40, y: 36, width: 180, height: 28, content: 'STUDIO', fontSize: 22, fontWeight: '700', fontFamily: 'Inter', color: '#18181B', alignment: 'left' }),
  el({ type: 'text', x: 40, y: 62, width: 180, height: 16, content: 'design & consultoria', fontSize: 10, fontWeight: '400', fontFamily: 'Inter', color: '#A1A1AA' }),

  // Company details - right aligned
  el({ type: 'text', x: 340, y: 36, width: 215, height: 14, content: 'Studio Design & Consultoria Ltda.', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#71717A', alignment: 'right' }),
  el({ type: 'text', x: 340, y: 50, width: 215, height: 14, content: 'CNPJ: 12.345.678/0001-90', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#71717A', alignment: 'right' }),
  el({ type: 'text', x: 340, y: 64, width: 215, height: 14, content: 'contato@studio.com.br', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#71717A', alignment: 'right' }),

  // Thin divider
  el({ type: 'divider', x: 40, y: 90, width: 515, height: 1, content: '', color: '#E4E4E7' }),

  // Title
  el({ type: 'text', x: 40, y: 108, width: 300, height: 32, content: 'Proposta Comercial', fontSize: 24, fontWeight: '300', fontFamily: 'Inter', color: '#18181B' }),

  // Client info block
  el({ type: 'text', x: 40, y: 156, width: 80, height: 16, content: 'PARA', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 40, y: 172, width: 240, height: 24, content: '', variable: 'client_name', fontSize: 14, fontWeight: '500', fontFamily: 'Inter', color: '#18181B', fieldCategory: 'input' }),

  el({ type: 'text', x: 300, y: 156, width: 80, height: 16, content: 'EVENTO', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 300, y: 172, width: 255, height: 24, content: '', variable: 'event_name', fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#18181B', fieldCategory: 'input' }),

  el({ type: 'text', x: 40, y: 206, width: 80, height: 16, content: 'LOCAL', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 40, y: 222, width: 240, height: 24, content: '', variable: 'location', fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#18181B', fieldCategory: 'input' }),

  el({ type: 'text', x: 300, y: 206, width: 80, height: 16, content: 'DATA', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 300, y: 222, width: 255, height: 24, content: '', variable: 'event_date', fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#18181B', fieldCategory: 'input' }),

  // Divider before table
  el({ type: 'divider', x: 40, y: 260, width: 515, height: 1, content: '', color: '#E4E4E7' }),

  // Services table
  el({ type: 'text', x: 40, y: 274, width: 200, height: 16, content: 'SERVIÇOS', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#A1A1AA' }),
  el({ type: 'table', x: 40, y: 296, width: 515, height: 220, content: '', fontSize: 12, fontFamily: 'Inter', color: '#18181B', rows: [
    { cells: ['Descrição do Serviço', 'Qtd', 'Valor Unit.', 'Total'] },
    { cells: ['Consultoria estratégica', '1', 'R$ 3.500,00', 'R$ 3.500,00'] },
    { cells: ['Desenvolvimento de identidade visual', '1', 'R$ 4.200,00', 'R$ 4.200,00'] },
    { cells: ['Material gráfico impresso', '500', 'R$ 2,80', 'R$ 1.400,00'] },
  ] }),

  // Totals block
  el({ type: 'divider', x: 340, y: 536, width: 215, height: 1, content: '', color: '#E4E4E7' }),
  el({ type: 'price-field', x: 340, y: 548, width: 215, height: 24, content: 'Subtotal:', variable: 'subtotal', fontSize: 12, fontFamily: 'Inter', color: '#71717A', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 340, y: 574, width: 215, height: 24, content: 'Impostos (10%):', variable: 'tax', fontSize: 12, fontFamily: 'Inter', color: '#71717A', fieldCategory: 'calculated' }),
  el({ type: 'divider', x: 340, y: 602, width: 215, height: 1, content: '', color: '#18181B' }),
  el({ type: 'total-calculation', x: 340, y: 612, width: 215, height: 30, content: 'Total:', variable: 'total', fontWeight: '600', fontSize: 16, fontFamily: 'Inter', color: '#18181B', fieldCategory: 'calculated' }),

  // Observations
  el({ type: 'text', x: 40, y: 660, width: 200, height: 16, content: 'OBSERVAÇÕES', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#A1A1AA' }),
  el({ type: 'notes', x: 40, y: 680, width: 515, height: 80, content: 'Esta proposta é válida por 15 dias a partir da data de emissão. O pagamento deverá ser realizado em até 10 dias úteis após a aprovação. Valores sujeitos a reajuste após o prazo de validade.', fontSize: 11, fontFamily: 'Inter', color: '#52525B', fieldCategory: 'default' }),

  // Footer date
  el({ type: 'dynamic-field', x: 40, y: 780, width: 200, height: 16, content: '', variable: 'data_de_hoje', fontSize: 9, fontFamily: 'Inter', color: '#A1A1AA', fieldCategory: 'default' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — MODERNO (Pink/purple/blue gradient SaaS style)
// ─────────────────────────────────────────────────────────────────────────────
const modernoElements: CanvasElement[] = [
  // Colored header band (simulated with text block)
  el({ type: 'text', x: 0, y: 0, width: 595, height: 110, content: '', fontSize: 1, color: '#7C3AED' }),

  // Logo - modern brand
  el({ type: 'text', x: 40, y: 24, width: 200, height: 34, content: '◆ VÉRTICE', fontSize: 24, fontWeight: '800', fontFamily: 'Inter', color: '#FFFFFF' }),
  el({ type: 'text', x: 40, y: 56, width: 250, height: 16, content: 'Soluções Digitais & Tecnologia', fontSize: 10, fontWeight: '400', fontFamily: 'Inter', color: '#DDD6FE' }),
  el({ type: 'text', x: 40, y: 72, width: 250, height: 14, content: 'CNPJ: 45.678.901/0001-23 • vertice.tech', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#C4B5FD' }),

  // Date on header right
  el({ type: 'dynamic-field', x: 400, y: 24, width: 155, height: 20, content: '', variable: 'data_de_hoje', fontSize: 10, fontFamily: 'Inter', color: '#DDD6FE', alignment: 'right', fieldCategory: 'default' }),

  // Title
  el({ type: 'text', x: 40, y: 130, width: 400, height: 36, content: 'Proposta de Serviços', fontSize: 28, fontWeight: '700', fontFamily: 'Inter', color: '#1E1B4B' }),
  el({ type: 'divider', x: 40, y: 168, width: 60, height: 3, content: '', color: '#7C3AED' }),

  // Client info - card style
  el({ type: 'text', x: 40, y: 190, width: 515, height: 18, content: 'Dados do Cliente', fontSize: 11, fontWeight: '600', fontFamily: 'Inter', color: '#7C3AED' }),

  el({ type: 'dynamic-field', x: 40, y: 214, width: 250, height: 22, content: 'Cliente:', variable: 'client_name', fontSize: 13, fontWeight: '500', fontFamily: 'Inter', color: '#1E1B4B', fieldCategory: 'input' }),
  el({ type: 'dynamic-field', x: 310, y: 214, width: 245, height: 22, content: 'Evento:', variable: 'event_name', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#1E1B4B', fieldCategory: 'input' }),

  el({ type: 'dynamic-field', x: 40, y: 242, width: 250, height: 22, content: 'Local:', variable: 'location', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#1E1B4B', fieldCategory: 'input' }),
  el({ type: 'dynamic-field', x: 310, y: 242, width: 245, height: 22, content: 'Data:', variable: 'event_date', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#1E1B4B', fieldCategory: 'input' }),

  el({ type: 'divider', x: 40, y: 276, width: 515, height: 1, content: '', color: '#EDE9FE' }),

  // Services
  el({ type: 'text', x: 40, y: 292, width: 515, height: 18, content: 'Escopo de Trabalho', fontSize: 11, fontWeight: '600', fontFamily: 'Inter', color: '#7C3AED' }),

  el({ type: 'table', x: 40, y: 316, width: 515, height: 220, content: '', fontSize: 12, fontFamily: 'Inter', color: '#1E1B4B', rows: [
    { cells: ['Serviço', 'Prazo', 'Investimento'] },
    { cells: ['Desenvolvimento de plataforma web', '45 dias', 'R$ 18.000,00'] },
    { cells: ['Integração com sistemas de pagamento', '15 dias', 'R$ 6.500,00'] },
    { cells: ['Treinamento da equipe', '3 dias', 'R$ 2.800,00'] },
    { cells: ['Suporte técnico (3 meses)', 'Contínuo', 'R$ 4.500,00'] },
  ] }),

  // Totals
  el({ type: 'divider', x: 340, y: 556, width: 215, height: 1, content: '', color: '#EDE9FE' }),
  el({ type: 'price-field', x: 340, y: 568, width: 215, height: 22, content: 'Subtotal:', variable: 'subtotal', fontSize: 12, fontFamily: 'Inter', color: '#6B7280', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 340, y: 594, width: 215, height: 22, content: 'Impostos (10%):', variable: 'tax', fontSize: 12, fontFamily: 'Inter', color: '#6B7280', fieldCategory: 'calculated' }),
  el({ type: 'divider', x: 340, y: 620, width: 215, height: 2, content: '', color: '#7C3AED' }),
  el({ type: 'total-calculation', x: 340, y: 630, width: 215, height: 32, content: 'Total:', variable: 'total', fontWeight: '700', fontSize: 18, fontFamily: 'Inter', color: '#1E1B4B', fieldCategory: 'calculated' }),

  // Notes
  el({ type: 'notes', x: 40, y: 680, width: 515, height: 80, content: 'Proposta válida por 30 dias. Forma de pagamento: 50% na aprovação e 50% na entrega. Inclui garantia de 90 dias para correção de bugs. Hospedagem e domínio não inclusos neste orçamento.', fontSize: 10, fontFamily: 'Inter', color: '#6B7280', fieldCategory: 'default' }),

  // Footer
  el({ type: 'text', x: 40, y: 780, width: 515, height: 14, content: 'vertice.tech • contato@vertice.tech • (11) 98765-4321', fontSize: 8, fontWeight: '400', fontFamily: 'Inter', color: '#A78BFA', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — CLÁSSICO (Corporate blue/gray business style)
// ─────────────────────────────────────────────────────────────────────────────
const classicoElements: CanvasElement[] = [
  // Logo area - corporate text logo
  el({ type: 'text', x: 40, y: 32, width: 280, height: 30, content: 'ATLAS ENGENHARIA', fontSize: 20, fontWeight: '700', fontFamily: 'Inter', color: '#1E3A5F' }),
  el({ type: 'text', x: 40, y: 60, width: 280, height: 14, content: 'Engenharia • Consultoria • Projetos', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#64748B' }),
  el({ type: 'text', x: 40, y: 76, width: 280, height: 14, content: 'CNPJ: 78.901.234/0001-56', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#94A3B8' }),

  // Right side - document info
  el({ type: 'text', x: 380, y: 32, width: 175, height: 28, content: 'PROPOSTA', fontSize: 20, fontWeight: '700', fontFamily: 'Inter', color: '#1E3A5F', alignment: 'right' }),
  el({ type: 'text', x: 380, y: 60, width: 175, height: 14, content: 'Nº 2024/0847', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#64748B', alignment: 'right' }),
  el({ type: 'dynamic-field', x: 380, y: 76, width: 175, height: 14, content: '', variable: 'data_de_hoje', fontSize: 9, fontFamily: 'Inter', color: '#94A3B8', alignment: 'right', fieldCategory: 'default' }),

  // Blue accent divider
  el({ type: 'divider', x: 40, y: 100, width: 515, height: 3, content: '', color: '#1E3A5F' }),
  el({ type: 'divider', x: 40, y: 105, width: 515, height: 1, content: '', color: '#CBD5E1' }),

  // Client section header
  el({ type: 'text', x: 40, y: 122, width: 200, height: 18, content: 'DESTINATÁRIO', fontSize: 10, fontWeight: '700', fontFamily: 'Inter', color: '#1E3A5F' }),

  el({ type: 'dynamic-field', x: 40, y: 144, width: 250, height: 22, content: 'Cliente:', variable: 'client_name', fontSize: 13, fontWeight: '500', fontFamily: 'Inter', color: '#0F172A', fieldCategory: 'input' }),
  el({ type: 'dynamic-field', x: 310, y: 144, width: 245, height: 22, content: 'Evento:', variable: 'event_name', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#334155', fieldCategory: 'input' }),
  el({ type: 'dynamic-field', x: 40, y: 170, width: 250, height: 22, content: 'Local:', variable: 'location', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#334155', fieldCategory: 'input' }),
  el({ type: 'dynamic-field', x: 310, y: 170, width: 245, height: 22, content: 'Data do evento:', variable: 'event_date', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#334155', fieldCategory: 'input' }),

  el({ type: 'divider', x: 40, y: 204, width: 515, height: 1, content: '', color: '#CBD5E1' }),

  // Scope header
  el({ type: 'text', x: 40, y: 218, width: 200, height: 18, content: 'DESCRIÇÃO DOS SERVIÇOS', fontSize: 10, fontWeight: '700', fontFamily: 'Inter', color: '#1E3A5F' }),

  el({ type: 'text', x: 40, y: 240, width: 515, height: 36, content: 'Apresentamos a seguir a proposta técnica e comercial para execução dos serviços de engenharia conforme escopo definido em reunião realizada com o cliente.', fontSize: 11, fontWeight: '400', fontFamily: 'Inter', color: '#475569' }),

  // Services table
  el({ type: 'table', x: 40, y: 290, width: 515, height: 220, content: '', fontSize: 11, fontFamily: 'Inter', color: '#0F172A', rows: [
    { cells: ['Item', 'Descrição', 'Un.', 'Valor'] },
    { cells: ['01', 'Projeto executivo de instalações elétricas', 'm²', 'R$ 12.500,00'] },
    { cells: ['02', 'Acompanhamento técnico de obra', 'mês', 'R$ 8.000,00'] },
    { cells: ['03', 'Laudo técnico de conformidade', 'un', 'R$ 3.200,00'] },
    { cells: ['04', 'ART e documentação regulatória', 'un', 'R$ 1.800,00'] },
  ] }),

  // Totals
  el({ type: 'divider', x: 340, y: 530, width: 215, height: 1, content: '', color: '#CBD5E1' }),
  el({ type: 'price-field', x: 340, y: 542, width: 215, height: 22, content: 'Subtotal:', variable: 'subtotal', fontSize: 12, fontFamily: 'Inter', color: '#475569', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 340, y: 566, width: 215, height: 22, content: 'ISS (5%):', variable: 'tax', fontSize: 12, fontFamily: 'Inter', color: '#475569', fieldCategory: 'calculated' }),
  el({ type: 'divider', x: 340, y: 594, width: 215, height: 2, content: '', color: '#1E3A5F' }),
  el({ type: 'total-calculation', x: 340, y: 604, width: 215, height: 30, content: 'Valor Total:', variable: 'total', fontWeight: '700', fontSize: 16, fontFamily: 'Inter', color: '#1E3A5F', fieldCategory: 'calculated' }),

  // Conditions
  el({ type: 'text', x: 40, y: 650, width: 200, height: 18, content: 'CONDIÇÕES GERAIS', fontSize: 10, fontWeight: '700', fontFamily: 'Inter', color: '#1E3A5F' }),
  el({ type: 'notes', x: 40, y: 672, width: 515, height: 80, content: 'Prazo de execução: conforme cronograma a ser definido após aprovação. Condições de pagamento: 30/30/40 (aprovação, medição intermediária, entrega final). Proposta válida por 20 dias. Reajuste pelo INCC após 90 dias.', fontSize: 10, fontFamily: 'Inter', color: '#475569', fieldCategory: 'default' }),

  // Footer
  el({ type: 'divider', x: 40, y: 770, width: 515, height: 1, content: '', color: '#CBD5E1' }),
  el({ type: 'text', x: 40, y: 780, width: 515, height: 14, content: 'Atlas Engenharia Ltda. • Rua das Palmeiras, 1200 – São Paulo/SP • (11) 3456-7890 • atlas@eng.com.br', fontSize: 8, fontWeight: '400', fontFamily: 'Inter', color: '#94A3B8', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — CRIATIVO (Bold colors, larger typography)
// ─────────────────────────────────────────────────────────────────────────────
const criativoElements: CanvasElement[] = [
  // Bold logo
  el({ type: 'text', x: 40, y: 30, width: 300, height: 40, content: 'PULSO.', fontSize: 36, fontWeight: '900', fontFamily: 'Inter', color: '#F43F5E' }),
  el({ type: 'text', x: 40, y: 68, width: 300, height: 16, content: 'agência criativa', fontSize: 11, fontWeight: '500', fontFamily: 'Inter', color: '#FB7185' }),
  el({ type: 'text', x: 40, y: 86, width: 300, height: 14, content: 'CNPJ: 34.567.890/0001-12 • oi@pulso.ag', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#FDA4AF' }),

  // Big title
  el({ type: 'text', x: 40, y: 126, width: 515, height: 50, content: 'PROPOSTA', fontSize: 48, fontWeight: '900', fontFamily: 'Inter', color: '#0F172A' }),
  el({ type: 'text', x: 40, y: 172, width: 515, height: 28, content: 'CRIATIVA', fontSize: 48, fontWeight: '900', fontFamily: 'Inter', color: '#F43F5E' }),

  // Accent bar
  el({ type: 'divider', x: 40, y: 210, width: 80, height: 4, content: '', color: '#F43F5E' }),

  // Client info - two columns
  el({ type: 'dynamic-field', x: 40, y: 230, width: 250, height: 22, content: 'Para:', variable: 'client_name', fontSize: 14, fontWeight: '600', fontFamily: 'Inter', color: '#0F172A', fieldCategory: 'input' }),
  el({ type: 'dynamic-field', x: 310, y: 230, width: 245, height: 22, content: 'Projeto:', variable: 'event_name', fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#334155', fieldCategory: 'input' }),

  el({ type: 'dynamic-field', x: 40, y: 258, width: 250, height: 22, content: 'Local:', variable: 'location', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#334155', fieldCategory: 'input' }),
  el({ type: 'dynamic-field', x: 310, y: 258, width: 245, height: 22, content: 'Data:', variable: 'event_date', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#334155', fieldCategory: 'input' }),

  el({ type: 'dynamic-field', x: 40, y: 286, width: 250, height: 16, content: '', variable: 'data_de_hoje', fontSize: 9, fontFamily: 'Inter', color: '#94A3B8', fieldCategory: 'default' }),

  el({ type: 'divider', x: 40, y: 312, width: 515, height: 1, content: '', color: '#E2E8F0' }),

  // Services
  el({ type: 'text', x: 40, y: 326, width: 200, height: 20, content: 'O QUE VAMOS FAZER', fontSize: 12, fontWeight: '800', fontFamily: 'Inter', color: '#F43F5E' }),

  el({ type: 'table', x: 40, y: 354, width: 515, height: 200, content: '', fontSize: 12, fontFamily: 'Inter', color: '#0F172A', rows: [
    { cells: ['Entrega', 'Descrição', 'Investimento'] },
    { cells: ['Identidade Visual', 'Logo, paleta de cores, tipografia e manual da marca', 'R$ 6.800,00'] },
    { cells: ['Social Media', 'Planejamento + 20 posts/mês por 3 meses', 'R$ 9.600,00'] },
    { cells: ['Landing Page', 'Design e desenvolvimento responsivo', 'R$ 4.500,00'] },
  ] }),

  // Totals - left aligned for bold effect
  el({ type: 'divider', x: 40, y: 574, width: 515, height: 2, content: '', color: '#0F172A' }),
  el({ type: 'price-field', x: 340, y: 588, width: 215, height: 22, content: 'Subtotal:', variable: 'subtotal', fontSize: 12, fontFamily: 'Inter', color: '#64748B', fieldCategory: 'calculated' }),
  el({ type: 'total-calculation', x: 340, y: 616, width: 215, height: 34, content: 'Investimento Total:', variable: 'total', fontWeight: '800', fontSize: 18, fontFamily: 'Inter', color: '#0F172A', fieldCategory: 'calculated' }),

  // Notes
  el({ type: 'notes', x: 40, y: 670, width: 515, height: 80, content: 'Prazo estimado: 60 dias corridos a partir da aprovação. Pagamento: 40% de entrada + 3 parcelas de 20%. Revisões ilimitadas incluídas em cada fase. Arquivos fontes entregues ao final do projeto.', fontSize: 10, fontFamily: 'Inter', color: '#64748B', fieldCategory: 'default' }),

  // Footer
  el({ type: 'text', x: 40, y: 780, width: 515, height: 14, content: 'PULSO. agência criativa • pulso.ag • @pulso.ag', fontSize: 8, fontWeight: '500', fontFamily: 'Inter', color: '#FDA4AF', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — PREMIUM (Dark mode, refined layout)
// ─────────────────────────────────────────────────────────────────────────────
const premiumElements: CanvasElement[] = [
  // Logo - premium brand
  el({ type: 'text', x: 40, y: 36, width: 240, height: 28, content: 'NOIR ARQUITETURA', fontSize: 18, fontWeight: '300', fontFamily: 'Inter', color: '#D4AF37' }),
  el({ type: 'text', x: 40, y: 62, width: 240, height: 14, content: 'Arquitetura de Interiores & Design', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#9CA3AF' }),
  el({ type: 'text', x: 40, y: 78, width: 240, height: 14, content: 'CNPJ: 56.789.012/0001-34', fontSize: 9, fontWeight: '400', fontFamily: 'Inter', color: '#6B7280' }),

  // Right - date
  el({ type: 'dynamic-field', x: 400, y: 36, width: 155, height: 16, content: '', variable: 'data_de_hoje', fontSize: 9, fontFamily: 'Inter', color: '#6B7280', alignment: 'right', fieldCategory: 'default' }),

  // Gold accent line
  el({ type: 'divider', x: 40, y: 102, width: 515, height: 1, content: '', color: '#D4AF37' }),

  // Title
  el({ type: 'text', x: 40, y: 120, width: 515, height: 36, content: 'Proposta de Projeto', fontSize: 28, fontWeight: '300', fontFamily: 'Inter', color: '#F9FAFB' }),
  el({ type: 'divider', x: 40, y: 158, width: 40, height: 2, content: '', color: '#D4AF37' }),

  // Client block
  el({ type: 'text', x: 40, y: 178, width: 100, height: 16, content: 'CLIENTE', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 40, y: 196, width: 250, height: 22, content: '', variable: 'client_name', fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#F3F4F6', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 178, width: 100, height: 16, content: 'PROJETO', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 310, y: 196, width: 245, height: 22, content: '', variable: 'event_name', fontSize: 14, fontWeight: '400', fontFamily: 'Inter', color: '#F3F4F6', fieldCategory: 'input' }),

  el({ type: 'text', x: 40, y: 228, width: 100, height: 16, content: 'ENDEREÇO', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 40, y: 246, width: 250, height: 22, content: '', variable: 'location', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#D1D5DB', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 228, width: 100, height: 16, content: 'DATA', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 310, y: 246, width: 245, height: 22, content: '', variable: 'event_date', fontSize: 13, fontWeight: '400', fontFamily: 'Inter', color: '#D1D5DB', fieldCategory: 'input' }),

  el({ type: 'divider', x: 40, y: 282, width: 515, height: 1, content: '', color: '#374151' }),

  // Services
  el({ type: 'text', x: 40, y: 298, width: 200, height: 16, content: 'SERVIÇOS PROPOSTOS', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#D4AF37' }),

  el({ type: 'table', x: 40, y: 322, width: 515, height: 220, content: '', fontSize: 11, fontFamily: 'Inter', color: '#E5E7EB', rows: [
    { cells: ['Fase', 'Descrição', 'Prazo', 'Valor'] },
    { cells: ['Conceito', 'Estudo preliminar e moodboard', '15 dias', 'R$ 8.500,00'] },
    { cells: ['Projeto', 'Projeto executivo completo', '30 dias', 'R$ 22.000,00'] },
    { cells: ['Acompanhamento', 'Gestão da obra e fornecedores', '90 dias', 'R$ 15.000,00'] },
    { cells: ['Decoração', 'Especificação e compra de mobiliário', '30 dias', 'R$ 12.000,00'] },
  ] }),

  // Totals
  el({ type: 'divider', x: 340, y: 562, width: 215, height: 1, content: '', color: '#374151' }),
  el({ type: 'price-field', x: 340, y: 574, width: 215, height: 22, content: 'Subtotal:', variable: 'subtotal', fontSize: 12, fontFamily: 'Inter', color: '#9CA3AF', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 340, y: 598, width: 215, height: 22, content: 'ISS (5%):', variable: 'tax', fontSize: 12, fontFamily: 'Inter', color: '#9CA3AF', fieldCategory: 'calculated' }),
  el({ type: 'divider', x: 340, y: 624, width: 215, height: 1, content: '', color: '#D4AF37' }),
  el({ type: 'total-calculation', x: 340, y: 636, width: 215, height: 30, content: 'Investimento:', variable: 'total', fontWeight: '400', fontSize: 18, fontFamily: 'Inter', color: '#D4AF37', fieldCategory: 'calculated' }),

  // Notes
  el({ type: 'text', x: 40, y: 682, width: 200, height: 16, content: 'OBSERVAÇÕES', fontSize: 9, fontWeight: '600', fontFamily: 'Inter', color: '#D4AF37' }),
  el({ type: 'notes', x: 40, y: 702, width: 515, height: 60, content: 'Proposta válida por 10 dias. Pagamento: 30% na aprovação, 40% na entrega do projeto e 30% na conclusão da obra. Materiais e mobiliário faturados separadamente. Deslocamentos inclusos na Grande São Paulo.', fontSize: 10, fontFamily: 'Inter', color: '#9CA3AF', fieldCategory: 'default' }),

  // Footer
  el({ type: 'divider', x: 40, y: 778, width: 515, height: 1, content: '', color: '#374151' }),
  el({ type: 'text', x: 40, y: 790, width: 515, height: 14, content: 'NOIR ARQUITETURA • Rua Oscar Freire, 870 – Jardins, São Paulo • noir.arq.br', fontSize: 8, fontWeight: '300', fontFamily: 'Inter', color: '#6B7280', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const starterTemplates: Template[] = [
  makeTemplate('template-minimal', 'Minimal', 'Geral', 'Layout limpo e sofisticado com tipografia leve e espaçamento generoso. Ideal para qualquer tipo de serviço.', minimalElements, allVars, {
    defaultValues: { tax_rate: '0.10' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true },
    color: '#71717A',
  }),

  makeTemplate('template-moderno', 'Moderno', 'Tecnologia', 'Visual moderno com header em destaque, cores vibrantes e estrutura profissional para empresas de tecnologia.', modernoElements, allVars, {
    defaultValues: { tax_rate: '0.10' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true },
    color: '#7C3AED',
  }),

  makeTemplate('template-classico', 'Clássico', 'Corporativo', 'Template corporativo com estrutura tradicional, cores sóbrias e diagramação formal para empresas de engenharia e consultoria.', classicoElements, allVars, {
    defaultValues: { tax_rate: '0.05' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.05, showTax: true },
    color: '#1E3A5F',
  }),

  makeTemplate('template-criativo', 'Criativo', 'Agência', 'Design ousado com tipografia expressiva e cores vibrantes. Perfeito para agências, freelancers e profissionais criativos.', criativoElements, allVars, {
    defaultValues: { tax_rate: '0' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false },
    color: '#F43F5E',
  }),

  makeTemplate('template-premium', 'Premium', 'Arquitetura', 'Layout elegante com fundo escuro, detalhes dourados e tipografia refinada. Para escritórios premium de arquitetura e design.', premiumElements, allVars, {
    defaultValues: { tax_rate: '0.05' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.05, showTax: true, backgroundColor: '#111827' },
    color: '#D4AF37',
  }),
];
