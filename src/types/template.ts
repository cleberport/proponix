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

export type FieldCategory = 'default' | 'input' | 'calculated';

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
  imageUrl?: string;
  objectFit?: 'cover' | 'contain' | 'fill';

  // 3-layer data model
  fieldCategory?: FieldCategory;
  defaultValue?: string;
  isVisible?: boolean;
  formula?: string; // e.g. "price * tax_rate", "price + tax"
}

export interface TableRow {
  cells: string[];
}

export interface TemplateSettings {
  taxRate: number;
  showTax: boolean;
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
  defaultValues?: Record<string, string>;
  inputFields?: string[];
  calculatedFields?: Record<string, string>; // variable -> formula
  settings?: TemplateSettings;
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
  'tax_rate',
  'subtotal',
  'tax',
  'total',
];

export const DEFAULT_INPUT_FIELDS = [
  'client_name',
  'event_name',
  'location',
  'event_date',
];

export const DEFAULT_CALCULATED_FIELDS: Record<string, string> = {
  subtotal: 'price',
  tax: 'price * tax_rate',
  total: 'price + tax',
};

export const DEFAULT_TEMPLATE_VALUES: Record<string, string> = {
  service_name: 'Professional Services',
  price: '1000',
  tax_rate: '0.10',
};

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
