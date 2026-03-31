export type ElementType =
  | 'text'
  | 'dynamic-field'
  | 'image'
  | 'logo'
  | 'divider'
  | 'table'
  | 'price-field'
  | 'total-calculation'
  | 'notes'
  | 'service'
  | 'shape';

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
  textDecoration?: string;
  fontStyle?: 'normal' | 'italic'; // italic support
  lineHeight?: number; // e.g. 1.2, 1.4, 1.6, 2.0
  letterSpacing?: number; // em units, e.g. 0, 0.02, 0.05
  listType?: 'none' | 'bullet' | 'number'; // bullet points / numbered lists
  rows?: TableRow[];
  tableBorderColor?: string; // table border/grid color
  tableHeaderBg?: string; // table header row background
  tableRowBg?: string; // table body row background
  columnWidths?: number[]; // percentage widths per column
  imageUrl?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  objectPosition?: string; // e.g. 'center', 'top', 'bottom left'
  objectPositionX?: number; // manual horizontal position in %
  objectPositionY?: number; // manual vertical position in %
  imageScale?: number; // zoom factor, default 1 (1 = 100%)
  imageOffsetX?: number; // pan offset in px
  imageOffsetY?: number; // pan offset in px

  // Image editing properties
  rotation?: number; // degrees
  borderWidth?: number;
  borderColor?: string;
  borderRadius?: number;
  imageBrightness?: number; // 0-200, default 100
  imageContrast?: number; // 0-200, default 100
  imageSaturation?: number; // 0-200, default 100
  imageOpacity?: number; // 0-100, default 100
  locked?: boolean;
  cropX?: number; // percentage 0-100
  cropY?: number; // percentage 0-100
  cropWidth?: number; // percentage 0-100
  cropHeight?: number; // percentage 0-100

  // 3-layer data model
  fieldCategory?: FieldCategory;
  defaultValue?: string;
  isVisible?: boolean;
  formula?: string;

  // Service block
  serviceId?: string; // links to selected service at generation time
  serviceIndex?: number; // distinguishes multiple service blocks (0, 1, 2...)
  showPrice?: boolean; // toggle price visibility on service block (default true)
  bgOpacity?: number; // 0-100, default 100

  // Shape properties
  shapeColor?: string; // fill color for shape elements
  shapeBorderRadius?: number; // border radius in px
  shapeOpacity?: number; // 0-100, default 100
  shapeBorderWidth?: number; // border width in px
  shapeBorderColor?: string; // border color
}

export interface TableRow {
  cells: string[];
}

export interface TemplateSettings {
  taxRate: number;
  showTax: boolean;
  backgroundColor?: string;
}

export const TEMPLATE_COLORS = [
  '#ff2e5f', '#EC4899', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EF4444', '#14B8A6', '#F97316', '#06B6D4',
];

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  thumbnail: string;
  color?: string;
  /** @deprecated Use pages instead. Kept for backward compat. */
  elements: CanvasElement[];
  /** Multi-page support. Each entry is a page's elements. */
  pages?: CanvasElement[][];
  variables: string[];
  canvasWidth: number;
  canvasHeight: number;
  defaultValues?: Record<string, string>;
  inputFields?: string[];
  calculatedFields?: Record<string, string>;
  settings?: TemplateSettings;
}

export interface SavedTemplate extends Template {
  createdAt: string;
  updatedAt: string;
}

/** Helper: get pages array from a template (backward compat) */
export function getTemplatePages(t: Template): CanvasElement[][] {
  if (t.pages && t.pages.length > 0) return t.pages;
  return [t.elements || []];
}

/** Helper: flatten pages back to elements (for backward compat storage) */
export function flattenPages(pages: CanvasElement[][]): CanvasElement[] {
  return pages.flat();
}

export const DEFAULT_VARIABLES = [
  'client_name', 'event_name', 'location', 'event_date',
  'data_de_hoje', 'service_name', 'price', 'tax_rate',
  'subtotal', 'tax', 'total',
];

export const DEFAULT_INPUT_FIELDS = [
  'client_name', 'event_name', 'location', 'event_date',
];

export const DEFAULT_CALCULATED_FIELDS: Record<string, string> = {
  subtotal: 'price',
  tax: 'price * tax_rate',
  total: 'price + tax',
};

export const DEFAULT_TEMPLATE_VALUES: Record<string, string> = {
  service_name: 'Serviços Profissionais',
  price: '1000',
  tax_rate: '0.10',
};

export const ELEMENT_PALETTE: { type: ElementType; label: string; icon: string }[] = [
  { type: 'text', label: 'Bloco de Texto', icon: 'Type' },
  { type: 'dynamic-field', label: 'Campo Dinâmico', icon: 'Variable' },
  { type: 'shape', label: 'Forma', icon: 'Square' },
  { type: 'image', label: 'Imagem', icon: 'Image' },
  { type: 'logo', label: 'Logo', icon: 'Stamp' },
  { type: 'divider', label: 'Divisor', icon: 'Minus' },
  { type: 'table', label: 'Tabela', icon: 'Table' },
  { type: 'price-field', label: 'Campo de Preço', icon: 'DollarSign' },
  { type: 'total-calculation', label: 'Total', icon: 'Calculator' },
  { type: 'notes', label: 'Observações', icon: 'StickyNote' },
  { type: 'service', label: 'Serviço', icon: 'Package' },
];
