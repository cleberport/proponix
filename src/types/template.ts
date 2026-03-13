export type ElementType =
  | 'text'
  | 'dynamic-field'
  | 'image'
  | 'logo'
  | 'divider'
  | 'table'
  | 'price-field'
  | 'total-calculation'
  | 'notes';

export interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  variable?: string;
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  alignment?: 'left' | 'center' | 'right';
  rows?: TableRow[];
}

export interface TableRow {
  cells: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  elements: CanvasElement[];
  variables: string[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface SavedTemplate extends Template {
  createdAt: string;
  updatedAt: string;
}

export const DEFAULT_VARIABLES = [
  'client_name',
  'event_name',
  'location',
  'event_date',
  'service_name',
  'price',
  'subtotal',
  'tax',
  'total',
];

export const ELEMENT_PALETTE: { type: ElementType; label: string; icon: string }[] = [
  { type: 'text', label: 'Text Block', icon: 'Type' },
  { type: 'dynamic-field', label: 'Dynamic Field', icon: 'Variable' },
  { type: 'image', label: 'Image', icon: 'Image' },
  { type: 'logo', label: 'Logo', icon: 'Stamp' },
  { type: 'divider', label: 'Divider', icon: 'Minus' },
  { type: 'table', label: 'Table', icon: 'Table' },
  { type: 'price-field', label: 'Price Field', icon: 'DollarSign' },
  { type: 'total-calculation', label: 'Total', icon: 'Calculator' },
  { type: 'notes', label: 'Notes', icon: 'StickyNote' },
];
