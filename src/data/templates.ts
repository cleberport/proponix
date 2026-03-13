import { Template, CanvasElement } from '@/types/template';
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
    ...partial,
  };
}

function makeTemplate(
  id: string,
  name: string,
  category: string,
  description: string,
  elements: CanvasElement[],
  variables: string[]
): Template {
  return {
    id,
    name,
    category,
    description,
    thumbnail: '',
    elements,
    variables,
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
  };
}

const commonVars = ['client_name', 'event_date', 'subtotal', 'tax', 'total'];

export const starterTemplates: Template[] = [
  makeTemplate('corporate-budget', 'Corporate Budget', 'Corporate', 'Professional corporate budget template with clean lines and structured layout', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'CORPORATE BUDGET', fontSize: 28, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 30, content: 'Client:', variable: 'client_name' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 30, content: 'Date:', variable: 'event_date' }),
    el({ type: 'table', x: 40, y: 170, width: 515, height: 200, content: 'Budget Items', rows: [
      { cells: ['Item', 'Description', 'Amount'] },
      { cells: ['{{service_name}}', '', '{{price}}'] },
    ]}),
    el({ type: 'divider', x: 40, y: 400, width: 515, height: 2, content: '' }),
    el({ type: 'price-field', x: 350, y: 420, width: 205, height: 30, content: 'Subtotal:', variable: 'subtotal' }),
    el({ type: 'price-field', x: 350, y: 455, width: 205, height: 30, content: 'Tax:', variable: 'tax' }),
    el({ type: 'total-calculation', x: 350, y: 490, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18 }),
    el({ type: 'notes', x: 40, y: 550, width: 515, height: 100, content: 'Notes: Payment terms net 30 days.' }),
  ], [...commonVars, 'service_name', 'price']),

  makeTemplate('event-production', 'Event Production', 'Events', 'Comprehensive event production budget with detailed line items', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'EVENT PRODUCTION BUDGET', fontSize: 26, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 30, content: 'Event:', variable: 'event_name' }),
    el({ type: 'dynamic-field', x: 40, y: 150, width: 250, height: 30, content: 'Location:', variable: 'location' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 30, content: 'Date:', variable: 'event_date' }),
    el({ type: 'dynamic-field', x: 320, y: 150, width: 235, height: 30, content: 'Client:', variable: 'client_name' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 220, content: 'Production Items', rows: [
      { cells: ['Category', 'Item', 'Qty', 'Unit Price', 'Total'] },
      { cells: ['Audio', '{{service_name}}', '1', '{{price}}', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 480, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18 }),
    el({ type: 'notes', x: 40, y: 550, width: 515, height: 100, content: 'Setup begins 4 hours before event.' }),
  ], [...commonVars, 'event_name', 'location', 'service_name', 'price']),

  makeTemplate('freelancer-quote', 'Freelancer Quote', 'Freelance', 'Clean and modern quote template for freelancers', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 40, content: 'QUOTE', fontSize: 32, fontWeight: '700', fontFamily: 'Roboto' }),
    el({ type: 'dynamic-field', x: 40, y: 100, width: 300, height: 30, content: 'Prepared for:', variable: 'client_name' }),
    el({ type: 'dynamic-field', x: 40, y: 135, width: 300, height: 30, content: 'Date:', variable: 'event_date' }),
    el({ type: 'divider', x: 40, y: 180, width: 515, height: 2, content: '' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 180, content: 'Services', rows: [
      { cells: ['Service', 'Rate', 'Hours', 'Total'] },
      { cells: ['{{service_name}}', '{{price}}', '', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 420, width: 205, height: 35, content: 'Total:', variable: 'total', fontWeight: '700', fontSize: 18 }),
    el({ type: 'notes', x: 40, y: 490, width: 515, height: 80, content: 'This quote is valid for 30 days.' }),
  ], [...commonVars, 'service_name', 'price']),

  makeTemplate('creative-proposal', 'Creative Proposal', 'Creative', 'Bold proposal template for creative projects', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 50, content: 'CREATIVE PROPOSAL', fontSize: 30, fontWeight: '700', alignment: 'center', fontFamily: 'Merriweather' }),
    el({ type: 'divider', x: 150, y: 100, width: 295, height: 3, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 130, width: 515, height: 30, content: 'Client:', variable: 'client_name', alignment: 'center' }),
    el({ type: 'dynamic-field', x: 40, y: 165, width: 515, height: 30, content: 'Project:', variable: 'event_name', alignment: 'center' }),
    el({ type: 'text', x: 40, y: 220, width: 515, height: 25, content: 'SCOPE OF WORK', fontSize: 16, fontWeight: '600' }),
    el({ type: 'table', x: 40, y: 255, width: 515, height: 180, content: 'Deliverables', rows: [
      { cells: ['Phase', 'Deliverable', 'Timeline', 'Cost'] },
      { cells: ['Discovery', '{{service_name}}', '', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 470, width: 205, height: 35, content: 'Investment:', variable: 'total', fontWeight: '700', fontSize: 18 }),
  ], [...commonVars, 'event_name', 'service_name', 'price']),

  makeTemplate('simple-estimate', 'Simple Estimate', 'General', 'Straightforward estimate template with minimal layout', [
    el({ type: 'text', x: 40, y: 40, width: 300, height: 40, content: 'ESTIMATE', fontSize: 28, fontWeight: '700' }),
    el({ type: 'dynamic-field', x: 40, y: 100, width: 250, height: 25, content: 'To:', variable: 'client_name' }),
    el({ type: 'dynamic-field', x: 350, y: 100, width: 205, height: 25, content: 'Date:', variable: 'event_date' }),
    el({ type: 'divider', x: 40, y: 140, width: 515, height: 1, content: '' }),
    el({ type: 'table', x: 40, y: 160, width: 515, height: 200, content: 'Items', rows: [
      { cells: ['Description', 'Amount'] },
      { cells: ['{{service_name}}', '{{price}}'] },
    ]}),
    el({ type: 'price-field', x: 350, y: 390, width: 205, height: 28, content: 'Subtotal:', variable: 'subtotal' }),
    el({ type: 'price-field', x: 350, y: 422, width: 205, height: 28, content: 'Tax:', variable: 'tax' }),
    el({ type: 'total-calculation', x: 350, y: 458, width: 205, height: 32, content: 'Total:', variable: 'total', fontWeight: '700' }),
  ], [...commonVars, 'service_name', 'price']),

  makeTemplate('premium-proposal', 'Premium Proposal', 'Corporate', 'High-end proposal template with elegant serif typography', [
    el({ type: 'text', x: 40, y: 60, width: 515, height: 55, content: 'Premium Proposal', fontSize: 34, fontWeight: '700', fontFamily: 'Merriweather', alignment: 'center' }),
    el({ type: 'divider', x: 180, y: 125, width: 235, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 160, width: 515, height: 30, content: 'Prepared exclusively for', variable: 'client_name', alignment: 'center', fontFamily: 'Merriweather' }),
    el({ type: 'dynamic-field', x: 40, y: 200, width: 515, height: 30, content: 'Date:', variable: 'event_date', alignment: 'center' }),
    el({ type: 'text', x: 40, y: 260, width: 515, height: 25, content: 'EXECUTIVE SUMMARY', fontSize: 14, fontWeight: '600' }),
    el({ type: 'text', x: 40, y: 290, width: 515, height: 60, content: 'We are pleased to present this proposal for your consideration. Our team brings exceptional expertise and dedication to every project.' }),
    el({ type: 'table', x: 40, y: 370, width: 515, height: 160, content: 'Investment Summary', rows: [
      { cells: ['Service', 'Description', 'Investment'] },
      { cells: ['{{service_name}}', '', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 560, width: 205, height: 35, content: 'Total Investment:', variable: 'total', fontWeight: '700', fontSize: 18, fontFamily: 'Merriweather' }),
  ], [...commonVars, 'service_name', 'price']),

  makeTemplate('dj-services', 'DJ Services', 'Entertainment', 'Dynamic budget template for DJ and music services', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: '🎵 DJ SERVICES QUOTE', fontSize: 26, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 250, height: 28, content: 'Client:', variable: 'client_name' }),
    el({ type: 'dynamic-field', x: 40, y: 148, width: 250, height: 28, content: 'Event:', variable: 'event_name' }),
    el({ type: 'dynamic-field', x: 320, y: 115, width: 235, height: 28, content: 'Date:', variable: 'event_date' }),
    el({ type: 'dynamic-field', x: 320, y: 148, width: 235, height: 28, content: 'Venue:', variable: 'location' }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 200, content: 'Services', rows: [
      { cells: ['Service', 'Duration', 'Rate', 'Total'] },
      { cells: ['{{service_name}}', '4 hours', '{{price}}', '{{price}}'] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 440, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18 }),
    el({ type: 'notes', x: 40, y: 510, width: 515, height: 90, content: 'Includes setup, sound check, and breakdown. Travel fees may apply for venues beyond 50 miles.' }),
  ], [...commonVars, 'event_name', 'location', 'service_name', 'price']),

  makeTemplate('production-services', 'Production Services', 'Production', 'Detailed template for video/audio production budgets', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 45, content: 'PRODUCTION SERVICES', fontSize: 26, fontWeight: '700', alignment: 'center' }),
    el({ type: 'divider', x: 40, y: 95, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 115, width: 300, height: 28, content: 'Client:', variable: 'client_name' }),
    el({ type: 'dynamic-field', x: 40, y: 148, width: 300, height: 28, content: 'Project:', variable: 'event_name' }),
    el({ type: 'dynamic-field', x: 370, y: 115, width: 185, height: 28, content: 'Date:', variable: 'event_date' }),
    el({ type: 'text', x: 40, y: 195, width: 515, height: 22, content: 'PRE-PRODUCTION', fontSize: 14, fontWeight: '600' }),
    el({ type: 'table', x: 40, y: 225, width: 515, height: 100, content: 'Pre-Production', rows: [
      { cells: ['Task', 'Days', 'Day Rate', 'Total'] },
      { cells: ['Planning & Script', '2', '{{price}}', ''] },
    ]}),
    el({ type: 'text', x: 40, y: 345, width: 515, height: 22, content: 'PRODUCTION', fontSize: 14, fontWeight: '600' }),
    el({ type: 'table', x: 40, y: 375, width: 515, height: 100, content: 'Production', rows: [
      { cells: ['Task', 'Days', 'Day Rate', 'Total'] },
      { cells: ['{{service_name}}', '3', '{{price}}', ''] },
    ]}),
    el({ type: 'total-calculation', x: 350, y: 510, width: 205, height: 35, content: 'TOTAL:', variable: 'total', fontWeight: '700', fontSize: 18 }),
  ], [...commonVars, 'event_name', 'service_name', 'price']),

  makeTemplate('agency-quote', 'Agency Quote', 'Agency', 'Professional agency quote with modern layout', [
    el({ type: 'text', x: 40, y: 40, width: 515, height: 40, content: 'AGENCY QUOTE', fontSize: 28, fontWeight: '700' }),
    el({ type: 'text', x: 40, y: 80, width: 515, height: 20, content: 'Your Creative Partner', fontSize: 12, fontWeight: '400', color: '#64748B' }),
    el({ type: 'divider', x: 40, y: 110, width: 515, height: 2, content: '' }),
    el({ type: 'dynamic-field', x: 40, y: 130, width: 300, height: 28, content: 'Client:', variable: 'client_name' }),
    el({ type: 'dynamic-field', x: 40, y: 163, width: 300, height: 28, content: 'Project:', variable: 'event_name' }),
    el({ type: 'dynamic-field', x: 370, y: 130, width: 185, height: 28, content: 'Date:', variable: 'event_date' }),
    el({ type: 'table', x: 40, y: 215, width: 515, height: 200, content: 'Scope', rows: [
      { cells: ['Phase', 'Scope', 'Team', 'Budget'] },
      { cells: ['Strategy', '{{service_name}}', '2', '{{price}}'] },
    ]}),
    el({ type: 'price-field', x: 350, y: 445, width: 205, height: 28, content: 'Subtotal:', variable: 'subtotal' }),
    el({ type: 'price-field', x: 350, y: 478, width: 205, height: 28, content: 'Tax:', variable: 'tax' }),
    el({ type: 'total-calculation', x: 350, y: 515, width: 205, height: 35, content: 'Total:', variable: 'total', fontWeight: '700', fontSize: 18 }),
    el({ type: 'notes', x: 40, y: 580, width: 515, height: 80, content: '50% deposit required to begin work. Balance due upon project completion.' }),
  ], [...commonVars, 'event_name', 'service_name', 'price']),

  makeTemplate('minimal-invoice', 'Minimal Invoice', 'General', 'Ultra-clean invoice template with minimal design', [
    el({ type: 'text', x: 40, y: 50, width: 200, height: 40, content: 'INVOICE', fontSize: 32, fontWeight: '300' }),
    el({ type: 'dynamic-field', x: 350, y: 50, width: 205, height: 25, content: 'Date:', variable: 'event_date' }),
    el({ type: 'divider', x: 40, y: 100, width: 515, height: 1, content: '' }),
    el({ type: 'text', x: 40, y: 120, width: 100, height: 20, content: 'BILL TO', fontSize: 10, fontWeight: '600', color: '#64748B' }),
    el({ type: 'dynamic-field', x: 40, y: 142, width: 300, height: 28, content: '', variable: 'client_name', fontSize: 16 }),
    el({ type: 'table', x: 40, y: 200, width: 515, height: 180, content: 'Items', rows: [
      { cells: ['Description', 'Qty', 'Rate', 'Amount'] },
      { cells: ['{{service_name}}', '1', '{{price}}', '{{price}}'] },
    ]}),
    el({ type: 'divider', x: 350, y: 410, width: 205, height: 1, content: '' }),
    el({ type: 'total-calculation', x: 350, y: 425, width: 205, height: 30, content: 'Total Due:', variable: 'total', fontWeight: '600', fontSize: 16 }),
    el({ type: 'notes', x: 40, y: 520, width: 515, height: 60, content: 'Thank you for your business.', alignment: 'center', color: '#64748B' }),
  ], [...commonVars, 'service_name', 'price']),
];
