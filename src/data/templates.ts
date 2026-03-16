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
    settings?: { taxRate: number; showTax: boolean };
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

const commonVars = ['client_name', 'event_date', 'subtotal', 'tax', 'total'];

export const starterTemplates: Template[] = [
  makeTemplate('corporate-budget', 'Proposta Corporativa', 'Corporativo', 'Template profissional para propostas corporativas com layout estruturado', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'PROPOSTA', fontSize: 28, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 30, content: 'Cliente:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 30, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 150, width: 250, height: 25, content: '', variable: 'data_de_hoje', fontSize: 11, color: '#64748B', fieldCategory: 'default' }),
    el({ type: 'table', x: 40, y: 190, width: 515, height: 200, content: '', rows: [
      { cells: ['Item', 'Descrição', 'Valor'] },
      { cells: ['', '', ''] },
    ]}),
    el({ type: 'divider', x: 40, y: 420, width: 515, height: 2, content: '' }),
    el({ type: 'price-field', x: 350, y: 440, width: 205, height: 30, content: 'Subtotal:', variable: 'subtotal', fieldCategory: 'calculated' }),
    el({ type: 'price-field', x: 350, y: 475, width: 205, height: 30, content: 'Imposto:', variable: 'tax', fieldCategory: 'calculated' }),
    el({ type: 'total-calculation', x: 350, y: 510, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
    el({ type: 'notes', x: 40, y: 570, width: 515, height: 100, content: 'Observações: Pagamento em até 30 dias.', fieldCategory: 'default' }),
  ], [...commonVars, 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Consultoria', price: '5000', tax_rate: '0.10' },
    inputFields: ['client_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true }, color: '#6366F1',
  }),

  makeTemplate('event-production', 'Produção de Eventos', 'Eventos', 'Proposta completa para produção de eventos', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'PROPOSTA DE PRODUÇÃO', fontSize: 26, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 30, content: 'Evento:', variable: 'event_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 150, width: 250, height: 30, content: 'Local:', variable: 'location', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 30, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 150, width: 235, height: 30, content: 'Cliente:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 220, content: '', rows: [
      { cells: ['Categoria', 'Item', 'Qtd', 'Valor Unit.', 'Total'] },
      { cells: ['', '', '', '', ''] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 480, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
    el({ type: 'notes', x: 40, y: 550, width: 515, height: 100, content: 'Montagem inicia 4 horas antes do evento.', fieldCategory: 'default' }),
  ], [...commonVars, 'event_name', 'location', 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Sistema de Som', price: '3000', tax_rate: '0.10' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true }, color: '#F59E0B',
  }),

  makeTemplate('freelancer-quote', 'Orçamento Freelancer', 'Freelance', 'Template limpo e moderno para freelancers', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 40, content: 'ORÇAMENTO', fontSize: 32, fontWeight: '700', fontFamily: 'Roboto' }),
    el({ type: 'dynamic-field', x: 40, y: 100, width: 300, height: 30, content: 'Para:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 135, width: 300, height: 30, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'divider', x: 40, y: 180, width: 515, height: 2, content: '' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 180, content: '', rows: [
      { cells: ['Serviço', 'Valor'] },
      { cells: ['', ''] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 420, width: 205, height: 35, content: 'Total:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
    el({ type: 'notes', x: 40, y: 490, width: 515, height: 80, content: 'Este orçamento é válido por 30 dias.', fieldCategory: 'default' }),
  ], [...commonVars, 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Desenvolvimento Web', price: '2500', tax_rate: '0' },
    inputFields: ['client_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false }, color: '#10B981',
  }),

  makeTemplate('creative-proposal', 'Proposta Criativa', 'Criativo', 'Template ousado para projetos criativos', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 50, content: 'PROPOSTA CRIATIVA', fontSize: 30, fontWeight: '700', alignment: 'center', fontFamily: 'Merriweather' }),
    el({ type: 'divider', x: 150, y: 100, width: 295, height: 3, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 130, width: 515, height: 30, content: 'Cliente:', variable: 'client_name', alignment: 'center', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 165, width: 515, height: 30, content: 'Projeto:', variable: 'event_name', alignment: 'center', fieldCategory: 'input' }),
    el({ type: 'text', x: 40, y: 220, width: 515, height: 25, content: 'ESCOPO DO TRABALHO', fontSize: 16, fontWeight: '600' }),
    el({ type: 'table', x: 40, y: 255, width: 515, height: 180, content: '', rows: [
      { cells: ['Fase', 'Entrega', 'Prazo', 'Valor'] },
      { cells: ['', '', '', ''] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 470, width: 205, height: 35, content: 'Investimento:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
  ], [...commonVars, 'event_name', 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Estratégia de Marca & Design', price: '8000', tax_rate: '0' },
    inputFields: ['client_name', 'event_name'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false }, color: '#EC4899',
  }),

  makeTemplate('simple-estimate', 'Estimativa Simples', 'Geral', 'Template direto com layout mínimo', [
    el({ type: 'text', x: 40, y: 40, width: 300, height: 40, content: 'ESTIMATIVA', fontSize: 28, fontWeight: '700' }),
    el({ type: 'dynamic-field', x: 40, y: 100, width: 250, height: 25, content: 'Para:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 350, y: 100, width: 205, height: 25, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'divider', x: 40, y: 140, width: 515, height: 1, content: '' }),
    el({ type: 'table', x: 40, y: 160, width: 515, height: 200, content: '', rows: [
      { cells: ['Descrição', 'Valor'] },
      { cells: ['', ''] },
    ]}),
    el({ type: 'price-field', x: 350, y: 390, width: 205, height: 28, content: 'Subtotal:', variable: 'subtotal', fieldCategory: 'calculated' }),
    el({ type: 'price-field', x: 350, y: 422, width: 205, height: 28, content: 'Imposto:', variable: 'tax', fieldCategory: 'calculated' }),
    el({ type: 'total-calculation', x: 350, y: 458, width: 205, height: 32, content: 'Total:', variable: 'total', fontWeight: '700', fieldCategory: 'calculated' }),
  ], [...commonVars, 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Serviços Gerais', price: '1500', tax_rate: '0.08' },
    inputFields: ['client_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.08, showTax: true }, color: '#3B82F6',
  }),

];
