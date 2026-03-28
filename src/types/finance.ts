export type FinanceColumnType = 'text' | 'number' | 'currency' | 'date' | 'checkbox' | 'select' | 'formula';

export interface SelectOption {
  label: string;
  color: string;
}

export interface FinanceColumn {
  id: string;
  name: string;
  type: FinanceColumnType;
  width?: number;
  options?: SelectOption[];
  formula?: string;
}

export interface FinanceRow {
  id: string;
  cells: Record<string, any>;
}

export interface FinanceTableData {
  id: string;
  user_id: string;
  folder_id: string;
  name: string;
  columns: FinanceColumn[];
  rows: FinanceRow[];
  position: number;
  created_at: string;
  updated_at: string;
}

export interface FinanceFolderData {
  id: string;
  user_id: string;
  name: string;
  position: number;
  created_at: string;
  updated_at: string;
}
