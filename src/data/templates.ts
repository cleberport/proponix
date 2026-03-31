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
    fontFamily: 'Space Grotesk',
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
    settings: overrides?.settings || { taxRate: 0, showTax: true },
  };
}

const allVars = ['client_name', 'event_name', 'event_date', 'location', 'subtotal', 'tax', 'total', 'service_name', 'price', 'tax_rate'];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 1 — MINIMAL (White, clean, airy)
// Large price as hero element, generous whitespace
// ─────────────────────────────────────────────────────────────────────────────
const minimalElements: CanvasElement[] = [
  // Logo placeholder
  el({ type: 'logo', x: 40, y: 36, width: 120, height: 40, content: '', imageUrl: '' }),

  // Date — top right
  el({ type: 'dynamic-field', x: 400, y: 44, width: 155, height: 14, content: '', variable: 'data_de_hoje', fontSize: 9, color: '#A1A1AA', alignment: 'right', fieldCategory: 'default' }),

  // Thin rule
  el({ type: 'divider', x: 40, y: 90, width: 515, height: 1, content: '', color: '#E4E4E7' }),

  // Title
  el({ type: 'text', x: 40, y: 110, width: 400, height: 34, content: 'Proposta Comercial', fontSize: 26, fontWeight: '300', color: '#18181B' }),

  // Client label + field
  el({ type: 'text', x: 40, y: 164, width: 80, height: 14, content: 'PARA', fontSize: 9, fontWeight: '600', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 40, y: 180, width: 240, height: 24, content: '', variable: 'client_name', fontSize: 15, fontWeight: '500', color: '#18181B', fieldCategory: 'input' }),

  // Event
  el({ type: 'text', x: 310, y: 164, width: 80, height: 14, content: 'EVENTO', fontSize: 9, fontWeight: '600', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 310, y: 180, width: 245, height: 24, content: '', variable: 'event_name', fontSize: 15, fontWeight: '400', color: '#18181B', fieldCategory: 'input' }),

  // Location
  el({ type: 'text', x: 40, y: 218, width: 80, height: 14, content: 'LOCAL', fontSize: 9, fontWeight: '600', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 40, y: 234, width: 240, height: 24, content: '', variable: 'location', fontSize: 14, fontWeight: '400', color: '#18181B', fieldCategory: 'input' }),

  // Date
  el({ type: 'text', x: 310, y: 218, width: 80, height: 14, content: 'DATA', fontSize: 9, fontWeight: '600', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 310, y: 234, width: 245, height: 24, content: '', variable: 'event_date', fontSize: 14, fontWeight: '400', color: '#18181B', fieldCategory: 'input' }),

  // Divider
  el({ type: 'divider', x: 40, y: 278, width: 515, height: 1, content: '', color: '#E4E4E7' }),

  // Service description section
  el({ type: 'text', x: 40, y: 298, width: 200, height: 14, content: 'SERVIÇO', fontSize: 9, fontWeight: '600', color: '#A1A1AA' }),
  el({ type: 'dynamic-field', x: 40, y: 316, width: 515, height: 24, content: '', variable: 'service_name', fontSize: 16, fontWeight: '500', color: '#18181B', fieldCategory: 'default' }),

  // Description text block
  el({ type: 'text', x: 40, y: 358, width: 515, height: 80, content: 'Inclui planejamento estratégico, execução completa do projeto, acompanhamento de entregas e revisões ilimitadas durante o período contratado. Suporte dedicado com atendimento prioritário.', fontSize: 12, fontWeight: '400', color: '#52525B' }),

  // Price input
  el({ type: 'divider', x: 40, y: 460, width: 515, height: 1, content: '', color: '#E4E4E7' }),

  el({ type: 'text', x: 40, y: 478, width: 515, height: 14, content: 'VALOR', fontSize: 9, fontWeight: '600', color: '#A1A1AA' }),
  el({ type: 'price-field', x: 40, y: 494, width: 250, height: 24, content: '', variable: 'price', fontSize: 16, fontWeight: '500', color: '#18181B', fieldCategory: 'input' }),

  // Total highlight — centered hero element
  el({ type: 'text', x: 40, y: 536, width: 515, height: 14, content: 'INVESTIMENTO', fontSize: 9, fontWeight: '600', color: '#A1A1AA', alignment: 'center' }),

  el({ type: 'total-calculation', x: 40, y: 556, width: 515, height: 50, content: '', variable: 'total', fontWeight: '300', fontSize: 42, color: '#18181B', alignment: 'center', fieldCategory: 'calculated' }),

  // Subtotal + tax — small underneath
  el({ type: 'price-field', x: 180, y: 616, width: 120, height: 18, content: 'Subtotal:', variable: 'subtotal', fontSize: 10, color: '#A1A1AA', alignment: 'right', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 310, y: 616, width: 120, height: 18, content: 'Impostos:', variable: 'tax', fontSize: 10, color: '#A1A1AA', alignment: 'left', fieldCategory: 'calculated' }),

  el({ type: 'divider', x: 40, y: 610, width: 515, height: 1, content: '', color: '#E4E4E7' }),

  // Observations
  el({ type: 'text', x: 40, y: 630, width: 200, height: 14, content: 'OBSERVAÇÕES', fontSize: 9, fontWeight: '600', color: '#A1A1AA' }),
  el({ type: 'notes', x: 40, y: 650, width: 515, height: 80, content: 'Proposta válida por 15 dias. Pagamento em até 10 dias úteis após aprovação. Valores sujeitos a reajuste após o prazo de validade.', fontSize: 11, color: '#71717A', fieldCategory: 'default' }),

  // Footer
  el({ type: 'divider', x: 40, y: 780, width: 515, height: 1, content: '', color: '#E4E4E7' }),
  el({ type: 'text', x: 40, y: 792, width: 515, height: 18, content: 'Powered by Freelox', fontSize: 12, color: '#D4D4D8', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 2 — DARK (Black background, white text, strong contrast)
// Price in gold accent, stacked vertical layout
// ─────────────────────────────────────────────────────────────────────────────
const darkElements: CanvasElement[] = [
  // Logo
  el({ type: 'logo', x: 40, y: 36, width: 100, height: 36, content: '', imageUrl: '' }),

  // Date
  el({ type: 'dynamic-field', x: 420, y: 44, width: 135, height: 14, content: '', variable: 'data_de_hoje', fontSize: 9, color: '#6B7280', alignment: 'right', fieldCategory: 'default' }),

  // Gold accent line
  el({ type: 'divider', x: 40, y: 86, width: 515, height: 2, content: '', color: '#D4AF37' }),

  // Title — large, light weight
  el({ type: 'text', x: 40, y: 110, width: 515, height: 40, content: 'Proposta de Projeto', fontSize: 32, fontWeight: '300', color: '#F9FAFB' }),
  el({ type: 'divider', x: 40, y: 154, width: 50, height: 3, content: '', color: '#D4AF37' }),

  // Client block — stacked labels
  el({ type: 'text', x: 40, y: 180, width: 100, height: 14, content: 'CLIENTE', fontSize: 9, fontWeight: '600', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 40, y: 196, width: 250, height: 24, content: '', variable: 'client_name', fontSize: 15, fontWeight: '400', color: '#F3F4F6', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 180, width: 100, height: 14, content: 'PROJETO', fontSize: 9, fontWeight: '600', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 310, y: 196, width: 245, height: 24, content: '', variable: 'event_name', fontSize: 15, fontWeight: '400', color: '#F3F4F6', fieldCategory: 'input' }),

  el({ type: 'text', x: 40, y: 234, width: 100, height: 14, content: 'ENDEREÇO', fontSize: 9, fontWeight: '600', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 40, y: 250, width: 250, height: 22, content: '', variable: 'location', fontSize: 13, fontWeight: '400', color: '#D1D5DB', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 234, width: 100, height: 14, content: 'DATA', fontSize: 9, fontWeight: '600', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 310, y: 250, width: 245, height: 22, content: '', variable: 'event_date', fontSize: 13, fontWeight: '400', color: '#D1D5DB', fieldCategory: 'input' }),

  el({ type: 'divider', x: 40, y: 290, width: 515, height: 1, content: '', color: '#374151' }),

  // Service section
  el({ type: 'text', x: 40, y: 310, width: 200, height: 14, content: 'SERVIÇO', fontSize: 9, fontWeight: '600', color: '#D4AF37' }),
  el({ type: 'dynamic-field', x: 40, y: 328, width: 515, height: 24, content: '', variable: 'service_name', fontSize: 16, fontWeight: '400', color: '#F3F4F6', fieldCategory: 'default' }),

  // Description
  el({ type: 'text', x: 40, y: 368, width: 515, height: 80, content: 'Desenvolvimento completo do projeto conforme especificações acordadas. Inclui todas as etapas de planejamento, execução e acompanhamento. Suporte técnico durante todo o período de execução.', fontSize: 12, color: '#9CA3AF' }),

  // Price input
  el({ type: 'divider', x: 40, y: 472, width: 515, height: 1, content: '', color: '#374151' }),

  el({ type: 'text', x: 40, y: 490, width: 200, height: 14, content: 'VALOR', fontSize: 9, fontWeight: '600', color: '#D4AF37' }),
  el({ type: 'price-field', x: 40, y: 506, width: 250, height: 24, content: '', variable: 'price', fontSize: 16, fontWeight: '400', color: '#F3F4F6', fieldCategory: 'input' }),

  // Total highlight
  el({ type: 'text', x: 40, y: 546, width: 515, height: 14, content: 'INVESTIMENTO', fontSize: 9, fontWeight: '600', color: '#D4AF37', alignment: 'center' }),

  el({ type: 'total-calculation', x: 40, y: 568, width: 515, height: 48, content: '', variable: 'total', fontWeight: '300', fontSize: 40, color: '#D4AF37', alignment: 'center', fieldCategory: 'calculated' }),

  el({ type: 'price-field', x: 160, y: 626, width: 140, height: 18, content: 'Subtotal:', variable: 'subtotal', fontSize: 10, color: '#6B7280', alignment: 'right', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 310, y: 626, width: 140, height: 18, content: 'Impostos:', variable: 'tax', fontSize: 10, color: '#6B7280', alignment: 'left', fieldCategory: 'calculated' }),

  el({ type: 'divider', x: 40, y: 614, width: 515, height: 1, content: '', color: '#374151' }),

  // Notes
  el({ type: 'text', x: 40, y: 636, width: 200, height: 14, content: 'CONDIÇÕES', fontSize: 9, fontWeight: '600', color: '#D4AF37' }),
  el({ type: 'notes', x: 40, y: 656, width: 515, height: 72, content: 'Proposta válida por 10 dias. Pagamento: 30% na aprovação, 40% na entrega do projeto e 30% na conclusão. Materiais faturados separadamente.', fontSize: 10, color: '#9CA3AF', fieldCategory: 'default' }),

  // Footer
  el({ type: 'divider', x: 40, y: 778, width: 515, height: 1, content: '', color: '#374151' }),
  el({ type: 'text', x: 40, y: 790, width: 515, height: 18, content: 'Powered by Freelox', fontSize: 12, color: '#4B5563', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 3 — COLORFUL (Color blocks, creative layout)
// Left color band, asymmetric sections
// ─────────────────────────────────────────────────────────────────────────────
const colorfulElements: CanvasElement[] = [
  // Top color band
  el({ type: 'text', x: 0, y: 0, width: 595, height: 8, content: '', fontSize: 1, color: '#7C3AED' }),

  // Logo
  el({ type: 'logo', x: 40, y: 28, width: 100, height: 36, content: '', imageUrl: '' }),

  // Date
  el({ type: 'dynamic-field', x: 420, y: 36, width: 135, height: 14, content: '', variable: 'data_de_hoje', fontSize: 9, color: '#A78BFA', alignment: 'right', fieldCategory: 'default' }),

  // Big title — split color
  el({ type: 'text', x: 40, y: 84, width: 515, height: 44, content: 'PROPOSTA', fontSize: 44, fontWeight: '900', color: '#1E1B4B' }),
  el({ type: 'text', x: 40, y: 126, width: 515, height: 30, content: 'CRIATIVA', fontSize: 44, fontWeight: '900', color: '#7C3AED' }),

  // Accent bar
  el({ type: 'divider', x: 40, y: 168, width: 80, height: 4, content: '', color: '#7C3AED' }),

  // Client — two column with colored labels
  el({ type: 'text', x: 40, y: 190, width: 80, height: 14, content: '● PARA', fontSize: 9, fontWeight: '700', color: '#7C3AED' }),
  el({ type: 'dynamic-field', x: 40, y: 206, width: 250, height: 24, content: '', variable: 'client_name', fontSize: 15, fontWeight: '600', color: '#1E1B4B', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 190, width: 80, height: 14, content: '● PROJETO', fontSize: 9, fontWeight: '700', color: '#7C3AED' }),
  el({ type: 'dynamic-field', x: 310, y: 206, width: 245, height: 24, content: '', variable: 'event_name', fontSize: 15, fontWeight: '400', color: '#1E1B4B', fieldCategory: 'input' }),

  el({ type: 'text', x: 40, y: 244, width: 80, height: 14, content: '● LOCAL', fontSize: 9, fontWeight: '700', color: '#7C3AED' }),
  el({ type: 'dynamic-field', x: 40, y: 260, width: 250, height: 22, content: '', variable: 'location', fontSize: 13, fontWeight: '400', color: '#334155', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 244, width: 80, height: 14, content: '● DATA', fontSize: 9, fontWeight: '700', color: '#7C3AED' }),
  el({ type: 'dynamic-field', x: 310, y: 260, width: 245, height: 22, content: '', variable: 'event_date', fontSize: 13, fontWeight: '400', color: '#334155', fieldCategory: 'input' }),

  // Service block
  el({ type: 'divider', x: 40, y: 300, width: 515, height: 2, content: '', color: '#EDE9FE' }),

  el({ type: 'text', x: 40, y: 318, width: 200, height: 14, content: '● O QUE VAMOS FAZER', fontSize: 10, fontWeight: '800', color: '#7C3AED' }),

  el({ type: 'dynamic-field', x: 40, y: 340, width: 515, height: 24, content: '', variable: 'service_name', fontSize: 16, fontWeight: '600', color: '#1E1B4B', fieldCategory: 'default' }),

  el({ type: 'text', x: 40, y: 380, width: 515, height: 80, content: 'Criação completa de identidade visual, estratégia de marca e materiais de comunicação. Entregas em alta qualidade com revisões ilimitadas durante cada fase do projeto. Suporte criativo contínuo.', fontSize: 12, color: '#475569' }),

  // Price input
  el({ type: 'divider', x: 40, y: 480, width: 515, height: 3, content: '', color: '#7C3AED' }),

  el({ type: 'text', x: 40, y: 500, width: 200, height: 14, content: '● VALOR', fontSize: 10, fontWeight: '800', color: '#7C3AED' }),
  el({ type: 'price-field', x: 40, y: 518, width: 250, height: 24, content: '', variable: 'price', fontSize: 16, fontWeight: '600', color: '#1E1B4B', fieldCategory: 'input' }),

  // Total
  el({ type: 'text', x: 40, y: 556, width: 200, height: 14, content: '● INVESTIMENTO', fontSize: 10, fontWeight: '800', color: '#7C3AED' }),

  el({ type: 'total-calculation', x: 40, y: 576, width: 515, height: 48, content: '', variable: 'total', fontWeight: '900', fontSize: 42, color: '#1E1B4B', alignment: 'left', fieldCategory: 'calculated' }),

  el({ type: 'price-field', x: 40, y: 632, width: 160, height: 18, content: 'Subtotal:', variable: 'subtotal', fontSize: 10, color: '#A78BFA', fieldCategory: 'calculated' }),

  el({ type: 'divider', x: 40, y: 618, width: 515, height: 2, content: '', color: '#EDE9FE' }),

  // Notes
  el({ type: 'notes', x: 40, y: 640, width: 515, height: 72, content: 'Prazo estimado: 60 dias a partir da aprovação. Pagamento: 40% de entrada + 3 parcelas de 20%. Revisões ilimitadas incluídas. Arquivos fontes entregues ao final.', fontSize: 10, color: '#64748B', fieldCategory: 'default' }),

  // Footer bar
  el({ type: 'text', x: 0, y: 834, width: 595, height: 8, content: '', fontSize: 1, color: '#7C3AED' }),
  el({ type: 'text', x: 40, y: 798, width: 515, height: 18, content: 'Powered by Freelox', fontSize: 12, color: '#C4B5FD', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 4 — GRADIENT (Soft gradient background, centered layout)
// Calm, premium feel with centered typography
// ─────────────────────────────────────────────────────────────────────────────
const gradientElements: CanvasElement[] = [
  // Logo — centered
  el({ type: 'logo', x: 228, y: 36, width: 140, height: 44, content: '', imageUrl: '' }),

  // Title — centered, elegant
  el({ type: 'text', x: 40, y: 100, width: 515, height: 34, content: 'Proposta de Serviços', fontSize: 28, fontWeight: '600', color: '#0F172A', alignment: 'center' }),
  el({ type: 'divider', x: 258, y: 140, width: 80, height: 2, content: '', color: '#0EA5E9' }),

  // Date centered
  el({ type: 'dynamic-field', x: 40, y: 152, width: 515, height: 14, content: '', variable: 'data_de_hoje', fontSize: 9, color: '#64748B', alignment: 'center', fieldCategory: 'default' }),

  // Client info — centered cards style
  el({ type: 'text', x: 60, y: 190, width: 220, height: 14, content: 'CLIENTE', fontSize: 9, fontWeight: '600', color: '#0EA5E9', alignment: 'center' }),
  el({ type: 'dynamic-field', x: 60, y: 206, width: 220, height: 24, content: '', variable: 'client_name', fontSize: 15, fontWeight: '500', color: '#0F172A', alignment: 'center', fieldCategory: 'input' }),

  el({ type: 'text', x: 315, y: 190, width: 220, height: 14, content: 'EVENTO', fontSize: 9, fontWeight: '600', color: '#0EA5E9', alignment: 'center' }),
  el({ type: 'dynamic-field', x: 315, y: 206, width: 220, height: 24, content: '', variable: 'event_name', fontSize: 15, fontWeight: '400', color: '#0F172A', alignment: 'center', fieldCategory: 'input' }),

  el({ type: 'text', x: 60, y: 248, width: 220, height: 14, content: 'LOCAL', fontSize: 9, fontWeight: '600', color: '#0EA5E9', alignment: 'center' }),
  el({ type: 'dynamic-field', x: 60, y: 264, width: 220, height: 22, content: '', variable: 'location', fontSize: 13, fontWeight: '400', color: '#334155', alignment: 'center', fieldCategory: 'input' }),

  el({ type: 'text', x: 315, y: 248, width: 220, height: 14, content: 'DATA', fontSize: 9, fontWeight: '600', color: '#0EA5E9', alignment: 'center' }),
  el({ type: 'dynamic-field', x: 315, y: 264, width: 220, height: 22, content: '', variable: 'event_date', fontSize: 13, fontWeight: '400', color: '#334155', alignment: 'center', fieldCategory: 'input' }),

  // Divider
  el({ type: 'divider', x: 60, y: 306, width: 475, height: 1, content: '', color: '#E0F2FE' }),

  // Service
  el({ type: 'text', x: 40, y: 326, width: 515, height: 14, content: 'SERVIÇO', fontSize: 9, fontWeight: '600', color: '#0EA5E9', alignment: 'center' }),
  el({ type: 'dynamic-field', x: 40, y: 344, width: 515, height: 26, content: '', variable: 'service_name', fontSize: 17, fontWeight: '500', color: '#0F172A', alignment: 'center', fieldCategory: 'default' }),

  // Description
  el({ type: 'text', x: 60, y: 386, width: 475, height: 80, content: 'Solução completa para seu projeto, incluindo análise de requisitos, desenvolvimento, testes e implantação. Acompanhamento contínuo durante toda a execução com relatórios de progresso semanais.', fontSize: 12, color: '#475569', alignment: 'center' }),

  // Price input
  el({ type: 'divider', x: 60, y: 486, width: 475, height: 1, content: '', color: '#E0F2FE' }),

  el({ type: 'text', x: 40, y: 504, width: 515, height: 14, content: 'VALOR', fontSize: 9, fontWeight: '600', color: '#0EA5E9', alignment: 'center' }),
  el({ type: 'price-field', x: 168, y: 520, width: 260, height: 24, content: '', variable: 'price', fontSize: 16, fontWeight: '500', color: '#0F172A', alignment: 'center', fieldCategory: 'input' }),

  // Total
  el({ type: 'total-calculation', x: 40, y: 560, width: 515, height: 50, content: '', variable: 'total', fontWeight: '600', fontSize: 40, color: '#0EA5E9', alignment: 'center', fieldCategory: 'calculated' }),

  el({ type: 'price-field', x: 140, y: 620, width: 150, height: 18, content: 'Subtotal:', variable: 'subtotal', fontSize: 10, color: '#94A3B8', alignment: 'right', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 310, y: 620, width: 150, height: 18, content: 'Impostos:', variable: 'tax', fontSize: 10, color: '#94A3B8', alignment: 'left', fieldCategory: 'calculated' }),

  el({ type: 'divider', x: 60, y: 604, width: 475, height: 1, content: '', color: '#E0F2FE' }),

  // Notes
  el({ type: 'notes', x: 60, y: 626, width: 475, height: 80, content: 'Proposta válida por 30 dias. Forma de pagamento: 50% na aprovação e 50% na entrega. Inclui garantia de 90 dias. Hospedagem e domínio não inclusos.', fontSize: 11, color: '#64748B', alignment: 'center', fieldCategory: 'default' }),

  // Footer
  el({ type: 'text', x: 40, y: 788, width: 515, height: 18, content: 'Powered by Freelox', fontSize: 12, color: '#BAE6FD', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE 5 — CORPORATE (White, structured, professional)
// Traditional left-aligned with clear section headers and boxed sections
// ─────────────────────────────────────────────────────────────────────────────
const corporateElements: CanvasElement[] = [
  // Logo
  el({ type: 'logo', x: 40, y: 32, width: 140, height: 44, content: '', imageUrl: '' }),

  // Document label — right
  el({ type: 'text', x: 380, y: 32, width: 175, height: 28, content: 'PROPOSTA', fontSize: 20, fontWeight: '700', color: '#1E3A5F', alignment: 'right' }),
  el({ type: 'dynamic-field', x: 380, y: 60, width: 175, height: 14, content: '', variable: 'data_de_hoje', fontSize: 9, color: '#94A3B8', alignment: 'right', fieldCategory: 'default' }),

  // Blue accent lines
  el({ type: 'divider', x: 40, y: 86, width: 515, height: 3, content: '', color: '#1E3A5F' }),
  el({ type: 'divider', x: 40, y: 91, width: 515, height: 1, content: '', color: '#CBD5E1' }),

  // Section: Client
  el({ type: 'text', x: 40, y: 110, width: 200, height: 16, content: 'DADOS DO CLIENTE', fontSize: 10, fontWeight: '700', color: '#1E3A5F' }),

  el({ type: 'text', x: 40, y: 132, width: 80, height: 12, content: 'Nome', fontSize: 9, fontWeight: '500', color: '#64748B' }),
  el({ type: 'dynamic-field', x: 40, y: 146, width: 250, height: 22, content: '', variable: 'client_name', fontSize: 14, fontWeight: '500', color: '#0F172A', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 132, width: 80, height: 12, content: 'Evento', fontSize: 9, fontWeight: '500', color: '#64748B' }),
  el({ type: 'dynamic-field', x: 310, y: 146, width: 245, height: 22, content: '', variable: 'event_name', fontSize: 14, fontWeight: '400', color: '#0F172A', fieldCategory: 'input' }),

  el({ type: 'text', x: 40, y: 178, width: 80, height: 12, content: 'Local', fontSize: 9, fontWeight: '500', color: '#64748B' }),
  el({ type: 'dynamic-field', x: 40, y: 192, width: 250, height: 22, content: '', variable: 'location', fontSize: 13, fontWeight: '400', color: '#334155', fieldCategory: 'input' }),

  el({ type: 'text', x: 310, y: 178, width: 80, height: 12, content: 'Data do Evento', fontSize: 9, fontWeight: '500', color: '#64748B' }),
  el({ type: 'dynamic-field', x: 310, y: 192, width: 245, height: 22, content: '', variable: 'event_date', fontSize: 13, fontWeight: '400', color: '#334155', fieldCategory: 'input' }),

  el({ type: 'divider', x: 40, y: 228, width: 515, height: 1, content: '', color: '#CBD5E1' }),

  // Section: Scope
  el({ type: 'text', x: 40, y: 244, width: 200, height: 16, content: 'DESCRIÇÃO DOS SERVIÇOS', fontSize: 10, fontWeight: '700', color: '#1E3A5F' }),

  el({ type: 'dynamic-field', x: 40, y: 268, width: 515, height: 24, content: '', variable: 'service_name', fontSize: 15, fontWeight: '500', color: '#0F172A', fieldCategory: 'default' }),

  el({ type: 'text', x: 40, y: 304, width: 515, height: 80, content: 'Apresentamos a proposta técnica e comercial para execução dos serviços conforme escopo definido em reunião. O projeto contempla todas as etapas necessárias para entrega completa e satisfatória.', fontSize: 11, color: '#475569' }),

  // Divider
  el({ type: 'divider', x: 40, y: 400, width: 515, height: 1, content: '', color: '#CBD5E1' }),

  // Section: Values
  el({ type: 'text', x: 40, y: 418, width: 200, height: 16, content: 'VALORES', fontSize: 10, fontWeight: '700', color: '#1E3A5F' }),

  // Price input
  el({ type: 'text', x: 40, y: 444, width: 80, height: 12, content: 'Valor', fontSize: 9, fontWeight: '500', color: '#64748B' }),
  el({ type: 'price-field', x: 40, y: 458, width: 250, height: 22, content: '', variable: 'price', fontSize: 14, fontWeight: '500', color: '#0F172A', fieldCategory: 'input' }),

  // Price breakdown — right aligned in a clean block
  el({ type: 'price-field', x: 340, y: 448, width: 215, height: 22, content: 'Subtotal:', variable: 'subtotal', fontSize: 13, color: '#475569', fieldCategory: 'calculated' }),
  el({ type: 'price-field', x: 340, y: 476, width: 215, height: 22, content: 'Impostos (5%):', variable: 'tax', fontSize: 13, color: '#475569', fieldCategory: 'calculated' }),
  el({ type: 'divider', x: 340, y: 506, width: 215, height: 2, content: '', color: '#1E3A5F' }),
  el({ type: 'total-calculation', x: 340, y: 516, width: 215, height: 30, content: 'Valor Total:', variable: 'total', fontWeight: '700', fontSize: 18, color: '#1E3A5F', fieldCategory: 'calculated' }),

  el({ type: 'divider', x: 40, y: 564, width: 515, height: 1, content: '', color: '#CBD5E1' }),

  // Section: Conditions
  el({ type: 'text', x: 40, y: 582, width: 200, height: 16, content: 'CONDIÇÕES GERAIS', fontSize: 10, fontWeight: '700', color: '#1E3A5F' }),
  el({ type: 'notes', x: 40, y: 604, width: 515, height: 80, content: 'Prazo de execução conforme cronograma definido após aprovação. Pagamento: 30/30/40 (aprovação, medição intermediária, entrega final). Proposta válida por 20 dias. Reajuste previsto após 90 dias.', fontSize: 10, color: '#475569', fieldCategory: 'default' }),

  // Signature area
  el({ type: 'divider', x: 40, y: 710, width: 200, height: 1, content: '', color: '#94A3B8' }),
  el({ type: 'text', x: 40, y: 718, width: 200, height: 14, content: 'Assinatura do Responsável', fontSize: 9, color: '#94A3B8', alignment: 'center' }),

  el({ type: 'divider', x: 340, y: 710, width: 215, height: 1, content: '', color: '#94A3B8' }),
  el({ type: 'text', x: 340, y: 718, width: 215, height: 14, content: 'Assinatura do Cliente', fontSize: 9, color: '#94A3B8', alignment: 'center' }),

  // Footer
  el({ type: 'divider', x: 40, y: 778, width: 515, height: 1, content: '', color: '#CBD5E1' }),
  el({ type: 'text', x: 40, y: 790, width: 515, height: 18, content: 'Powered by Freelox', fontSize: 12, color: '#94A3B8', alignment: 'center' }),
];

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────────────────────────────────────
export const starterTemplates: Template[] = [
  makeTemplate('template-minimal', 'Minimal', 'Geral', 'Layout limpo com preço em destaque centralizado, tipografia leve e espaçamento generoso.', minimalElements, allVars, {
    defaultValues: { tax_rate: '0.10' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date', 'price'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true },
    color: '#71717A',
  }),

  makeTemplate('template-dark', 'Dark', 'Premium', 'Fundo escuro com detalhes dourados e tipografia elegante. Para projetos sofisticados.', darkElements, allVars, {
    defaultValues: { tax_rate: '0.05' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date', 'price'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.05, showTax: true, backgroundColor: '#111827' },
    color: '#D4AF37',
  }),

  makeTemplate('template-colorful', 'Criativo', 'Agência', 'Design ousado com cores vibrantes, tipografia expressiva e layout assimétrico.', colorfulElements, allVars, {
    defaultValues: { tax_rate: '0' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date', 'price'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false },
    color: '#7C3AED',
  }),

  makeTemplate('template-gradient', 'Elegante', 'Tecnologia', 'Layout centralizado e limpo com tons de azul. Ideal para empresas de tecnologia e serviços digitais.', gradientElements, allVars, {
    defaultValues: { tax_rate: '0.10' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date', 'price'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true },
    color: '#0EA5E9',
  }),

  makeTemplate('template-corporate', 'Corporativo', 'Corporativo', 'Template profissional com seções estruturadas, área de assinatura e diagramação formal.', corporateElements, allVars, {
    defaultValues: { tax_rate: '0.05' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date', 'price'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.05, showTax: true },
    color: '#1E3A5F',
  }),
];
