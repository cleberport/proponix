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
  }
): Template {
  return {
    id,
    name,
    category,
    description,
    thumbnail: '',
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
  makeTemplate('corporate-budget', 'Orçamento Corporativo', 'Corporativo', 'Template profissional para orçamentos corporativos com layout estruturado', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'ORÇAMENTO', fontSize: 28, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 30, content: 'Cliente:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 30, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 150, width: 250, height: 25, content: '', variable: 'data_de_hoje', fontSize: 11, color: '#64748B', fieldCategory: 'default' }),
    el({ type: 'table', x: 40, y: 190, width: 515, height: 200, content: '', rows: [
      { cells: ['Item', 'Descrição', 'Valor'] },
      { cells: ['{{service_name}}', '', '{{price}}'] },
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
    settings: { taxRate: 0.10, showTax: true },
  }),

  makeTemplate('event-production', 'Produção de Eventos', 'Eventos', 'Orçamento completo para produção de eventos', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'ORÇAMENTO DE PRODUÇÃO', fontSize: 26, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 30, content: 'Evento:', variable: 'event_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 150, width: 250, height: 30, content: 'Local:', variable: 'location', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 30, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 150, width: 235, height: 30, content: 'Cliente:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 220, content: '', rows: [
      { cells: ['Categoria', 'Item', 'Qtd', 'Valor Unit.', 'Total'] },
      { cells: ['Áudio', '{{service_name}}', '1', '{{price}}', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 480, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
    el({ type: 'notes', x: 40, y: 550, width: 515, height: 100, content: 'Montagem inicia 4 horas antes do evento.', fieldCategory: 'default' }),
  ], [...commonVars, 'event_name', 'location', 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Sistema de Som', price: '3000', tax_rate: '0.10' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true },
  }),

  makeTemplate('freelancer-quote', 'Orçamento Freelancer', 'Freelance', 'Template limpo e moderno para freelancers', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 40, content: 'ORÇAMENTO', fontSize: 32, fontWeight: '700', fontFamily: 'Roboto' }),
    el({ type: 'dynamic-field', x: 40, y: 100, width: 300, height: 30, content: 'Para:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 135, width: 300, height: 30, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'divider', x: 40, y: 180, width: 515, height: 2, content: '' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 180, content: '', rows: [
      { cells: ['Serviço', 'Valor'] },
      { cells: ['{{service_name}}', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 420, width: 205, height: 35, content: 'Total:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
    el({ type: 'notes', x: 40, y: 490, width: 515, height: 80, content: 'Este orçamento é válido por 30 dias.', fieldCategory: 'default' }),
  ], [...commonVars, 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Desenvolvimento Web', price: '2500', tax_rate: '0' },
    inputFields: ['client_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false },
  }),

  makeTemplate('creative-proposal', 'Proposta Criativa', 'Criativo', 'Template ousado para projetos criativos', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 50, content: 'PROPOSTA CRIATIVA', fontSize: 30, fontWeight: '700', alignment: 'center', fontFamily: 'Merriweather' }),
    el({ type: 'divider', x: 150, y: 100, width: 295, height: 3, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 130, width: 515, height: 30, content: 'Cliente:', variable: 'client_name', alignment: 'center', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 165, width: 515, height: 30, content: 'Projeto:', variable: 'event_name', alignment: 'center', fieldCategory: 'input' }),
    el({ type: 'text', x: 40, y: 220, width: 515, height: 25, content: 'ESCOPO DO TRABALHO', fontSize: 16, fontWeight: '600' }),
    el({ type: 'table', x: 40, y: 255, width: 515, height: 180, content: '', rows: [
      { cells: ['Fase', 'Entrega', 'Prazo', 'Valor'] },
      { cells: ['Descoberta', '{{service_name}}', '', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 470, width: 205, height: 35, content: 'Investimento:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
  ], [...commonVars, 'event_name', 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Estratégia de Marca & Design', price: '8000', tax_rate: '0' },
    inputFields: ['client_name', 'event_name'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false },
  }),

  makeTemplate('simple-estimate', 'Estimativa Simples', 'Geral', 'Template direto com layout mínimo', [
    el({ type: 'text', x: 40, y: 40, width: 300, height: 40, content: 'ESTIMATIVA', fontSize: 28, fontWeight: '700' }),
    el({ type: 'dynamic-field', x: 40, y: 100, width: 250, height: 25, content: 'Para:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 350, y: 100, width: 205, height: 25, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'divider', x: 40, y: 140, width: 515, height: 1, content: '' }),
    el({ type: 'table', x: 40, y: 160, width: 515, height: 200, content: '', rows: [
      { cells: ['Descrição', 'Valor'] },
      { cells: ['{{service_name}}', '{{price}}'] },
    ]}),
    el({ type: 'price-field', x: 350, y: 390, width: 205, height: 28, content: 'Subtotal:', variable: 'subtotal', fieldCategory: 'calculated' }),
    el({ type: 'price-field', x: 350, y: 422, width: 205, height: 28, content: 'Imposto:', variable: 'tax', fieldCategory: 'calculated' }),
    el({ type: 'total-calculation', x: 350, y: 458, width: 205, height: 32, content: 'Total:', variable: 'total', fontWeight: '700', fieldCategory: 'calculated' }),
  ], [...commonVars, 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Serviços Gerais', price: '1500', tax_rate: '0.08' },
    inputFields: ['client_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.08, showTax: true },
  }),

  makeTemplate('premium-proposal', 'Proposta Premium', 'Corporativo', 'Template elegante com tipografia serifada', [
    el({ type: 'text', x: 40, y: 60, width: 515, height: 55, content: 'Proposta Premium', fontSize: 34, fontWeight: '700', fontFamily: 'Merriweather', alignment: 'center' }),
    el({ type: 'divider', x: 180, y: 125, width: 235, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 160, width: 515, height: 30, content: 'Preparado exclusivamente para', variable: 'client_name', alignment: 'center', fontFamily: 'Merriweather', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 200, width: 515, height: 30, content: 'Data:', variable: 'event_date', alignment: 'center', fieldCategory: 'input' }),
    el({ type: 'text', x: 40, y: 260, width: 515, height: 25, content: 'RESUMO EXECUTIVO', fontSize: 14, fontWeight: '600' }),
    el({ type: 'text', x: 40, y: 290, width: 515, height: 60, content: 'Temos o prazer de apresentar esta proposta para sua apreciação. Nossa equipe traz expertise excepcional e dedicação a cada projeto.' }),
    el({ type: 'table', x: 40, y: 370, width: 515, height: 160, content: '', rows: [
      { cells: ['Serviço', 'Descrição', 'Investimento'] },
      { cells: ['{{service_name}}', '', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 560, width: 205, height: 35, content: 'Investimento Total:', variable: 'total', fontWeight: '700', fontSize: 18, fontFamily: 'Merriweather', fieldCategory: 'calculated' }),
  ], [...commonVars, 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Consultoria Estratégica', price: '15000', tax_rate: '0' },
    inputFields: ['client_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false },
  }),

  makeTemplate('dj-services', 'Serviços de DJ', 'Entretenimento', 'Template para orçamento de serviços de DJ e música', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: '🎵 ORÇAMENTO DJ', fontSize: 26, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 28, content: 'Cliente:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 148, width: 250, height: 28, content: 'Evento:', variable: 'event_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 28, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 320, y: 148, width: 235, height: 28, content: 'Local:', variable: 'location', fieldCategory: 'input' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 200, content: '', rows: [
      { cells: ['Serviço', 'Duração', 'Valor'] },
      { cells: ['{{service_name}}', '4 horas', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 440, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
    el({ type: 'notes', x: 40, y: 510, width: 515, height: 90, content: 'Inclui montagem, passagem de som e desmontagem.\nTaxa de deslocamento pode ser aplicada para locais acima de 80 km.', fieldCategory: 'default' }),
  ], [...commonVars, 'event_name', 'location', 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Pacote DJ Performance', price: '1200', tax_rate: '0.08' },
    inputFields: ['client_name', 'event_name', 'location', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.08, showTax: true },
  }),

  makeTemplate('production-services', 'Serviços de Produção', 'Produção', 'Template para orçamentos de produção audiovisual', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'SERVIÇOS DE PRODUÇÃO', fontSize: 26, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 300, height: 28, content: 'Cliente:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 148, width: 300, height: 28, content: 'Projeto:', variable: 'event_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 370, y: 115, width: 185, height: 28, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'text', x: 40, y: 195, width: 515, height: 22, content: 'PRÉ-PRODUÇÃO', fontSize: 14, fontWeight: '600' }),
    el({ type: 'table', x: 40, y: 225, width: 515, height: 100, content: '', rows: [
      { cells: ['Tarefa', 'Dias', 'Diária', 'Total'] },
      { cells: ['Planejamento & Roteiro', '2', '{{price}}', ''] },
    ]}),
    el({ type: 'text', x: 40, y: 345, width: 515, height: 22, content: 'PRODUÇÃO', fontSize: 14, fontWeight: '600' }),
    el({ type: 'table', x: 40, y: 375, width: 515, height: 100, content: '', rows: [
      { cells: ['Tarefa', 'Dias', 'Diária', 'Total'] },
      { cells: ['{{service_name}}', '3', '{{price}}', ''] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 510, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
  ], [...commonVars, 'event_name', 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Produção de Vídeo', price: '2000', tax_rate: '0.05' },
    inputFields: ['client_name', 'event_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.05, showTax: true },
  }),

  makeTemplate('agency-quote', 'Orçamento Agência', 'Agência', 'Orçamento profissional de agência com layout moderno', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 40, content: 'ORÇAMENTO', fontSize: 28, fontWeight: '700' }),
    el({ type: 'text', x: 40, y: 80, width: 515, height: 20, content: 'Seu Parceiro Criativo', fontSize: 12, fontWeight: '400', color: '#64748B' }),
    el({ type: 'divider', x: 40, y: 110, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 130, width: 300, height: 28, content: 'Cliente:', variable: 'client_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 40, y: 163, width: 300, height: 28, content: 'Projeto:', variable: 'event_name', fieldCategory: 'input' }),
    el({ type: 'dynamic-field', x: 370, y: 130, width: 185, height: 28, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'table', x: 40, y: 215, width: 515, height: 200, content: '', rows: [
      { cells: ['Fase', 'Escopo', 'Equipe', 'Valor'] },
      { cells: ['Estratégia', '{{service_name}}', '2', '{{price}}'] },
    ]}),
    el({ type: 'price-field', x: 350, y: 445, width: 205, height: 28, content: 'Subtotal:', variable: 'subtotal', fieldCategory: 'calculated' }),
    el({ type: 'price-field', x: 350, y: 478, width: 205, height: 28, content: 'Imposto:', variable: 'tax', fieldCategory: 'calculated' }),
    el({ type: 'total-calculation', x: 350, y: 515, width: 205, height: 35, content: 'Total:', variable: 'total', fontWeight: '700', fontSize: 18, fieldCategory: 'calculated' }),
    el({ type: 'notes', x: 40, y: 580, width: 515, height: 80, content: '50% de entrada para iniciar.\nSaldo na entrega do projeto.', fieldCategory: 'default' }),
  ], [...commonVars, 'event_name', 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Estratégia de Marca', price: '12000', tax_rate: '0.10' },
    inputFields: ['client_name', 'event_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0.10, showTax: true },
  }),

  makeTemplate('minimal-invoice', 'Fatura Minimalista', 'Geral', 'Template de fatura ultra-limpo com design mínimo', [
    el({ type: 'text', x: 40, y: 50, width: 200, height: 40, content: 'FATURA', fontSize: 32, fontWeight: '300' }),
    el({ type: 'dynamic-field', x: 350, y: 50, width: 205, height: 25, content: 'Data:', variable: 'event_date', fieldCategory: 'input' }),
    el({ type: 'divider', x: 40, y: 100, width: 515, height: 1, content: '' }),
    el({ type: 'text', x: 40, y: 120, width: 100, height: 20, content: 'PARA', fontSize: 10, fontWeight: '600', color: '#64748B' }),
    el({ type: 'dynamic-field', x: 40, y: 142, width: 300, height: 28, content: '', variable: 'client_name', fontSize: 16, fieldCategory: 'input' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 180, content: '', rows: [
      { cells: ['Descrição', 'Valor'] },
      { cells: ['{{service_name}}', '{{price}}'] },
    ]}),
    el({ type: 'divider', x: 40, y: 400, width: 515, height: 1, content: '' }),
    el({ type: 'total-calculation', x: 350, y: 420, width: 205, height: 30, content: 'Total:', variable: 'total', fontWeight: '600', fontSize: 16, fieldCategory: 'calculated' }),
  ], [...commonVars, 'service_name', 'price', 'tax_rate'], {
    defaultValues: { service_name: 'Serviço', price: '1000', tax_rate: '0' },
    inputFields: ['client_name', 'event_date'],
    calculatedFields: { subtotal: 'price', tax: 'price * tax_rate', total: 'price + tax' },
    settings: { taxRate: 0, showTax: false },
  }),
];
