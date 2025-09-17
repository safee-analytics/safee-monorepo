export interface InvoiceCreateRequest {
  type: "SALES" | "PURCHASE";
  customerId?: string;
  supplierId?: string;
  date: string;
  dueDate?: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface Invoice {
  id: string;
  number: string;
  type: "SALES" | "PURCHASE";
  date: string;
  total: number;
  status: string;
}
