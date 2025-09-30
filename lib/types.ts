export interface Product {
  id: number;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: number;
}

export interface BarCode {
  codigo_de_barras: string;
  produto_id: number;
  produto?: Product;
}

export interface ProductCount {
  id: string;
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: number;
  quant_loja: number;
  quant_estoque: number;
  total: number;
  local_estoque: string;
  data_hora: string;
}

export interface InventoryHistory {
  id: number;
  data_contagem: string;
  usuario_email: string;
  total_itens: number;
  local_estoque: string;
  status: string;
}

export interface CsvRow {
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: string;
}

export interface TempProduct {
  id: string;
  codigo_de_barras: string;
  codigo_produto: string;
  descricao: string;
  saldo_estoque: number;
  isTemporary: true;
}

export interface Location {
  value: string;
  label: string;
}
